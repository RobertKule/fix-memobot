# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import auth, sujets, users, ai, settings, stats
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
    allow_origins=["http://localhost:3000", 
                   "http://127.0.0.1:3000",
                    "https://memobot-frontend.vercel.app",
                    "https://memobot-yh22.onrender.com"
                ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Inclure les routes avec le préfixe /api/v1
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(sujets.router, prefix="/api/v1/sujets", tags=["sujets"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(settings.router, prefix="/api/v1/settings", tags=["settings"])
app.include_router(stats.router, prefix="/api/v1") 

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)