"""add_ai_analysis_column

Revision ID: 1c802ec86714
Revises: b0b7adf05b5b
Create Date: 2026-01-24 07:00:46.174240

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1c802ec86714'
down_revision: Union[str, Sequence[str], None] = 'b0b7adf05b5b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
