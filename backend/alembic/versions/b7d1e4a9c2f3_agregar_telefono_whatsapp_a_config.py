"""agregar telefono_whatsapp a configuracion_club

Revision ID: b7d1e4a9c2f3
Revises: 43a3b887cc1d
Create Date: 2026-08-04 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7d1e4a9c2f3'
down_revision: Union[str, Sequence[str], None] = '43a3b887cc1d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'configuracion_club',
        sa.Column('telefono_whatsapp', sa.String(length=30), server_default='', nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('configuracion_club', 'telefono_whatsapp')
