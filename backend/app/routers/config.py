from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ConfiguracionClub
from ..schemas import (
    ConfiguracionClubOut,
    ConfiguracionClubUpdate,
)
from ..slots import SinConfiguracionError, get_configuracion
from ..tenant import (
    AdminTenant,
    PublicTenant,
    get_current_admin_tenant,
    get_public_tenant,
)

router = APIRouter(prefix="/config", tags=["config"])


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

    cambios = payload.model_dump(exclude_unset=True)
    for campo, valor in cambios.items():
        setattr(config, campo, valor)

    db.commit()
    db.refresh(config)
    return config
