"""usuario y email del admin únicos por club

Revision ID: b3c5d7e9f1a2
Revises: aa604d63b718
Create Date: 2026-11-19 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "b3c5d7e9f1a2"
down_revision: Union[str, Sequence[str], None] = "aa604d63b718"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Pasa de unicidad global a unicidad por club."""
    op.drop_index("ix_admin_usuario_new_username", table_name="admin_usuario")
    op.drop_index("ix_admin_usuario_new_email", table_name="admin_usuario")

    op.create_index("ix_admin_usuario_username", "admin_usuario", ["username"])
    op.create_index("ix_admin_usuario_email", "admin_usuario", ["email"])

    with op.batch_alter_table("admin_usuario") as batch:
        batch.create_unique_constraint(
            "uq_admin_usuario_club_username", ["club_id", "username"]
        )
        batch.create_unique_constraint(
            "uq_admin_usuario_club_email", ["club_id", "email"]
        )


def downgrade() -> None:
    """Vuelve a unicidad global (falla si hay usuarios o emails repetidos)."""
    with op.batch_alter_table("admin_usuario") as batch:
        batch.drop_constraint("uq_admin_usuario_club_email", type_="unique")
        batch.drop_constraint("uq_admin_usuario_club_username", type_="unique")

    op.drop_index("ix_admin_usuario_email", table_name="admin_usuario")
    op.drop_index("ix_admin_usuario_username", table_name="admin_usuario")

    op.create_index(
        "ix_admin_usuario_new_email", "admin_usuario", ["email"], unique=True
    )
    op.create_index(
        "ix_admin_usuario_new_username", "admin_usuario", ["username"], unique=True
    )
