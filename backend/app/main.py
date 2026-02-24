# app/main.py 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import auth, sujets, users, ai, settings, stats, admin, recommendation
from app.llm_service import build_sujets_vectorstore
from dotenv import load_dotenv
load_dotenv()
import os

# Supprimer toutes les tables existantes (si nécessaire)
# Base.metadata.drop_all(bind=engine)

# Créer les tables avec les nouvelles colonnes
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MemoBot API",
    description="API pour la recommandation de sujets de mémoire avec IA",
    version="1.0.0"
)

VECTORDIR = os.path.join(os.path.dirname(__file__), "..", "chroma_sujets")

@app.on_event("startup")
async def startup_init_vectorstore():
    """
    Au démarrage:
    - vérifier / construire l'index Chroma basé sur Sujet_EtudiantsB.csv + critères du doyen.
    """
    try:
        print("🔎 Initialisation du vecteur store des sujets...")
        build_sujets_vectorstore(persist_directory=VECTORDIR)
    except Exception as e:
        print(f"⚠️ Impossible d'initialiser le vecteur store au startup: {e}")

# Configuration CORS complète et robuste
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "https://memobot-frontend.vercel.app",
        "https://memobot-yh22.onrender.com",
        "https://fix-memobot.vercel.app",
        "https://memobot-happy.vercel.app",  # Enlever le slash à la fin
        "https://memobot-ai.vercel.app",
        "https://memobot.vercel.app",  # Ajouter votre domaine principal si différent
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Autoriser toutes les méthodes
    allow_headers=["*"],  # Autoriser tous les headers
    expose_headers=["*"],
    max_age=3600,
)

# Alternative: Si vous voulez être plus permissif en développement
# MAIS À NE PAS UTILISER EN PRODUCTION
# if os.getenv("ENVIRONMENT") == "development":
#     app.add_middleware(
#         CORSMiddleware,
#         allow_origins=["*"],
#         allow_credentials=True,
#         allow_methods=["*"],
#         allow_headers=["*"],
#     )

# Inclure les routes avec le préfixe /api/v1
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(sujets.router, prefix="/api/v1/sujets", tags=["sujets"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(recommendation.router, prefix="/api/v1", tags=["recommendations"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(settings.router, prefix="/api/v1/settings", tags=["settings"])
app.include_router(stats.router, prefix="/api/v1", tags=["stats"])
app.include_router(admin.admin_router, prefix="/api/v1/admin", tags=["admin"])

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API MemoBot de l'Ir Kitsa!"}

@app.get("/api/v1/")
def read_root_v1():
    return {"message": "Bienvenue sur l'API MemoBot de l'Ir Kitsa!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "memo-bot-api"}

@app.get("/api/v1/health")
def health_check_v1():
    return {"status": "healthy", "service": "memo-bot-api", "version": "v1"}

@app.get("/api/v1/system/info")
async def get_system_info():
    """
    Informations système pour le dashboard
    """
    import platform
    import psutil
    from datetime import datetime
    
    return {
        "status": "ok",
        "service": "MemoBot API",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "production"),
        "timestamp": datetime.utcnow().isoformat(),
        "system": {
            "platform": platform.platform(),
            "python_version": platform.python_version(),
            "cpu_count": psutil.cpu_count(),
            "memory_total": psutil.virtual_memory().total,
            "memory_available": psutil.virtual_memory().available,
            "disk_usage": psutil.disk_usage('/').percent
        },
        "endpoints": {
            "auth": "/api/v1/auth",
            "sujets": "/api/v1/sujets",
            "users": "/api/v1/users",
            "ai": "/api/v1/ai",
            "admin": "/api/v1/admin",
            "stats": "/api/v1/stats"
        }
    }

@app.get("/api/v1/system/status")
async def system_status():
    """Check system status"""
    from datetime import datetime
    return {
        "status": "online",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": "0 days"
    }

@app.get("/api/v1/system/version")
async def system_version():
    """Get API version"""
    return {
        "version": "1.0.0",
        "build_date": "2024-01-01",
        "api_spec": "v1"
    }

# Middleware supplémentaire pour ajouter des headers CORS manuellement (au cas où)
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = request.headers.get("origin", "*")
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    return response

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)