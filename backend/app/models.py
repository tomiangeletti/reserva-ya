from datetime import date, datetime, time, timezone
from decimal import Decimal
import uuid


from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    CheckConstraint,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    Numeric,
    String,
    Time,
    UniqueConstraint,
    text,
    UUID,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

ESTADOS_ACTIVOS = ("PENDIENTE", "CONFIRMADA")


class Base(DeclarativeBase):
    pass


class Cancha(Base):
    __tablename__ = "canchas"
    __table_args__ = (
        UniqueConstraint(
            "club_id",
            "nombre",
            name="uq_cancha_club_nombre",
        ),
        UniqueConstraint(
            "club_id",
            "id",
            name="uq_cancha_club_id",
        ),
    )

    club_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clubs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    reservas: Mapped[list["Reserva"]] = relationship(back_populates="cancha")


class TurnoFijo(Base):
    """Bloqueo recurrente semanal (turno fijo del club)."""

    __tablename__ = "turnos_fijos"
    __table_args__ = (
        Index(
            "uq_turno_fijo_club_cancha_dia_hora",
            "club_id",
            "cancha_id",
            "dia_semana",
            "hora_inicio",
            unique=True,
        ),
        ForeignKeyConstraint(
            ["club_id", "cancha_id"],
            ["canchas.club_id", "canchas.id"],
            ondelete="CASCADE",
        ),
    )

    club_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clubs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    cancha_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    dia_semana: Mapped[int] = mapped_column(Integer)
    hora_inicio: Mapped[time] = mapped_column(Time)
    hora_fin: Mapped[time | None] = mapped_column(Time)
    nombre: Mapped[str | None] = mapped_column(String(150))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    cancha: Mapped[Cancha] = relationship()


class BloqueoPuntual(Base):
    """Ocupado por WhatsApp u otro motivo, para una fecha/hora puntual."""

    __tablename__ = "bloqueos_puntuales"
    __table_args__ = (
        Index(
            "uq_bloqueo_club_cancha_fecha_hora",
            "club_id",
            "cancha_id",
            "fecha",
            "hora_inicio",
            unique=True,
        ),
        ForeignKeyConstraint(
            ["club_id", "cancha_id"],
            ["canchas.club_id", "canchas.id"],
            ondelete="CASCADE",
        ),
    )

    club_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clubs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    cancha_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    fecha: Mapped[date] = mapped_column(Date)
    hora_inicio: Mapped[time] = mapped_column(Time)
    motivo: Mapped[str] = mapped_column(String(200))
    creado_por: Mapped[str] = mapped_column(String(100), default="admin")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    cancha: Mapped[Cancha] = relationship()


class Reserva(Base):
    __tablename__ = "reservas"
    __table_args__ = (
        Index(
            "uq_reserva_activa_club_cancha_fecha_hora",
            "club_id",
            "cancha_id",
            "fecha",
            "hora_inicio",
            unique=True,
            sqlite_where=text("estado IN ('PENDIENTE', 'CONFIRMADA')"),
            postgresql_where=text("estado IN ('PENDIENTE', 'CONFIRMADA')"),
        ),
        ForeignKeyConstraint(
            ["club_id", "cancha_id"],
            ["canchas.club_id", "canchas.id"],
            ondelete="CASCADE",
        ),
    )

    club_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clubs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    cancha_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
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
    cancelada_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    cancha: Mapped[Cancha] = relationship(back_populates="reservas")


class AdminUsuario(Base):
    __tablename__ = "admin_usuario"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    club_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clubs.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    ultimo_login_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    club: Mapped["Club"] = relationship(back_populates="admin",)

class PasswordResetToken(Base):
    __tablename__ = "password_reset_token"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    admin_usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("admin_usuario.id", ondelete="CASCADE")
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    used_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

class ConfiguracionClub(Base):
    __tablename__ = "configuracion_club"

    club_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clubs.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

class Club(Base):
    __tablename__ = "clubs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(80), unique=True, index=True, nullable=False
    )
    subdominio: Mapped[str] = mapped_column(
        String(80), unique=True, index=True, nullable=False
    )
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    suscripcion: Mapped["ClubSuscripcion"] = relationship(
        back_populates="club",
        uselist=False,
        cascade="all, delete-orphan",
    )

    admin: Mapped["AdminUsuario | None"] = relationship(
    back_populates="club",
    uselist=False,
)


class ClubSuscripcion(Base):
    __tablename__ = "club_suscripciones"
    __table_args__ = (
        CheckConstraint(
            "plan IN ('FREE', 'BASICO')",
            name="ck_club_suscripciones_plan",
        ),
        CheckConstraint(
            "estado IN ('TRIAL', 'ACTIVO', 'EXPIRADO', 'SUSPENDIDO')",
            name="ck_club_suscripciones_estado",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    club_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clubs.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    plan: Mapped[str] = mapped_column(String(20), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False)
    trial_inicia_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    trial_expira_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    activada_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    expira_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    observaciones: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    club: Mapped[Club] = relationship(back_populates="suscripcion")
