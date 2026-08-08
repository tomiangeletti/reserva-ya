"""agregar adicional_pelotas a configuracion_club

Revision ID: c4e8f2a1b6d9
Revises: b7d1e4a9c2f3
Create Date: 2026-08-04 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4e8f2a1b6d9"
down_revision: Union[str, Sequence[str], None] = "b7d1e4a9c2f3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "configuracion_club",
        sa.Column(
            "adicional_pelotas",
            sa.Numeric(10, 2),
            server_default="0.00",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("configuracion_club", "adicional_pelotas")
