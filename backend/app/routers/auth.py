from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..email_utils import send_reset_email

from ..database import get_db
from ..deps import get_current_admin
from ..models import AdminUsuario, PasswordResetToken, Club
from ..schemas import AdminMe, ForgotPasswordRequest, LoginRequest, ResetPasswordRequest, Token
from ..security import create_access_token, generate_reset_token, verify_password, hash_password
from ..tenant import resolve_public_tenant, PublicTenant, get_current_admin_tenant, AdminTenant
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> Token:
    tenant = resolve_public_tenant(request, db)
    admin = db.scalar(
        select(AdminUsuario).where(AdminUsuario.username == payload.username.lower(), 
        AdminUsuario.club_id == tenant.club.id)
    )
    if admin is None or not verify_password(
        payload.password, admin.password_hash
    ):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )

    if not admin.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Usuario no encontrado.'
        )

    return Token(access_token=create_access_token(str(admin.id)))


@router.get("/me", response_model=AdminMe)
def me(tenant: AdminTenant = Depends(get_current_admin_tenant)) -> AdminUsuario:
    return tenant.admin

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, request: Request,  db: Session = Depends(get_db)) -> dict:
    tenant = resolve_public_tenant(request, db)
    admin = db.scalar(
        select(AdminUsuario).where(AdminUsuario.email == payload.email.lower(), 
        AdminUsuario.club_id == tenant.club.id)
    )

    if admin is not None:
        token = generate_reset_token()
        reset_token = PasswordResetToken(
            token=token,
            admin_usuario_id=admin.id,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            used=False
        )
        db.add(reset_token)
        db.commit()

        send_reset_email(admin.email, token)
    return {"message": "Si el email existe, se enviara un correo para restablecer la contraseña."}



@router.post("/password/reset")
def reset_password(payload: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)) -> dict:
    tenant = resolve_public_tenant(request, db)

    reset_token = db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token == payload.token, PasswordResetToken.used == False
            )
    )

    if not reset_token or reset_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado.",
        )

    admin = db.scalar(
        select(AdminUsuario).where(AdminUsuario.id == reset_token.admin_usuario_id)
    )
    if not admin:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    if admin.club_id != tenant.club.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado."
        )

    hashed_password = hash_password(payload.new_password)
    admin.password_hash = hashed_password
    reset_token.used = True
    reset_token.used_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Contraseña restablecida exitosamente."}