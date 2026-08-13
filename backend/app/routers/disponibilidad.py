from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Cancha
from ..schemas import SlotPublico
from ..slots import SinConfiguracionError, slots_del_dia
from ..tenant import PublicTenant, get_public_tenant

router = APIRouter(prefix="/disponibilidad", tags=["disponibilidad"])


@router.get("", response_model=list[SlotPublico])
def disponibilidad(
    cancha_id: UUID,
    fecha: date,
    db: Session = Depends(get_db),
    tenant: PublicTenant = Depends(get_public_tenant),
):
    cancha = db.scalar(
        select(Cancha).where(
            Cancha.id == cancha_id,
            Cancha.club_id == tenant.club.id,
            Cancha.activo.is_(True),
        )
    )
    if cancha is None or not cancha.activo:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Cancha no encontrada o inactiva"
        )

    try:
        slots = slots_del_dia(
            db,
            cancha_id,
            fecha,
            club_id=tenant.club.id,
        )
    except SinConfiguracionError as exc:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    return [
        SlotPublico(hora_inicio=hora, disponible=info["estado"] == "libre")
        for hora, info in sorted(slots.items())
    ]
