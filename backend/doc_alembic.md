# 📋 Alembic Cheat Sheet

## 🔧 **INSTALLATION & SETUP**
```bash
# Installer
pip install alembic

# Initialiser dans ton projet
alembic init alembic

# Vérifier la version
alembic --version
```

## 📝 **CONFIGURATION RAPIDE**
```bash
# 1. Édite alembic.ini
# Change cette ligne :
sqlalchemy.url = postgresql://user:pass@localhost/ton_db

# 2. Édite alembic/env.py
# Ajoute en haut :
import sys
sys.path.append('.')
from app.models import Base
target_metadata = Base.metadata
```

## 🚀 **CRÉER & APPLIQUER MIGRATIONS**

```bash
# Générer une migration automatique
alembic revision --autogenerate -m "Description"

# Appliquer la dernière migration
alembic upgrade head

# Générer ET appliquer en une commande
alembic revision --autogenerate -m "Desc" && alembic upgrade head
```

## 📊 **INSPECTION & ÉTAT**

```bash
# Voir la migration actuelle
alembic current

# Voir l'historique complet
alembic history

# Voir toutes les versions disponibles
alembic heads

# Voir le chemin des migrations
alembic branches
```

## ⏮️ **REVENIR EN ARRIÈRE**

```bash
# Revenir d'une migration
alembic downgrade -1

# Revenir à une version spécifique
alembic downgrade ae1  # (ae1 = ID de la migration)

# Revenir au début (SUPPRIME TOUTES LES TABLES)
alembic downgrade base
```

## 🎯 **VERSIONS SPÉCIFIQUES**

```bash
# Migrer vers une version spécifique
alembic upgrade ae1
alembic upgrade +2  # Avance de 2 versions

# Marquer comme migré sans appliquer
alembic stamp head
alembic stamp ae1
```

## 🧪 **TEST & DEBUG**

```bash
# Voir le SQL qui sera exécuté (SANS l'appliquer)
alembic upgrade head --sql

# Voir le SQL de rollback
alembic downgrade -1 --sql

# Générer une migration vide (pour modifications manuelles)
alembic revision -m "Migration manuelle"
```

## 🗑️ **NETTOYAGE & RÉINITIALISATION**

```bash
# Supprimer le répertoire alembic
rm -rf alembic/

# Réinitialiser complètement (DEV ONLY)
alembic downgrade base && alembic upgrade head

# Nettoyer les migrations vides
find alembic/versions -name "*.py" -size 0 -delete
```

## 🚨 **URGENCE & PRODUCTION**

```bash
# Backup avant migration
pg_dump ton_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Migration en production (TOUJOURS tester avant)
alembic upgrade head

# Rollback rapide en cas de problème
alembic downgrade -1
```

## 📁 **STRUCTURE DES FICHIERS**

```
# Fichiers importants :
alembic.ini                    # Configuration principale
alembic/env.py                 # Config Python
alembic/versions/*.py          # TES MIGRATIONS ICI
alembic/script.py.mako         # Template des migrations

# Fichier de migration typique :
# alembic/versions/001_initial_migration.py
def upgrade():
    # Code pour appliquer les changements
    op.create_table(...)
    
def downgrade():
    # Code pour annuler les changements
    op.drop_table(...)
```

## 💡 **COMMANDES COURANTES (80% du temps)**

```bash
# 1. Modifie tes modèles Python
# 2. Génère la migration :
alembic revision --autogenerate -m "ajout colonne X"
# 3. Applique :
alembic upgrade head
# 4. Vérifie :
alembic current
```

## ⚡ **ALIAS UTILES (ajoute dans ton .bashrc)**

```bash
# .bashrc ou .zshrc
alias amg='alembic revision --autogenerate -m'
alias amup='alembic upgrade head'
alias amdown='alembic downgrade -1'
alias amcurr='alembic current'
alias amhis='alembic history'

# Usage : amg "description" && amup
```

## 🎮 **WORKFLOW RAPIDE**

```bash
# 1. Après chaque changement de modèle :
alembic revision --autogenerate -m "changement X"

# 2. Avant de commiter :
alembic upgrade head
alembic current  # Vérifie

# 3. En cas d'erreur :
alembic downgrade -1
# Corrige le problème
# Puis reprends à l'étape 1
```

---

**📌 RAPPEL :** 
- `upgrade` = appliquer les changements ✅
- `downgrade` = annuler les changements ↩️
- `head` = dernière migration
- `base` = état initial (pas de migrations)

**⚠️ EN PRODUCTION :** TOUJOURS `--sql` avant `upgrade` !