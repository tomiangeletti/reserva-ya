"""agregar duracion_turno a configuracion_club

Revision ID: aa604d63b718
Revises: a1b2c3d4e5f6
Create Date: 2026-08-14 14:08:08.734642

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aa604d63b718'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "configuracion_club",
        sa.Column(
            "duracion_turno",
            sa.Integer(),
            server_default="90",
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("configuracion_club", "duracion_turno")
