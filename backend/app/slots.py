from datetime import date, datetime, time, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .models import (
    BloqueoPuntual,
    Cancha,
    ConfiguracionClub,
    Reserva,
    TurnoFijo,
)

ESTADOS_ACTIVOS = ("PENDIENTE", "CONFIRMADA")


class SinConfiguracionError(Exception):
    pass


def get_configuracion(
    db: Session,
    club_id: UUID,
) -> ConfiguracionClub:
    config = db.scalar(
        select(ConfiguracionClub)
        .where(ConfiguracionClub.club_id == club_id)
        .limit(1)
    )
    if config is None:
        raise SinConfiguracionError("El club no tiene configuración cargada")
    return config


def _cierre_como_fin(cierre: time) -> time:
    """'23:59' se usa en la config como 'cierra a la medianoche' (00:00)."""
    return time(0, 0) if cierre == time(23, 59) else cierre


DURACION_TURNO_MIN = 30
DURACION_TURNO_MAX = 240
DURACION_TURNO_PASO = 5


class ConfiguracionHorariaInvalida(ValueError):
    pass


def validar_configuracion_horaria(
    apertura: time, cierre: time, duracion_minutos: int
) -> list[time]:
    """Valida duración y horario; devuelve la grilla resultante."""
    if not (
        DURACION_TURNO_MIN <= duracion_minutos <= DURACION_TURNO_MAX
        and duracion_minutos % DURACION_TURNO_PASO == 0
    ):
        raise ConfiguracionHorariaInvalida(
            f"La duración del turno debe estar entre {DURACION_TURNO_MIN} y "
            f"{DURACION_TURNO_MAX} minutos, en múltiplos de {DURACION_TURNO_PASO}."
        )
    if apertura == cierre:
        raise ConfiguracionHorariaInvalida(
            "La hora de apertura y la de cierre no pueden ser iguales."
        )
    horas = generar_horas(apertura, cierre, duracion_minutos)
    if not horas:
        raise ConfiguracionHorariaInvalida(
            "Con ese horario no entra ningún turno de la duración elegida."
        )
    return horas


def ahora_local() -> datetime:
    """Fecha y hora actual en la zona horaria del club (no la del servidor)."""
    return datetime.now(ZoneInfo(settings.club_timezone))


def hoy_local() -> date:
    return ahora_local().date()


def slot_ya_paso(fecha: date, hora_inicio: time) -> bool:
    """True si el turno ya empezó (o es de un día anterior)."""
    ahora = ahora_local()
    if fecha != ahora.date():
        return fecha < ahora.date()
    return hora_inicio <= ahora.time().replace(tzinfo=None)


def generar_horas(apertura: time, cierre: time, duracion_minutos: int) -> list[time]:
    """Grilla de horas de inicio de turno."""
    if duracion_minutos <= 0:
        # Defensa: una duración no positiva haría un loop infinito.
        return []
    minutos = timedelta(minutes=duracion_minutos)
    base = datetime(2000, 1, 1)
    inicio = datetime.combine(base, apertura)
    fin = datetime.combine(base, _cierre_como_fin(cierre))
    if fin <= inicio:
        # Cierre pasada la medianoche (00:00) o una hora menor que la apertura:
        # el cierre pertenece al día siguiente.
        fin += timedelta(days=1)
    horas: list[time] = []
    actual = inicio
    while actual + minutos <= fin:
        horas.append(actual.time())
        actual += minutos
    return horas


def hora_fin_valida(
    hora_fin: time, horas: list[time], cierre: time, duracion_minutos: int
) -> bool:
    """Un fin válido es el final de algún turno de la grilla o el cierre del club."""
    if hora_fin == _cierre_como_fin(cierre):
        return True
    duracion = timedelta(minutes=duracion_minutos)
    base = datetime(2000, 1, 1)
    finales = {(datetime.combine(base, h) + duracion).time() for h in horas}
    return hora_fin in finales


def dia_semana_domingo_inicio(fecha: date) -> int:
    """Convierte fecha a día de semana con 0=domingo."""
    return (fecha.weekday() + 1) % 7


def _turno_slots(hora_inicio: time, hora_fin: time | None, horas: list[time]) -> list[time]:
    """Horas de inicio de turno que cubre un turno fijo (rango [inicio, fin))."""
    if hora_fin is None:
        return [h for h in horas if h == hora_inicio]
    if hora_fin > hora_inicio:
        return [h for h in horas if hora_inicio <= h < hora_fin]
    return [h for h in horas if h >= hora_inicio]


def slots_del_dia(
    db: Session,
    cancha_id: UUID,
    fecha: date,
    club_id: UUID,
) -> dict[time, dict]:
    """Estado de cada slot del día para una cancha.

    Devuelve {hora_inicio: {estado, reserva_id, motivo, nombre}} con estado en
    'libre' | 'reserva_pendiente' | 'reserva_confirmada' | 'turno_fijo' | 'bloqueo'.
    La reserva tiene prioridad sobre el resto al pintar un slot.
    """
    config = get_configuracion(db, club_id)
    horas = generar_horas(config.hora_apertura, config.hora_cierre, config.duracion_turno)

    reserva_query = select(Reserva).where(
        Reserva.club_id == club_id,
        Reserva.cancha_id == cancha_id,
        Reserva.fecha == fecha,
        Reserva.estado.in_(ESTADOS_ACTIVOS),
    )
    bloqueo_query = select(BloqueoPuntual).where(
        BloqueoPuntual.club_id == club_id,
        BloqueoPuntual.cancha_id == cancha_id,
        BloqueoPuntual.fecha == fecha,
    )
    turno_query = select(TurnoFijo).where(
        TurnoFijo.club_id == club_id,
        TurnoFijo.cancha_id == cancha_id,
        TurnoFijo.activo.is_(True),
        TurnoFijo.dia_semana == dia_semana_domingo_inicio(fecha),
    )
    reservas = db.scalars(reserva_query).all()
    bloqueos = db.scalars(bloqueo_query).all()
    turnos = db.scalars(turno_query).all()

    slots: dict[time, dict] = {
        h: {
            "estado": "libre",
            "reserva_id": None,
            "motivo": None,
            "nombre": None,
        }
        for h in horas
    }

    for reserva in reservas:
        if reserva.hora_inicio in slots:
            slots[reserva.hora_inicio] = {
                "estado": (
                    "reserva_pendiente"
                    if reserva.estado == "PENDIENTE"
                    else "reserva_confirmada"
                ),
                "reserva_id": reserva.id,
                "motivo": None,
                "nombre": reserva.nombre_cliente,
            }

    for bloqueo in bloqueos:
        if (
            bloqueo.hora_inicio in slots
            and slots[bloqueo.hora_inicio]["estado"] == "libre"
        ):
            slots[bloqueo.hora_inicio] = {
                "estado": "bloqueo",
                "reserva_id": None,
                "motivo": bloqueo.motivo,
                "nombre": None,
            }

    for turno in turnos:
        for hora in _turno_slots(turno.hora_inicio, turno.hora_fin, horas):
            if slots[hora]["estado"] == "libre":
                slots[hora] = {
                    "estado": "turno_fijo",
                    "reserva_id": None,
                    "motivo": None,
                    "nombre": turno.nombre,
                }

    return slots


def grilla_de_dia(
    db: Session,
    fecha: date,
    club_id: UUID,
) -> list[dict]:
    """Grilla de todos los slots de cada cancha activa para un día."""
    canchas = db.scalars(
        select(Cancha)
        .where(
            Cancha.club_id == club_id,
            Cancha.activo.is_(True),
        )
        .order_by(Cancha.id)
    ).all()
    return [
        {
            "cancha_id": cancha.id,
            "cancha_nombre": cancha.nombre,
            "slots": slots_del_dia(
                db,
                cancha.id,
                fecha,
                club_id=club_id,
            ),
        }
        for cancha in canchas
    ]
