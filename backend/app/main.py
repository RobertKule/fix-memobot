# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import auth, sujets, users, ai, settings, stats,admin
from app.llm_service import build_sujets_vectorstore  # initialisation Chroma
from dotenv import load_dotenv
load_dotenv()
import os
# Supprimer toutes les tables existantes
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
        # On ne bloque pas le démarrage si ça échoue, on log juste.
        print(f"⚠️ Impossible d'initialiser le vecteur store au startup: {e}")

# Configurer CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # "http://localhost:3000", 
        # "http://127.0.0.1:3000",
        # "http://localhost:3001",
        # "https://memobot-frontend.vercel.app",
        # "https://memobot-yh22.onrender.com",
        "*"  # Temporaire pour le développement
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600
)


# Inclure les routes avec le préfixe /api/v1
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(sujets.router, prefix="/api/v1/sujets", tags=["sujets"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(settings.router, prefix="/api/v1/settings", tags=["settings"])
app.include_router(stats.router, prefix="/api/v1") 
app.include_router(admin.admin_router,prefix="/api/v1")
@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API MemoBot de l'Ir Kitsa!"}

@app.get("/api/v1/")
def read_root():
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
        "environment": "development",
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
        "uptime": "0 days"  # Vous pourriez calculer l'uptime réel ici
    }

@app.get("/api/v1/system/version")
async def system_version():
    """Get API version"""
    return {
        "version": "1.0.0",
        "build_date": "2024-01-01",
        "api_spec": "v1"
    }
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)