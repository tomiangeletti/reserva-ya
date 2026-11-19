from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import BloqueoPuntual, ConfiguracionClub, Reserva, TurnoFijo
from ..schemas import (
    ConfiguracionClubOut,
    ConfiguracionClubUpdate,
)
from ..slots import (
    ESTADOS_ACTIVOS,
    ConfiguracionHorariaInvalida,
    SinConfiguracionError,
    get_configuracion,
    hora_fin_valida,
    hoy_local,
    validar_configuracion_horaria,
)
from ..tenant import (
    AdminTenant,
    PublicTenant,
    get_current_admin_tenant,
    get_public_tenant,
)

router = APIRouter(prefix="/config", tags=["config"])

CAMPOS_HORARIOS = ("hora_apertura", "hora_cierre", "duracion_turno")


@router.get("", response_model=ConfiguracionClubOut)
def obtener_configuracion(
    db: Session = Depends(get_db),
    tenant: PublicTenant = Depends(get_public_tenant),
):
    try:
        config = get_configuracion(db, tenant.club.id)
    except SinConfiguracionError as exc:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    return config


def _conflictos_con_nueva_grilla(
    db: Session,
    club_id,
    horas,
    hora_cierre,
    duracion_turno: int,
) -> list[str]:
    """Describe lo que quedaría fuera de la grilla nueva.

    Todas las ocupaciones (reservas, bloqueos, turnos fijos) se guardan por hora
    de inicio. Si la grilla cambia y alguna deja de coincidir, desaparece de la
    vista y puede solaparse con un turno nuevo, así que no se permite el cambio.
    """
    horas_set = set(horas)
    hoy = hoy_local()
    conflictos: list[str] = []

    reservas = db.scalars(
        select(Reserva).where(
            Reserva.club_id == club_id,
            Reserva.fecha >= hoy,
            Reserva.estado.in_(ESTADOS_ACTIVOS),
        )
    ).all()
    n = sum(1 for r in reservas if r.hora_inicio not in horas_set)
    if n:
        conflictos.append(f"{n} reserva(s) activa(s)")

    bloqueos = db.scalars(
        select(BloqueoPuntual).where(
            BloqueoPuntual.club_id == club_id,
            BloqueoPuntual.fecha >= hoy,
        )
    ).all()
    n = sum(1 for b in bloqueos if b.hora_inicio not in horas_set)
    if n:
        conflictos.append(f"{n} bloqueo(s) puntual(es)")

    turnos = db.scalars(
        select(TurnoFijo).where(TurnoFijo.club_id == club_id)
    ).all()
    n = sum(
        1
        for t in turnos
        if t.hora_inicio not in horas_set
        or (
            t.hora_fin is not None
            and not hora_fin_valida(t.hora_fin, horas, hora_cierre, duracion_turno)
        )
    )
    if n:
        conflictos.append(f"{n} turno(s) fijo(s)")

    return conflictos


@router.patch("", response_model=ConfiguracionClubOut)
def actualizar_configuracion(
    payload: ConfiguracionClubUpdate,
    tenant: AdminTenant = Depends(get_current_admin_tenant),
    db: Session = Depends(get_db),
):
    config = db.scalar(
        select(ConfiguracionClub).where(
            ConfiguracionClub.club_id == tenant.club.id,
        )
    )
    if config is None:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="El club no tiene configuración cargada",
        )

    # Un null explícito no borra un campo obligatorio: se ignora.
    cambios = {
        campo: valor
        for campo, valor in payload.model_dump(exclude_unset=True).items()
        if valor is not None
    }

    nuevo = {campo: cambios.get(campo, getattr(config, campo)) for campo in CAMPOS_HORARIOS}
    cambia_grilla = any(nuevo[c] != getattr(config, c) for c in CAMPOS_HORARIOS)

    if cambia_grilla:
        try:
            horas = validar_configuracion_horaria(
                nuevo["hora_apertura"], nuevo["hora_cierre"], nuevo["duracion_turno"]
            )
        except ConfiguracionHorariaInvalida as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))

        conflictos = _conflictos_con_nueva_grilla(
            db,
            tenant.club.id,
            horas,
            nuevo["hora_cierre"],
            nuevo["duracion_turno"],
        )
        if conflictos:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail=(
                    "No se puede cambiar el horario o la duración del turno: "
                    f"{', '.join(conflictos)} no coinciden con la nueva grilla. "
                    "Cancelalos o liberalos primero, o elegí un horario compatible."
                ),
            )

    for campo, valor in cambios.items():
        setattr(config, campo, valor)

    db.commit()
    db.refresh(config)
    return config
