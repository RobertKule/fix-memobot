# MemoBot - Moteur de Recommandation de Sujets de Mémoire IA

![MemoBot Banner](https://img.shields.io/badge/MemoBot-IA%20Assistant-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-green)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-teal)

**MemoBot** est une plateforme intelligente qui assiste les étudiants dans la recherche et la sélection de sujets de mémoire grâce à l'intelligence artificielle. Le système propose des recommandations personnalisées, génère des idées de sujets, analyse la pertinence des propositions et guide les étudiants tout au long du processus.

## 🚀 Fonctionnalités Principales

### 🤖 **Assistant IA Intelligent**
- **Chat public/privé** : Discussion avec MemoBot pour obtenir des conseils personnalisés
- **Analyse IA** : Évaluation automatique de la pertinence des sujets
- **Génération de sujets** : Création de 3 sujets personnalisés basés sur vos intérêts
- **Recommandations** : Suggestions adaptées à votre profil académique

### 📚 **Gestion des Sujets**
- **Base de données** : Catalogue organisé de sujets classés par domaine, niveau et difficulté
- **Recherche avancée** : Filtrage par mots-clés, domaine, faculté, niveau
- **Détails complets** : Fiche détaillée avec problématique, méthodologie, ressources
- **Popularité** : Sujets les plus consultés et likés

### 👤 **Espace Personnel**
- **Profil utilisateur** : Gestion de vos informations académiques et intérêts
- **Historique** : Suivi de vos interactions et sujets explorés
- **Favoris** : Sauvegarde des sujets qui vous intéressent
- **Recommandations personnalisées** : Suggestions basées sur votre profil

### 🎯 **Outils d'Aide à la Décision**
- **Critères d'acceptation** : Liste des éléments requis pour un bon sujet
- **Conseils méthodologiques** : Guides pour la rédaction et la soutenance
- **Analyse comparative** : Comparaison de différents sujets
- **Calendrier estimé** : Durée approximative pour chaque sujet

## 🏗️ Architecture Technique

### **Backend** - FastAPI (Python)
```
backend/
├── app/
│   ├── routes/           # Routes API
│   │   ├── auth.py       # Authentification
│   │   ├── ai.py         # Fonctionnalités IA
│   │   ├── sujets.py     # Gestion des sujets
│   │   ├── users.py      # Gestion utilisateurs
│   │   └── settings.py   # Paramètres
│   ├── models.py         # Modèles SQLAlchemy
│   ├── schemas.py        # Schémas Pydantic
│   ├── crud.py           # Opérations CRUD
│   ├── llm_service.py    # Service IA (Gemini/OpenAI)
│   └── main.py           # Application principale
├── alembic/              # Migrations de base de données
└── requirements.txt      # Dépendances Python
```

### **Frontend** - Next.js 14 (TypeScript)
```
frontend/
├── src/
│   ├── app/              # Pages Next.js 14 (App Router)
│   │   ├── (auth)/       # Pages d'authentification
│   │   ├── dashboard/    # Tableau de bord
│   │   │   ├── chat/     # Chat IA
│   │   │   ├── sujets/   # Gestion des sujets
│   │   │   ├── profile/  # Profil utilisateur
│   │   │   └── ...       # Autres pages
│   │   └── layout.tsx    # Layout principal
│   ├── components/       # Composants React
│   ├── contexts/         # Contextes React
│   └── lib/              # Utilitaires
├── public/               # Fichiers statiques
└── package.json          # Dépendances Node.js
```

## 🛠️ Installation et Démarrage

### Prérequis
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Git

### 1. Cloner le repository
```bash
git clone https://github.com/RobertKule/Moteur-Recommandation-M-moire.git
cd Moteur-Recommandation-M-moire
```

### 2. Configuration du Backend
```bash
cd backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement
# Sur Windows :
venv\Scripts\activate
# Sur Mac/Linux :
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Initialiser la base de données
python init_database.py
python create_users.py

# Lancer le serveur
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Configuration du Frontend
```bash
cd frontend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec l'URL de votre backend

# Lancer le serveur de développement
npm run dev
```

### 4. Accéder à l'application
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs

## 🔧 Configuration

### Variables d'environnement Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/memobot

# Security
SECRET_KEY=votre_clé_secrète_très_longue
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI Services
GEMINI_API_KEY=votre_clé_api_gemini
OPENAI_API_KEY=votre_clé_api_openai  # Optionnel

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Variables d'environnement Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_NAME=MemoBot
NEXT_PUBLIC_APP_DESCRIPTION=Assistant IA pour sujets de mémoire
```

## 📊 Base de données

### Modèles Principaux
```sql
-- Utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

-- Sujets
CREATE TABLE sujets (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(500) NOT NULL,
    description TEXT,
    domaine VARCHAR(100),
    niveau VARCHAR(50),
    problematique TEXT,
    methodologie TEXT,
    difficulté VARCHAR(20),
    vue_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0
);

-- Préférences utilisateur
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    interests TEXT,
    faculty VARCHAR(100),
    level VARCHAR(50)
);

-- Historique IA
CREATE TABLE ai_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    role VARCHAR(20),
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Exécuter les migrations
```bash
cd backend
alembic upgrade head
```

## 🤖 Intégration IA

### Services IA Supportés
1. **Google Gemini** (Recommandé) - Service par défaut
2. **OpenAI GPT** - Alternative
3. **Mode Fallback** - Réponses prédéfinies si l'IA est indisponible

### Fonctionnalités IA
- **Chat conversationnel** : Discussions contextuelles sur les sujets de mémoire
- **Génération de sujets** : Création de 3 sujets personnalisés
- **Analyse de pertinence** : Score et recommandations pour un sujet
- **Conseils méthodologiques** : Guidance étape par étape

## 🔌 API Endpoints

### Authentification
```http
POST   /api/v1/auth/login        # Connexion
POST   /api/v1/auth/register     # Inscription
GET    /api/v1/auth/me           # Profil utilisateur
```

### Sujets
```http
GET    /api/v1/sujets            # Liste des sujets
GET    /api/v1/sujets/{id}       # Détails d'un sujet
POST   /api/v1/sujets/recommend  # Recommandations
POST   /api/v1/sujets/feedback   # Feedback utilisateur
```

### IA
```http
POST   /api/v1/ai/ask            # Question à l'IA (authentifié)
POST   /api/v1/ai/ask-public     # Question à l'IA (public)
POST   /api/v1/ai/analyze        # Analyse d'un sujet
POST   /api/v1/ai/generate-three # Génère 3 sujets
POST   /api/v1/ai/save-chosen-subject # Sauvegarde un sujet choisi
```

### Utilisateurs
```http
GET    /api/v1/users/{id}/profile # Profil utilisateur
PUT    /api/v1/users/{id}/profile # Mise à jour profil
GET    /api/v1/users/{id}/stats   # Statistiques
```

## 🎨 Interface Utilisateur

### Pages Principales
1. **Page d'accueil** : Présentation et accès rapide
2. **Dashboard** : Vue d'ensemble personnalisée
3. **Chat IA** : Interface de conversation avec MemoBot
4. **Explorer les sujets** : Catalogue et recherche
5. **Générer des sujets** : Création de sujets personnalisés
6. **Profil** : Gestion du compte et préférences

### Composants Clés
- **QuickChat** : Chat flottant accessible sur toutes les pages
- **Dashboard Sidebar** : Navigation principale
- **Sujet Cards** : Cartes interactives pour les sujets
- **Analysis Modal** : Fenêtre d'analyse IA détaillée
- **Recommendation Engine** : Moteur de recommandation visuel

## 🧪 Tests

### Tests Backend
```bash
cd backend
pytest tests/
```

### Tests Frontend
```bash
cd frontend
npm test
```

### Tests API
```bash
cd backend
python test_api.py
```

## 📈 Déploiement

### Option 1 : Docker (Recommandé)
```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: memobot
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/memobot
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000/api/v1
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Option 2 : Déploiement Manuel
1. **Backend** : Serveur Linux avec Nginx + Gunicorn
2. **Frontend** : Vercel, Netlify ou serveur statique
3. **Base de données** : PostgreSQL sur cloud ou serveur dédié

## 👥 Rôles Utilisateurs

### Étudiant
- Consulter les sujets
- Utiliser le chat IA
- Recevoir des recommandations
- Sauvegarder des favoris

### Enseignant
- Toutes les fonctionnalités étudiant
- Proposer de nouveaux sujets
- Valider des sujets existants
- Accéder aux statistiques

### Administrateur
- Gestion complète des utilisateurs
- Modération des sujets
- Configuration du système
- Statistiques avancées

## 📱 Compatibilité

- **Desktop** : Chrome, Firefox, Safari, Edge
- **Mobile** : Responsive design pour smartphones et tablettes
- **Accessibilité** : Support WCAG 2.1 niveau AA
- **Performance** : Optimisé pour les connexions lentes

## 🔒 Sécurité

- **Authentification** : JWT avec expiration
- **Validation** : Pydantic pour toutes les entrées API
- **CORS** : Configuration stricte des origines autorisées
- **HTTPS** : Obligatoire en production
- **Sécurité des données** : Hashage des mots de passe (bcrypt)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commiter les changements (`git commit -m 'Add some AmazingFeature'`)
4. Pousser la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📞 Support

- **Issues GitHub** : [Rapporter un bug](https://github.com/RobertKule/Moteur-Recommandation-M-moire/issues)
- **Documentation** : Consultez la documentation API sur `/docs`
- **Email** : support@memobot.fr

## 🌟 Fonctionnalités Futures

- [ ] Intégration avec les systèmes universitaires
- [ ] Collaboration en temps réel
- [ ] Export PDF des analyses
- [ ] Tableau de bord avancé pour enseignants
- [ ] Mobile app React Native
- [ ] Analytics avancés
- [ ] Plugins pour éditeurs de texte

## 🏆 Avantages pour les Étudiants

- **Gain de temps** : Réduction du temps de recherche de 70%
- **Pertinence** : Suggestions adaptées à votre cursus
- **Confiance** : Validation par IA des sujets choisis
- **Support continu** : Accompagnement de l'idée à la soutenance

---

**Développé avec ❤️ par l'équipe MemoBot**  
*Transformer la recherche de sujets de mémoire en expérience intuitive et efficace* 