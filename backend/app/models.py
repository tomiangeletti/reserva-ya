from datetime import date, datetime, time, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Time,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

ESTADOS_ACTIVOS = ("PENDIENTE", "CONFIRMADA")


class Base(DeclarativeBase):
    pass


class Cancha(Base):
    __tablename__ = "canchas"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    reservas: Mapped[list["Reserva"]] = relationship(back_populates="cancha")


class TurnoFijo(Base):
    """Bloqueo recurrente semanal (turno fijo del club)."""

    __tablename__ = "turnos_fijos"
    __table_args__ = (
        Index(
            "uq_turno_fijo_cancha_dia_hora",
            "cancha_id",
            "dia_semana",
            "hora_inicio",
            unique=True,
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    cancha_id: Mapped[int] = mapped_column(
        ForeignKey("canchas.id", ondelete="CASCADE")
    )
    dia_semana: Mapped[int] = mapped_column(Integer)
    hora_inicio: Mapped[time] = mapped_column(Time)
    hora_fin: Mapped[time | None] = mapped_column(Time)
    nombre: Mapped[str | None] = mapped_column(String(150))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    cancha: Mapped[Cancha] = relationship()


class BloqueoPuntual(Base):
    """Ocupado por WhatsApp u otro motivo, para una fecha/hora puntual."""

    __tablename__ = "bloqueos_puntuales"
    __table_args__ = (
        Index(
            "uq_bloqueo_cancha_fecha_hora",
            "cancha_id",
            "fecha",
            "hora_inicio",
            unique=True,
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    cancha_id: Mapped[int] = mapped_column(
        ForeignKey("canchas.id", ondelete="CASCADE")
    )
    fecha: Mapped[date] = mapped_column(Date)
    hora_inicio: Mapped[time] = mapped_column(Time)
    motivo: Mapped[str] = mapped_column(String(200))
    creado_por: Mapped[str] = mapped_column(String(100), default="admin")

    cancha: Mapped[Cancha] = relationship()


class Reserva(Base):
    __tablename__ = "reservas"
    __table_args__ = (
        Index(
            "uq_reserva_activa_cancha_fecha_hora",
            "cancha_id",
            "fecha",
            "hora_inicio",
            unique=True,
            sqlite_where=text("estado IN ('PENDIENTE', 'CONFIRMADA')"),
            postgresql_where=text("estado IN ('PENDIENTE', 'CONFIRMADA')"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    cancha_id: Mapped[int] = mapped_column(
        ForeignKey("canchas.id", ondelete="CASCADE")
    )
    fecha: Mapped[date] = mapped_column(Date)
    hora_inicio: Mapped[time] = mapped_column(Time)
    nombre_cliente: Mapped[str] = mapped_column(String(150))
    telefono_cliente: Mapped[str] = mapped_column(String(30))
    precio_cancha: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    monto_senia: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    estado: Mapped[str] = mapped_column(String(20), default="PENDIENTE")
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    expira_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    confirmado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    cancha: Mapped[Cancha] = relationship(back_populates="reservas")


class AdminUsuario(Base):
    __tablename__ = "admin_usuario"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=True)

class PasswordResetToken(Base):
    __tablename__ = "password_reset_token"

    id: Mapped[int] = mapped_column(primary_key=True)
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    admin_usuario_id: Mapped[int] = mapped_column(ForeignKey("admin_usuario.id"))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used: Mapped[bool] = mapped_column(default=False)

class ConfiguracionClub(Base):
    __tablename__ = "configuracion_club"

    id: Mapped[int] = mapped_column(primary_key=True)
    direccion: Mapped[str] = mapped_column(String(255))
    alias_transferencia: Mapped[str] = mapped_column(String(100))
    precio_cancha_default: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    monto_senia_default: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    adicional_pelotas: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0.00")
    )
    telefono_whatsapp: Mapped[str] = mapped_column(String(30), default="")
    hora_apertura: Mapped[time] = mapped_column(Time)
    hora_cierre: Mapped[time] = mapped_column(Time)
