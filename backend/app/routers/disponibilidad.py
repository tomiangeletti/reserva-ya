from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Cancha
from ..schemas import SlotPublico
from ..slots import SinConfiguracionError, slots_del_dia

router = APIRouter(prefix="/disponibilidad", tags=["disponibilidad"])


@router.get("", response_model=list[SlotPublico])
def disponibilidad(
    cancha_id: int,
    fecha: date,
    db: Session = Depends(get_db),
):
    cancha = db.get(Cancha, cancha_id)
    if cancha is None or not cancha.activo:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Cancha no encontrada o inactiva"
        )

    try:
        slots = slots_del_dia(db, cancha_id, fecha)
    except SinConfiguracionError as exc:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    return [
        SlotPublico(hora_inicio=hora, disponible=info["estado"] == "libre")
        for hora, info in sorted(slots.items())
    ]