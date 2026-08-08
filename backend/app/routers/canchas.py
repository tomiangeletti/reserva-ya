from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Cancha
from ..schemas import CanchaOut

router = APIRouter(prefix="/canchas", tags=["canchas"])


@router.get("", response_model=list[CanchaOut])
def listar_canchas(db: Session = Depends(get_db)) -> list[Cancha]:
    return db.scalars(
        select(Cancha).where(Cancha.activo.is_(True)).order_by(Cancha.id)
    ).all()