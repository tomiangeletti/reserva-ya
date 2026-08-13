from dataclasses import dataclass
from uuid import UUID
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import Club, ClubSuscripcion, AdminUsuario
from .security import decode_access_token

_bearer_scheme = HTTPBearer(auto_error=False)

@dataclass(frozen=True)
class PublicTenant:
    club: Club
    suscripcion: ClubSuscripcion

@dataclass(frozen=True)
class AdminTenant:
    club: Club
    suscripcion: ClubSuscripcion
    admin: AdminUsuario


#----------/VALIDAR TENANTS/-------------
def tenant_not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Recurso no encontrado.",
    )


def get_request_subdomain(request: Request) -> str:
    hostname = request.url.hostname
    if not hostname:
        raise tenant_not_found()

    hostname = hostname.lower().rstrip(".")
    suffix = f".{settings.tenant_base_domain.lower().strip('.')}"

    if not hostname.endswith(suffix):
        raise tenant_not_found()

    subdomain = hostname[: -len(suffix)]

    if not subdomain or "." in subdomain:
        raise tenant_not_found()

    return subdomain


def resolve_public_tenant(
    request: Request,
    db: Session,
) -> PublicTenant:
    subdomain = get_request_subdomain(request)

    result = db.execute(
        select(Club, ClubSuscripcion)
        .join(ClubSuscripcion, ClubSuscripcion.club_id == Club.id)
        .where(
            Club.subdominio == subdomain,
            Club.activo.is_(True),
        )
    ).one_or_none()

    if result is None:
        raise tenant_not_found()

    club, subscription = result

    require_valid_suscripcion(suscripcion=subscription)

    return PublicTenant(club=club, suscripcion=subscription)

def get_public_tenant(
    request: Request,
    db: Session = Depends(get_db),
) -> PublicTenant:
    return resolve_public_tenant(request, db)

def get_current_admin_tenant(
        credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
        db: Session = Depends(get_db),
) -> AdminTenant:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado"
        )
    try:
        admin_id = UUID(decode_access_token(credentials.credentials))
    except(InvalidTokenError, ValueError):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )
    admin = db.get(AdminUsuario, admin_id)
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )
    club = db.get(Club, admin.club_id)
    if club is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club no encontrado"
        )
    club_suscripcion = db.execute(
        select(ClubSuscripcion).where(ClubSuscripcion.club_id == club.id)
    ).scalar_one_or_none()

    if club_suscripcion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El club no tiene suscripcion."
        )

    if not admin.activo or not club.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Usuario no encontrado.'
        )

    require_valid_suscripcion(club_suscripcion)

    return AdminTenant(admin=admin, club=club, suscripcion=club_suscripcion)

#----------/VALIDAR SUSCRIPCION/-------------
def require_valid_suscripcion(
        suscripcion: ClubSuscripcion
) -> None:
    now = datetime.now(timezone.utc)

    if suscripcion.estado == "ACTIVO":
        return

    if (suscripcion.estado == "TRIAL" 
        and suscripcion.trial_expira_en is not None 
        and suscripcion.trial_expira_en > now
        ):
        return

    raise tenant_not_found()
