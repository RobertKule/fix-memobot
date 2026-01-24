"""add_indexes_for_performance

Revision ID: b0b7adf05b5b
Revises: votre_nouvel_id
Create Date: 2026-01-24 06:59:30.667053

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b0b7adf05b5b'
down_revision: Union[str, Sequence[str], None] = 'votre_nouvel_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
