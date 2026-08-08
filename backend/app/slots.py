from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import (
    BloqueoPuntual,
    Cancha,
    ConfiguracionClub,
    Reserva,
    TurnoFijo,
)

DURACION_TURNO = timedelta(minutes=90)
ESTADOS_ACTIVOS = ("PENDIENTE", "CONFIRMADA")


class SinConfiguracionError(Exception):
    pass


def get_configuracion(db: Session) -> ConfiguracionClub:
    config = db.scalar(select(ConfiguracionClub).limit(1))
    if config is None:
        raise SinConfiguracionError("El club no tiene configuración cargada")
    return config


def _cierre_como_fin(cierre: time) -> time:
    """'23:59' se usa en la config como 'cierra a la medianoche' (00:00)."""
    return time(0, 0) if cierre == time(23, 59) else cierre


def generar_horas(apertura: time, cierre: time) -> list[time]:
    """Grilla de horas de inicio de turno (turnos de 1h30)."""
    base = datetime(2000, 1, 1)
    inicio = datetime.combine(base, apertura)
    fin = datetime.combine(base, _cierre_como_fin(cierre))
    if fin <= inicio:
        # Cierre pasada la medianoche (00:00) o una hora menor que la apertura:
        # el cierre pertenece al día siguiente.
        fin += timedelta(days=1)
    horas: list[time] = []
    actual = inicio
    while actual + DURACION_TURNO <= fin:
        horas.append(actual.time())
        actual += DURACION_TURNO
    return horas


def hora_fin_valida(hora_fin: time, horas: list[time], cierre: time) -> bool:
    """Permite cierre a la hora del club, incluso si es medianoche."""
    if hora_fin == _cierre_como_fin(cierre):
        return True
    return hora_fin in horas


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


def slots_del_dia(db: Session, cancha_id: int, fecha: date) -> dict[time, dict]:
    """Estado de cada slot del día para una cancha.

    Devuelve {hora_inicio: {estado, reserva_id, motivo, nombre}} con estado en
    'libre' | 'reserva_pendiente' | 'reserva_confirmada' | 'turno_fijo' | 'bloqueo'.
    La reserva tiene prioridad sobre el resto al pintar un slot.
    """
    config = get_configuracion(db)
    horas = generar_horas(config.hora_apertura, config.hora_cierre)

    reservas = db.scalars(
        select(Reserva).where(
            Reserva.cancha_id == cancha_id,
            Reserva.fecha == fecha,
            Reserva.estado.in_(ESTADOS_ACTIVOS),
        )
    ).all()
    bloqueos = db.scalars(
        select(BloqueoPuntual).where(
            BloqueoPuntual.cancha_id == cancha_id,
            BloqueoPuntual.fecha == fecha,
        )
    ).all()
    turnos = db.scalars(
        select(TurnoFijo).where(
            TurnoFijo.cancha_id == cancha_id,
            TurnoFijo.activo.is_(True),
            TurnoFijo.dia_semana == dia_semana_domingo_inicio(fecha),
        )
    ).all()

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


def grilla_de_dia(db: Session, fecha: date) -> list[dict]:
    """Grilla de todos los slots de cada cancha activa para un día."""
    canchas = db.scalars(
        select(Cancha).where(Cancha.activo.is_(True)).order_by(Cancha.id)
    ).all()
    return [
        {
            "cancha_id": cancha.id,
            "cancha_nombre": cancha.nombre,
            "slots": slots_del_dia(db, cancha.id, fecha),
        }
        for cancha in canchas
    ]
