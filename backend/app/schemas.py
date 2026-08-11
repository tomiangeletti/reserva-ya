from datetime import date, datetime, time
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

ESTADO_RESERVA = ("PENDIENTE", "CONFIRMADA", "EXPIRADA", "CANCELADA")


# ---------- Auth ----------
class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminMe(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str


# ---------- Canchas ----------
class CanchaCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    activo: bool = True


class CanchaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nombre: str
    activo: bool


# ---------- Turnos fijos ----------
class TurnoFijoCreate(BaseModel):
    cancha_id: UUID
    dia_semana: int = Field(ge=0, le=6)
    hora_inicio: time
    hora_fin: time | None = None
    nombre: str = Field(min_length=1, max_length=150)


class TurnoFijoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    cancha_id: UUID
    dia_semana: int
    hora_inicio: time
    hora_fin: time | None
    nombre: str | None
    activo: bool


# ---------- Bloqueos puntuales ----------
class BloqueoPuntualCreate(BaseModel):
    cancha_id: UUID
    fecha: date
    hora_inicio: time
    motivo: str = Field(min_length=1, max_length=200)


class BloqueoPuntualOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    cancha_id: UUID
    fecha: date
    hora_inicio: time
    motivo: str
    creado_por: str


# ---------- Reservas ----------
class ReservaCreate(BaseModel):
    cancha_id: UUID
    fecha: date
    hora_inicio: time
    nombre_cliente: str = Field(min_length=1, max_length=150)
    telefono_cliente: str = Field(min_length=6, max_length=30)


class ReservaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    cancha_id: UUID
    fecha: date
    hora_inicio: time
    nombre_cliente: str
    telefono_cliente: str
    precio_cancha: Decimal
    monto_senia: Decimal
    estado: str
    creado_en: datetime
    expira_en: datetime | None
    confirmado_en: datetime | None


class ReservaAdminOut(ReservaOut):
    cancha_nombre: str


# ---------- Disponibilidad / grilla ----------
class SlotPublico(BaseModel):
    hora_inicio: time
    disponible: bool


class SlotGrilla(BaseModel):
    hora_inicio: time
    estado: str
    reserva_id: UUID | None = None
    motivo: str | None = None
    nombre: str | None = None


class CanchaGrillaOut(BaseModel):
    cancha_id: UUID
    cancha_nombre: str
    slots: list[SlotGrilla]


class ReservasPendientesCount(BaseModel):
    count: int


# ---------- Configuracion ----------
class ConfiguracionClubOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    direccion: str
    alias_transferencia: str
    precio_cancha_default: Decimal
    monto_senia_default: Decimal
    adicional_pelotas: Decimal
    telefono_whatsapp: str
    hora_apertura: time
    hora_cierre: time


class ConfiguracionClubUpdate(BaseModel):
    direccion: str | None = Field(default=None, min_length=1, max_length=255)
    alias_transferencia: str | None = Field(
        default=None, min_length=1, max_length=100
    )
    precio_cancha_default: Decimal | None = Field(default=None, gt=0)
    monto_senia_default: Decimal | None = Field(default=None, gt=0)
    adicional_pelotas: Decimal | None = Field(default=None, ge=0)
    telefono_whatsapp: str | None = Field(default=None, max_length=30)
    hora_apertura: time | None = None
    hora_cierre: time | None = None

# ---------- Password Reset ----------
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)
