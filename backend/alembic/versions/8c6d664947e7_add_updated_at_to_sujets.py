# D:\Projects\clients\MemoBot\backend\alembic\versions\8c6d664947e7_add_updated_at_to_sujets.py

"""add updated_at to sujets

Revision ID: 8c6d664947e7
Revises: 77f7fd25492c
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '8c6d664947e7'
down_revision = '77f7fd25492c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ajoutez d'abord la colonne updated_at avec une valeur par défaut
    op.add_column('sujets', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))
    
    # Mettez à jour les valeurs NULL existantes pour is_generated
    op.execute("UPDATE sujets SET is_generated = false WHERE is_generated IS NULL")
    
    # Maintenant, vous pouvez définir NOT NULL
    op.alter_column('sujets', 'is_generated',
               existing_type=sa.BOOLEAN(),
               nullable=False,
               server_default=sa.text('false'))
    
    # Mettez à jour les autres colonnes
    op.alter_column('sujets', 'difficulté',
               existing_type=sa.VARCHAR(length=50),
               nullable=False,
               server_default=sa.text("'moyenne'"))
    
    op.alter_column('sujets', 'vue_count',
               existing_type=sa.INTEGER(),
               nullable=False,
               server_default=sa.text('0'))
    
    op.alter_column('sujets', 'like_count',
               existing_type=sa.INTEGER(),
               nullable=False,
               server_default=sa.text('0'))
    
    op.alter_column('sujets', 'is_active',
               existing_type=sa.BOOLEAN(),
               nullable=False,
               server_default=sa.text('true'))
    
    op.alter_column('sujets', 'created_at',
               existing_type=postgresql.TIMESTAMP(timezone=True),
               nullable=False)


def downgrade() -> None:
    # Remettez nullable=True pour le rollback
    op.alter_column('sujets', 'created_at',
               existing_type=postgresql.TIMESTAMP(timezone=True),
               nullable=True)
    
    op.alter_column('sujets', 'is_active',
               existing_type=sa.BOOLEAN(),
               nullable=True,
               server_default=None)
    
    op.alter_column('sujets', 'like_count',
               existing_type=sa.INTEGER(),
               nullable=True,
               server_default=None)
    
    op.alter_column('sujets', 'vue_count',
               existing_type=sa.INTEGER(),
               nullable=True,
               server_default=None)
    
    op.alter_column('sujets', 'difficulté',
               existing_type=sa.VARCHAR(length=50),
               nullable=True,
               server_default=None)
    
    op.alter_column('sujets', 'is_generated',
               existing_type=sa.BOOLEAN(),
               nullable=True,
               server_default=None)
    
    # Supprimez la colonne updated_at
    op.drop_column('sujets', 'updated_at')