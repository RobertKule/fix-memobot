# Nouveau fichier dans alembic/versions/

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'votre_nouvel_id'
down_revision = '8c6d664947e7'  # L'ID de votre migration précédente
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Étape 1: Ajouter une valeur par défaut aux lignes existantes
    op.execute("UPDATE sujets SET is_generated = false WHERE is_generated IS NULL")
    op.execute("UPDATE sujets SET vue_count = 0 WHERE vue_count IS NULL")
    op.execute("UPDATE sujets SET like_count = 0 WHERE like_count IS NULL")
    op.execute("UPDATE sujets SET is_active = true WHERE is_active IS NULL")
    op.execute("UPDATE sujets SET difficulté = 'moyenne' WHERE difficulté IS NULL")
    
    # Étape 2: Appliquer les contraintes NOT NULL
    op.alter_column('sujets', 'is_generated',
                    existing_type=sa.BOOLEAN(),
                    nullable=False,
                    server_default=sa.text('false'))
    
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
    
    op.alter_column('sujets', 'difficulté',
                    existing_type=sa.VARCHAR(length=50),
                    nullable=False,
                    server_default=sa.text("'moyenne'"))
    
    # S'assurer que created_at est NOT NULL
    op.alter_column('sujets', 'created_at',
                    existing_type=postgresql.TIMESTAMP(timezone=True),
                    nullable=False)


def downgrade() -> None:
    # Pour rollback, remettre nullable=True
    op.alter_column('sujets', 'created_at',
                    existing_type=postgresql.TIMESTAMP(timezone=True),
                    nullable=True)
    
    op.alter_column('sujets', 'difficulté',
                    existing_type=sa.VARCHAR(length=50),
                    nullable=True,
                    server_default=None)
    
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
    
    op.alter_column('sujets', 'is_generated',
                    existing_type=sa.BOOLEAN(),
                    nullable=True,
                    server_default=None)