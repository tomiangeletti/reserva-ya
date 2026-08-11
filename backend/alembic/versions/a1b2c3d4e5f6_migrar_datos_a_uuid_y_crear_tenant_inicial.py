"""migrar datos existentes a UUID y crear el tenant inicial

Revision ID: a1b2c3d4e5f6
Revises: 9890a04448df
Create Date: 2026-08-11 00:00:00.000000

La migración conserva los registros existentes, reemplaza sus IDs enteros por
UUIDs y asocia todos los datos al club inicial ``el-tunel``.
"""

from datetime import datetime, timedelta, timezone
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "9890a04448df"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _uuid_map(rows: list[dict]) -> dict[int, uuid.UUID]:
    return {row["id"]: uuid.uuid4() for row in rows}


def upgrade() -> None:
    bind = op.get_bind()
    metadata = sa.MetaData()
    now = datetime.now(timezone.utc)
    club_id = uuid.uuid4()

    old_admin = sa.Table("admin_usuario", metadata, autoload_with=bind)
    old_canchas = sa.Table("canchas", metadata, autoload_with=bind)
    old_config = sa.Table("configuracion_club", metadata, autoload_with=bind)
    old_bloqueos = sa.Table(
        "bloqueos_puntuales", metadata, autoload_with=bind
    )
    old_reservas = sa.Table("reservas", metadata, autoload_with=bind)
    old_turnos = sa.Table("turnos_fijos", metadata, autoload_with=bind)
    old_tokens = sa.Table(
        "password_reset_token", metadata, autoload_with=bind
    )

    admins = [dict(row) for row in bind.execute(sa.select(old_admin)).mappings()]
    canchas = [
        dict(row) for row in bind.execute(sa.select(old_canchas)).mappings()
    ]
    configs = [
        dict(row) for row in bind.execute(sa.select(old_config)).mappings()
    ]
    bloqueos = [
        dict(row) for row in bind.execute(sa.select(old_bloqueos)).mappings()
    ]
    reservas = [
        dict(row) for row in bind.execute(sa.select(old_reservas)).mappings()
    ]
    turnos = [
        dict(row) for row in bind.execute(sa.select(old_turnos)).mappings()
    ]
    tokens = [
        dict(row) for row in bind.execute(sa.select(old_tokens)).mappings()
    ]

    admin_ids = _uuid_map(admins)
    cancha_ids = _uuid_map(canchas)
    config_ids = _uuid_map(configs)
    bloqueo_ids = _uuid_map(bloqueos)
    reserva_ids = _uuid_map(reservas)
    turno_ids = _uuid_map(turnos)
    token_ids = _uuid_map(tokens)

    op.create_table(
        "clubs",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("nombre", sa.String(length=150), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("subdominio", sa.String(length=80), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
        sa.UniqueConstraint("subdominio"),
    )
    op.create_index("ix_clubs_slug", "clubs", ["slug"], unique=False)
    op.create_index(
        "ix_clubs_subdominio", "clubs", ["subdominio"], unique=False
    )

    op.create_table(
        "club_suscripciones",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("club_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("plan", sa.String(length=20), nullable=False),
        sa.Column("estado", sa.String(length=20), nullable=False),
        sa.Column("trial_inicia_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column("trial_expira_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column("activada_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expira_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column("observaciones", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "plan IN ('FREE', 'BASICO')",
            name="ck_club_suscripciones_plan",
        ),
        sa.CheckConstraint(
            "estado IN ('TRIAL', 'ACTIVO', 'EXPIRADO', 'SUSPENDIDO')",
            name="ck_club_suscripciones_estado",
        ),
        sa.ForeignKeyConstraint(["club_id"], ["clubs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("club_id"),
    )
    op.create_index(
        "ix_club_suscripciones_club_id",
        "club_suscripciones",
        ["club_id"],
        unique=False,
    )

    bind.execute(
        sa.text(
            """
            INSERT INTO clubs
                (id, nombre, slug, subdominio, activo, created_at, updated_at)
            VALUES
                (:id, :nombre, :slug, :subdominio, :activo, :created_at, :updated_at)
            """
        ),
        {
            "id": club_id,
            "nombre": "El Túnel",
            "slug": "el-tunel",
            "subdominio": "el-tunel",
            "activo": True,
            "created_at": now,
            "updated_at": now,
        },
    )
    bind.execute(
        sa.text(
            """
            INSERT INTO club_suscripciones
                (id, club_id, plan, estado, trial_inicia_en, trial_expira_en,
                 activada_en, expira_en, observaciones, created_at, updated_at)
            VALUES
                (:id, :club_id, 'FREE', 'TRIAL', :trial_inicia_en,
                 :trial_expira_en, NULL, NULL, NULL, :created_at, :updated_at)
            """
        ),
        {
            "id": uuid.uuid4(),
            "club_id": club_id,
            "trial_inicia_en": now,
            "trial_expira_en": now + timedelta(days=14),
            "created_at": now,
            "updated_at": now,
        },
    )

    # Las tablas temporales permiten copiar los datos con sus relaciones ya
    # convertidas y luego reemplazar las tablas originales en una sola transacción.
    op.create_table(
        "admin_usuario_new",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("club_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ultimo_login_en", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["club_id"], ["clubs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("club_id"),
    )
    op.create_index(
        "ix_admin_usuario_new_username",
        "admin_usuario_new",
        ["username"],
        unique=True,
    )
    op.create_index(
        "ix_admin_usuario_new_email",
        "admin_usuario_new",
        ["email"],
        unique=True,
    )

    op.create_table(
        "canchas_new",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("club_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("nombre", sa.String(length=100), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["club_id"], ["clubs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("club_id", "id", name="uq_cancha_new_club_id"),
        sa.UniqueConstraint("club_id", "nombre", name="uq_cancha_new_club_nombre"),
    )
    op.create_index(
        "ix_canchas_new_club_id", "canchas_new", ["club_id"], unique=False
    )

    op.create_table(
        "configuracion_club_new",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("club_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("direccion", sa.String(length=255), nullable=False),
        sa.Column("alias_transferencia", sa.String(length=100), nullable=False),
        sa.Column("precio_cancha_default", sa.Numeric(10, 2), nullable=False),
        sa.Column("monto_senia_default", sa.Numeric(10, 2), nullable=False),
        sa.Column("adicional_pelotas", sa.Numeric(10, 2), nullable=False),
        sa.Column("telefono_whatsapp", sa.String(length=30), nullable=False),
        sa.Column("hora_apertura", sa.Time(), nullable=False),
        sa.Column("hora_cierre", sa.Time(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["club_id"], ["clubs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("club_id"),
    )

    op.create_table(
        "turnos_fijos_new",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("club_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("cancha_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("dia_semana", sa.Integer(), nullable=False),
        sa.Column("hora_inicio", sa.Time(), nullable=False),
        sa.Column("hora_fin", sa.Time(), nullable=True),
        sa.Column("nombre", sa.String(length=150), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["club_id"], ["clubs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["club_id", "cancha_id"],
            ["canchas_new.club_id", "canchas_new.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "uq_turno_fijo_club_cancha_dia_hora_new",
        "turnos_fijos_new",
        ["club_id", "cancha_id", "dia_semana", "hora_inicio"],
        unique=True,
    )

    op.create_table(
        "bloqueos_puntuales_new",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("club_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("cancha_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("hora_inicio", sa.Time(), nullable=False),
        sa.Column("motivo", sa.String(length=200), nullable=False),
        sa.Column("creado_por", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["club_id"], ["clubs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["club_id", "cancha_id"],
            ["canchas_new.club_id", "canchas_new.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "uq_bloqueo_club_cancha_fecha_hora_new",
        "bloqueos_puntuales_new",
        ["club_id", "cancha_id", "fecha", "hora_inicio"],
        unique=True,
    )

    op.create_table(
        "reservas_new",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("club_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("cancha_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("hora_inicio", sa.Time(), nullable=False),
        sa.Column("nombre_cliente", sa.String(length=150), nullable=False),
        sa.Column("telefono_cliente", sa.String(length=30), nullable=False),
        sa.Column("precio_cancha", sa.Numeric(10, 2), nullable=False),
        sa.Column("monto_senia", sa.Numeric(10, 2), nullable=False),
        sa.Column("estado", sa.String(length=20), nullable=False),
        sa.Column("creado_en", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expira_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column("confirmado_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelada_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["club_id"], ["clubs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["club_id", "cancha_id"],
            ["canchas_new.club_id", "canchas_new.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "uq_reserva_activa_club_cancha_fecha_hora_new",
        "reservas_new",
        ["club_id", "cancha_id", "fecha", "hora_inicio"],
        unique=True,
        sqlite_where=sa.text("estado IN ('PENDIENTE', 'CONFIRMADA')"),
        postgresql_where=sa.text("estado IN ('PENDIENTE', 'CONFIRMADA')"),
    )

    op.create_table(
        "password_reset_token_new",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("token", sa.String(length=255), nullable=False),
        sa.Column("admin_usuario_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["admin_usuario_id"],
            ["admin_usuario_new.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_password_reset_token_new_token",
        "password_reset_token_new",
        ["token"],
        unique=True,
    )

    def migrated_timestamp(value: datetime | None) -> datetime:
        return value or now

    bind.execute(
        sa.text(
            "INSERT INTO admin_usuario_new "
            "(id, username, password_hash, email, club_id, activo, "
            "created_at, updated_at, ultimo_login_en) "
            "VALUES (:id, :username, :password_hash, :email, :club_id, "
            ":activo, :created_at, :updated_at, :ultimo_login_en)"
        ),
        [
            {
                "id": admin_ids[row["id"]],
                "username": row["username"],
                "password_hash": row["password_hash"],
                "email": row["email"]
                or f"admin-{row['id']}@migration.invalid",
                "club_id": club_id,
                "activo": True,
                "created_at": now,
                "updated_at": now,
                "ultimo_login_en": None,
            }
            for row in admins
        ],
    )

    bind.execute(
        sa.text(
            "INSERT INTO canchas_new "
            "(id, club_id, nombre, activo, created_at, updated_at) "
            "VALUES (:id, :club_id, :nombre, :activo, :created_at, :updated_at)"
        ),
        [
            {
                "id": cancha_ids[row["id"]],
                "club_id": club_id,
                "nombre": row["nombre"],
                "activo": row["activo"],
                "created_at": now,
                "updated_at": now,
            }
            for row in canchas
        ],
    )

    bind.execute(
        sa.text(
            "INSERT INTO configuracion_club_new "
            "(id, club_id, direccion, alias_transferencia, "
            "precio_cancha_default, monto_senia_default, adicional_pelotas, "
            "telefono_whatsapp, hora_apertura, hora_cierre, created_at, updated_at) "
            "VALUES (:id, :club_id, :direccion, :alias_transferencia, "
            ":precio_cancha_default, :monto_senia_default, :adicional_pelotas, "
            ":telefono_whatsapp, :hora_apertura, :hora_cierre, :created_at, :updated_at)"
        ),
        [
            {
                "id": config_ids[row["id"]],
                "club_id": club_id,
                "direccion": row["direccion"],
                "alias_transferencia": row["alias_transferencia"],
                "precio_cancha_default": row["precio_cancha_default"],
                "monto_senia_default": row["monto_senia_default"],
                "adicional_pelotas": row.get("adicional_pelotas") or 0,
                "telefono_whatsapp": row.get("telefono_whatsapp") or "",
                "hora_apertura": row["hora_apertura"],
                "hora_cierre": row["hora_cierre"],
                "created_at": now,
                "updated_at": now,
            }
            for row in configs
        ],
    )

    bind.execute(
        sa.text(
            "INSERT INTO turnos_fijos_new "
            "(id, club_id, cancha_id, dia_semana, hora_inicio, hora_fin, "
            "nombre, activo, created_at, updated_at) "
            "VALUES (:id, :club_id, :cancha_id, :dia_semana, :hora_inicio, "
            ":hora_fin, :nombre, :activo, :created_at, :updated_at)"
        ),
        [
            {
                "id": turno_ids[row["id"]],
                "club_id": club_id,
                "cancha_id": cancha_ids[row["cancha_id"]],
                "dia_semana": row["dia_semana"],
                "hora_inicio": row["hora_inicio"],
                "hora_fin": row.get("hora_fin"),
                "nombre": row.get("nombre"),
                "activo": row["activo"],
                "created_at": now,
                "updated_at": now,
            }
            for row in turnos
        ],
    )

    bind.execute(
        sa.text(
            "INSERT INTO bloqueos_puntuales_new "
            "(id, club_id, cancha_id, fecha, hora_inicio, motivo, creado_por, "
            "created_at, updated_at) VALUES (:id, :club_id, :cancha_id, :fecha, "
            ":hora_inicio, :motivo, :creado_por, :created_at, :updated_at)"
        ),
        [
            {
                "id": bloqueo_ids[row["id"]],
                "club_id": club_id,
                "cancha_id": cancha_ids[row["cancha_id"]],
                "fecha": row["fecha"],
                "hora_inicio": row["hora_inicio"],
                "motivo": row["motivo"],
                "creado_por": row["creado_por"],
                "created_at": now,
                "updated_at": now,
            }
            for row in bloqueos
        ],
    )

    bind.execute(
        sa.text(
            "INSERT INTO reservas_new "
            "(id, club_id, cancha_id, fecha, hora_inicio, nombre_cliente, "
            "telefono_cliente, precio_cancha, monto_senia, estado, creado_en, "
            "expira_en, confirmado_en, cancelada_en, updated_at) VALUES "
            "(:id, :club_id, :cancha_id, :fecha, :hora_inicio, :nombre_cliente, "
            ":telefono_cliente, :precio_cancha, :monto_senia, :estado, :creado_en, "
            ":expira_en, :confirmado_en, NULL, :updated_at)"
        ),
        [
            {
                "id": reserva_ids[row["id"]],
                "club_id": club_id,
                "cancha_id": cancha_ids[row["cancha_id"]],
                "fecha": row["fecha"],
                "hora_inicio": row["hora_inicio"],
                "nombre_cliente": row["nombre_cliente"],
                "telefono_cliente": row["telefono_cliente"],
                "precio_cancha": row["precio_cancha"],
                "monto_senia": row["monto_senia"],
                "estado": row["estado"],
                "creado_en": row["creado_en"],
                "expira_en": row["expira_en"],
                "confirmado_en": row["confirmado_en"],
                "updated_at": migrated_timestamp(row["creado_en"]),
            }
            for row in reservas
        ],
    )

    bind.execute(
        sa.text(
            "INSERT INTO password_reset_token_new "
            "(id, token, admin_usuario_id, expires_at, used, created_at, used_at) "
            "VALUES (:id, :token, :admin_usuario_id, :expires_at, :used, "
            ":created_at, NULL)"
        ),
        [
            {
                "id": token_ids[row["id"]],
                "token": row["token"],
                "admin_usuario_id": admin_ids[row["admin_usuario_id"]],
                "expires_at": row["expires_at"],
                "used": row["used"],
                "created_at": now,
            }
            for row in tokens
        ],
    )

    for table_name in (
        "password_reset_token",
        "reservas",
        "bloqueos_puntuales",
        "turnos_fijos",
        "configuracion_club",
        "canchas",
        "admin_usuario",
    ):
        op.drop_table(table_name)

    for old_name, new_name in (
        ("admin_usuario_new", "admin_usuario"),
        ("canchas_new", "canchas"),
        ("configuracion_club_new", "configuracion_club"),
        ("turnos_fijos_new", "turnos_fijos"),
        ("bloqueos_puntuales_new", "bloqueos_puntuales"),
        ("reservas_new", "reservas"),
        ("password_reset_token_new", "password_reset_token"),
    ):
        op.rename_table(old_name, new_name)

    op.create_index(
        "ix_reservas_club_id", "reservas", ["club_id"], unique=False
    )


def downgrade() -> None:
    raise NotImplementedError(
        "La migración de INTEGER a UUID no tiene downgrade automático seguro."
    )
