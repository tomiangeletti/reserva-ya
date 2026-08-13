from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Cancha
from ..schemas import CanchaOut
from ..tenant import PublicTenant, get_public_tenant

router = APIRouter(prefix="/canchas", tags=["canchas"])


@router.get("", response_model=list[CanchaOut])
def listar_canchas(
    db: Session = Depends(get_db),
    tenant: PublicTenant = Depends(get_public_tenant),
) -> list[Cancha]:
    return db.scalars(
        select(Cancha)
        .where(
            Cancha.activo.is_(True),
            Cancha.club_id == tenant.club.id,
        )
        .order_by(Cancha.id)
    ).all()
