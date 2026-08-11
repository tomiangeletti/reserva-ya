from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.orm import Session
from uuid import UUID

from .database import get_db
from .models import AdminUsuario
from .security import decode_access_token

_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> AdminUsuario:
    if credentials is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
        )

    try:
        admin_id = UUID(decode_access_token(credentials.credentials))
    except (InvalidTokenError, ValueError):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )

    admin = db.get(AdminUsuario, admin_id)
    if admin is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )
    return admin
