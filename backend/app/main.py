# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Import des routes
from app.routes import auth, sujets, users, ai  # AJOUTER 'ai'

# Création de l'application
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application"""
    # Startup
    print("🚀 Démarrage de l'API...")
    
    # Initialisation de la base de données
    from app.database import engine
    from app import models
    
    # Créer les tables si elles n'existent pas
    models.Base.metadata.create_all(bind=engine)
    
    # Créer des données de démo
    from app.main_setup import create_demo_data
    await create_demo_data()
    
    print("✅ API prête à recevoir des requêtes")
    yield
    # Shutdown
    print("👋 Arrêt de l'API...")

app = FastAPI(
    title="🎓 Système de Recommandation de Sujets de Mémoire",
    description="API pour la recommandation intelligente de sujets de mémoire universitaire",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, restreindre aux domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes principales
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(sujets.router, prefix="/api/v1/sujets", tags=["sujets"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(ai.router, prefix="/api/v1", tags=["ai"])  # AJOUTER CETTE LIGNE

# Page d'accueil
@app.get("/")
async def root():
    return {
        "message": "🎓 Système de Recommandation de Sujets de Mémoire",
        "version": "1.0.0",
        "endpoints": {
            "documentation": [
                {"url": "/docs", "description": "Documentation Swagger UI"},
                {"url": "/redoc", "description": "Documentation ReDoc"}
            ],
            "authentification": [
                {"url": "/api/v1/auth/register", "method": "POST", "description": "Inscription"},
                {"url": "/api/v1/auth/login", "method": "POST", "description": "Connexion"},
                {"url": "/api/v1/auth/login-json", "method": "POST", "description": "Connexion JSON"},
                {"url": "/api/v1/auth/me", "method": "GET", "description": "Profil utilisateur"}
            ],
            "sujets": [
                {"url": "/api/v1/sujets/search", "method": "GET", "description": "Rechercher des sujets"},
                {"url": "/api/v1/sujets/recommend", "method": "POST", "description": "Recommandation IA"},
                {"url": "/api/v1/sujets/{id}", "method": "GET", "description": "Détail d'un sujet"}
            ],
            "ia": [  # AJOUTER CETTE SECTION
                {"url": "/api/v1/ai/ask", "method": "POST", "description": "Poser une question à l'IA"},
                {"url": "/api/v1/ai/criteria", "method": "GET", "description": "Critères d'acceptation"}
            ],
            "statistiques": [
                {"url": "/api/v1/sujets/stats/popular", "method": "GET", "description": "Sujets populaires"},
                {"url": "/api/v1/sujets/stats/keywords", "method": "GET", "description": "Mots-clés populaires"}
            ]
        }
    }

# Endpoint de santé
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "thesis-recommendation-api"}

# Endpoint pour voir la configuration
@app.get("/config")
async def show_config():
    return {
        "database_url": os.getenv("DATABASE_URL", "non configuré")[:50] + "..." if os.getenv("DATABASE_URL") else "non configuré",
        "gemini_api_key": "configuré" if os.getenv("GEMINI_API_KEY") else "non configuré",
        "environment": os.getenv("ENVIRONMENT", "development")
    }