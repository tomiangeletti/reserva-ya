from datetime import date, time, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_admin
from ..models import (
    AdminUsuario,
    BloqueoPuntual,
    Cancha,
    Reserva,
    TurnoFijo,
)
from ..schemas import (
    BloqueoPuntualCreate,
    BloqueoPuntualOut,
    CanchaGrillaOut,
    SlotGrilla,
    TurnoFijoCreate,
    TurnoFijoOut,
)
from ..slots import (
    ESTADOS_ACTIVOS,
    SinConfiguracionError,
    _cierre_como_fin,
    _turno_slots,
    generar_horas,
    get_configuracion,
    grilla_de_dia,
    slots_del_dia,
    hora_fin_valida,
)

router = APIRouter(tags=["admin"])


def _validar_cancha_y_hora(db: Session, cancha_id: int, hora) -> Cancha:
    cancha = db.get(Cancha, cancha_id)
    if cancha is None or not cancha.activo:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Cancha no encontrada o inactiva"
        )
    try:
        config = get_configuracion(db)
    except SinConfiguracionError as exc:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    if hora not in generar_horas(config.hora_apertura, config.hora_cierre):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Horario fuera de la grilla del club"
        )
    return cancha


def _slot_out(hora: time, info: dict) -> SlotGrilla:
    return SlotGrilla(
        hora_inicio=hora,
        estado=info["estado"],
        reserva_id=info["reserva_id"],
        motivo=info["motivo"],
        nombre=info["nombre"],
    )


@router.get("/canchas/grilla", response_model=list[CanchaGrillaOut])
def grilla_todas_las_canchas(
    fecha: date,
    admin: AdminUsuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    try:
        datos = grilla_de_dia(db, fecha)
    except SinConfiguracionError as exc:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    return [
        CanchaGrillaOut(
            cancha_id=c["cancha_id"],
            cancha_nombre=c["cancha_nombre"],
            slots=[_slot_out(hora, info) for hora, info in sorted(c["slots"].items())],
        )
        for c in datos
    ]


@router.get("/canchas/{cancha_id}/grilla", response_model=list[SlotGrilla])
def grilla_dia(
    cancha_id: int,
    fecha: date,
    admin: AdminUsuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    cancha = db.get(Cancha, cancha_id)
    if cancha is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Cancha no encontrada"
        )
    try:
        slots = slots_del_dia(db, cancha_id, fecha)
    except SinConfiguracionError as exc:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    return [_slot_out(hora, info) for hora, info in sorted(slots.items())]


@router.get("/turnos-fijos", response_model=list[TurnoFijoOut])
def listar_turnos_fijos(
    admin: AdminUsuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(TurnoFijo).order_by(
            TurnoFijo.dia_semana, TurnoFijo.hora_inicio
        )
    ).all()


@router.post(
    "/turnos-fijos", response_model=TurnoFijoOut, status_code=status.HTTP_201_CREATED
)
def crear_turno_fijo(
    payload: TurnoFijoCreate,
    admin: AdminUsuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    _validar_cancha_y_hora(db, payload.cancha_id, payload.hora_inicio)
    try:
        config = get_configuracion(db)
    except SinConfiguracionError as exc:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    horas = generar_horas(config.hora_apertura, config.hora_cierre)

    if payload.hora_fin is not None:
        if not hora_fin_valida(payload.hora_fin, horas, config.hora_cierre):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="El horario de fin debe ser un final válido de la grilla del club",
            )
        if payload.hora_fin != _cierre_como_fin(config.hora_cierre) and payload.hora_fin <= payload.hora_inicio:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="El horario de fin debe ser posterior al inicio",
            )

    nuevos = set(_turno_slots(payload.hora_inicio, payload.hora_fin, horas))
    existentes = db.scalars(
        select(TurnoFijo).where(
            TurnoFijo.cancha_id == payload.cancha_id,
            TurnoFijo.dia_semana == payload.dia_semana,
        )
    ).all()
    for turno in existentes:
        if set(_turno_slots(turno.hora_inicio, turno.hora_fin, horas)) & nuevos:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail="Ya existe un turno fijo que cubre ese horario",
            )

    turno = TurnoFijo(**payload.model_dump())
    db.add(turno)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Ya existe ese turno fijo para esa cancha/día/hora",
        )
    db.refresh(turno)
    return turno


@router.delete("/turnos-fijos/{turno_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_turno_fijo(
    turno_id: int,
    admin: AdminUsuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    turno = db.get(TurnoFijo, turno_id)
    if turno is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Turno fijo no encontrado"
        )
    db.delete(turno)
    db.commit()


@router.patch("/turnos-fijos/{turno_id}", response_model=TurnoFijoOut)
def alternar_turno_fijo(
    turno_id: int,
    admin: AdminUsuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    turno = db.get(TurnoFijo, turno_id)
    if turno is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Turno fijo no encontrado"
        )
    turno.activo = not turno.activo
    db.commit()
    db.refresh(turno)
    return turno


@router.get("/bloqueos-puntuales", response_model=list[BloqueoPuntualOut])
def listar_bloqueos_puntuales(
    fecha: date | None = None,
    admin: AdminUsuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = select(BloqueoPuntual)
    if fecha is not None:
        query = query.where(BloqueoPuntual.fecha == fecha)
    return db.scalars(
        query.order_by(BloqueoPuntual.fecha, BloqueoPuntual.hora_inicio)
    ).all()


@router.post(
    "/bloqueos-puntuales",
    response_model=BloqueoPuntualOut,
    status_code=status.HTTP_201_CREATED,
)
def crear_bloqueo_puntual(
    payload: BloqueoPuntualCreate,
    admin: AdminUsuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    _validar_cancha_y_hora(db, payload.cancha_id, payload.hora_inicio)

    hay_reserva = db.scalar(
        select(Reserva.id).where(
            Reserva.cancha_id == payload.cancha_id,
            Reserva.fecha == payload.fecha,
            Reserva.hora_inicio == payload.hora_inicio,
            Reserva.estado.in_(ESTADOS_ACTIVOS),
        )
    )
    if hay_reserva:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Ya existe una reserva para ese horario",
        )

    bloqueo = BloqueoPuntual(
        **payload.model_dump(), creado_por=admin.username
    )
    db.add(bloqueo)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="Ese horario ya está bloqueado"
        )
    db.refresh(bloqueo)
    return bloqueo


@router.delete(
    "/bloqueos-puntuales/{bloqueo_id}", status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_bloqueo_puntual(
    bloqueo_id: int,
    admin: AdminUsuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    bloqueo = db.get(BloqueoPuntual, bloqueo_id)
    if bloqueo is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Bloqueo no encontrado"
        )
    db.delete(bloqueo)
    db.commit()
