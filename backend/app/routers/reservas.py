from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Cancha, Reserva
from ..schemas import (
    ReservaAdminOut,
    ReservaCreate,
    ReservaOut,
    ReservasPendientesCount,
)
from ..slots import SinConfiguracionError, get_configuracion, slots_del_dia
from ..tenant import AdminTenant, PublicTenant, get_current_admin_tenant, get_public_tenant

router = APIRouter(prefix="/reservas", tags=["reservas"])

TIMEOUT_MINUTOS = 30


@router.post("", response_model=ReservaOut, status_code=status.HTTP_201_CREATED)
def crear_reserva(
    payload: ReservaCreate,
    db: Session = Depends(get_db),
    tenant: PublicTenant = Depends(get_public_tenant),
) -> Reserva:
    cancha = db.scalar(
        select(Cancha).where(
            Cancha.id == payload.cancha_id,
            Cancha.club_id == tenant.club.id,
            Cancha.activo.is_(True),
        )
    )
    if cancha is None or not cancha.activo:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Cancha no encontrada o inactiva"
        )

    if payload.fecha < datetime.now().date():
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="No se puede reservar para el pasado.",
        )

    try:
        config = get_configuracion(db, tenant.club.id)
    except SinConfiguracionError as exc:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    try:
        slots = slots_del_dia(
            db,
            payload.cancha_id,
            payload.fecha,
            club_id=tenant.club.id,
        )
    except SinConfiguracionError as exc:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    if payload.hora_inicio not in slots:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Horario fuera de la grilla del club"
        )
    if slots[payload.hora_inicio]["estado"] != "libre":
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="El horario ya no está disponible."
        )

    ahora = datetime.now(timezone.utc)
    reserva = Reserva(
        club_id=tenant.club.id,
        cancha_id=payload.cancha_id,
        fecha=payload.fecha,
        hora_inicio=payload.hora_inicio,
        nombre_cliente=payload.nombre_cliente,
        telefono_cliente=payload.telefono_cliente,
        precio_cancha=config.precio_cancha_default,
        monto_senia=config.monto_senia_default,
        estado="PENDIENTE",
        creado_en=ahora,
        expira_en=ahora + timedelta(minutes=TIMEOUT_MINUTOS),
    )
    db.add(reserva)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="El horario ya no está disponible."
        )
    db.refresh(reserva)
    return reserva


@router.get("", response_model=list[ReservaAdminOut])
def listar_reservas(
    filtro: str = "todas",
    busqueda: str | None = None,
    tenant: AdminTenant = Depends(get_current_admin_tenant),
    db: Session = Depends(get_db),
):
    if filtro not in ("hoy", "proximas", "todas"):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="filtro debe ser 'hoy', 'proximas' o 'todas'",
        )

    query = select(Reserva, Cancha.nombre).join(
        Cancha, Reserva.cancha_id == Cancha.id
    ).where(Reserva.club_id == tenant.club.id)
    hoy = datetime.now().date()

    if filtro == "hoy":
        query = query.where(Reserva.fecha == hoy)
    elif filtro == "proximas":
        query = query.where(Reserva.fecha >= hoy)

    if busqueda and busqueda.strip():
        termino = f"%{busqueda.strip()}%"
        query = query.where(
            or_(
                Reserva.nombre_cliente.ilike(termino),
                Reserva.telefono_cliente.like(termino),
            )
        )

    if filtro == "proximas":
        query = query.order_by(Reserva.fecha.asc(), Reserva.hora_inicio.asc())
    else:
        query = query.order_by(Reserva.fecha.desc(), Reserva.hora_inicio.desc())

    filas = db.execute(query).all()
    return [
        ReservaAdminOut(
            **ReservaOut.model_validate(reserva).model_dump(),
            cancha_nombre=nombre_cancha,
        )
        for reserva, nombre_cancha in filas
    ]


@router.get("/pendientes/count", response_model=ReservasPendientesCount)
def contar_pendientes(
    tenant: AdminTenant = Depends(get_current_admin_tenant),
    db: Session = Depends(get_db),
):
    cantidad = db.scalar(
        select(func.count())
        .select_from(Reserva)
        .where(
            Reserva.club_id == tenant.club.id,
            Reserva.estado == "PENDIENTE",
        )
    )
    return ReservasPendientesCount(count=cantidad or 0)


@router.patch("/{reserva_id}/confirmar", response_model=ReservaOut)
def confirmar_reserva(
    reserva_id: UUID,
    tenant: AdminTenant = Depends(get_current_admin_tenant),
    db: Session = Depends(get_db),
) -> Reserva:
    reserva = db.scalar(
        select(Reserva).where(
            Reserva.id == reserva_id,
            Reserva.club_id == tenant.club.id,
        )
    )
    if reserva is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Reserva no encontrada"
        )
    if reserva.estado != "PENDIENTE":
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Solo se puede confirmar una reserva pendiente",
        )
    reserva.estado = "CONFIRMADA"
    reserva.confirmado_en = datetime.now(timezone.utc)
    db.commit()
    db.refresh(reserva)
    return reserva


@router.patch("/{reserva_id}/cancelar", response_model=ReservaOut)
def cancelar_reserva(
    reserva_id: UUID,
    tenant: AdminTenant = Depends(get_current_admin_tenant),
    db: Session = Depends(get_db),
) -> Reserva:
    reserva = db.scalar(
        select(Reserva).where(
            Reserva.id == reserva_id,
            Reserva.club_id == tenant.club.id,
        )
    )
    if reserva is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Reserva no encontrada"
        )
    if reserva.estado not in ("PENDIENTE", "CONFIRMADA"):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="La reserva ya no puede cancelarse",
        )
    reserva.estado = "CANCELADA"
    db.commit()
    db.refresh(reserva)
    return reserva
