from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_admin
from ..models import AdminUsuario
from ..schemas import AdminMe, LoginRequest, Token
from ..security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    admin = db.scalar(
        select(AdminUsuario).where(AdminUsuario.username == payload.username.lower())
    )
    if admin is None or not verify_password(
        payload.password, admin.password_hash
    ):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )

    return Token(access_token=create_access_token(str(admin.id)))


@router.get("/me", response_model=AdminMe)
def me(admin: AdminUsuario = Depends(get_current_admin)) -> AdminUsuario:
    return admin
