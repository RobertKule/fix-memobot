# app/routes/sujets.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from sqlalchemy import func

from app.database import get_db
from app import crud, schemas
from app.dependencies import get_current_user, require_admin
from app.llm_service import (
    recommander_sujets_llm as recommander_sujets,
    analyser_sujet,
    générer_sujets_llm as générer_sujets
)
from app.models import Sujet, Feedback, UserHistory

router = APIRouter()

# ========== CRUD SUJETS ==========

@router.post("/", response_model=schemas.Sujet)
async def create_sujet(
    sujet: schemas.SujetCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Créer un nouveau sujet
    """
    return crud.create_sujet(db, sujet, user_id=current_user.id)

@router.get("/", response_model=List[schemas.Sujet])
async def list_sujets(
    q: str = Query(None, description="Terme de recherche"),
    domaine: str = Query(None, description="Domaine"),
    faculté: str = Query(None, description="Faculté"),
    niveau: str = Query(None, description="Niveau"),
    difficulté: str = Query(None, description="Difficulté"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Lister tous les sujets avec filtres
    """
    sujets = crud.get_sujets(
        db=db,
        skip=skip,
        limit=limit,
        search=q,
        domaine=domaine,
        faculté=faculté,
        niveau=niveau,
        difficulté=difficulté
    )
    
    return sujets

@router.get("/{sujet_id}")
async def get_sujet(
    sujet_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Récupérer un sujet spécifique avec analyse IA
    """
    sujet = crud.get_sujet(db, sujet_id)
    if not sujet or not sujet.is_active:
        raise HTTPException(status_code=404, detail="Sujet non trouvé")
    
    # Incrémenter le compteur de vues
    crud.update_sujet_vue_count(db, sujet_id)
    
    # Analyser le sujet avec IA (optionnel)
    try:
        analyse = analyser_sujet({
            "titre": sujet.titre,
            "domaine": sujet.domaine,
            "niveau": sujet.niveau,
            "faculté": sujet.faculté,
            "problematique": sujet.problématique,
            "description": sujet.description,
            "keywords": sujet.keywords
        })
        return {"sujet": sujet, "analyse": analyse}
    except Exception as e:
        print(f"Erreur analyse IA: {e}")
        return {"sujet": sujet}

# ========== SUJETS UTILISATEUR ==========
@router.get("/user-sujets", response_model=List[schemas.Sujet])
async def get_user_sujets(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Récupérer les sujets créés par l'utilisateur connecté
    """
    try:
        print(f"📥 [USER-SUJETS] Requête pour l'utilisateur {current_user.id} - {current_user.email}")
        
        # Vérifier si l'utilisateur existe
        if not current_user:
            print("❌ [USER-SUJETS] Utilisateur non authentifié")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Non authentifié"
            )
        
        # Récupérer les sujets de l'utilisateur
        sujets = db.query(Sujet).filter(
            Sujet.user_id == current_user.id,
            Sujet.is_active == True
        ).order_by(Sujet.created_at.desc()).all()
        
        print(f"✅ [USER-SUJETS] {len(sujets)} sujets trouvés pour l'utilisateur {current_user.id}")
        
        return sujets
        
    except Exception as e:
        print(f"❌ [USER-SUJETS] Erreur détaillée: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des sujets: {str(e)}"
        )


@router.get("/favoris", response_model=List[schemas.Sujet])
async def get_user_favoris(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Récupérer les sujets favoris de l'utilisateur connecté
    """
    try:
        feedbacks = db.query(Feedback).filter(
            Feedback.user_id == current_user.id,
            Feedback.intéressé == True
        ).order_by(Feedback.created_at.desc()).all()
        
        sujets = []
        for feedback in feedbacks:
            sujet = db.query(Sujet).filter(
                Sujet.id == feedback.sujet_id,
                Sujet.is_active == True
            ).first()
            if sujet:
                sujets.append(sujet)
        
        return sujets
    except Exception as e:
        print(f"Erreur dans get_user_favoris: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur serveur: {str(e)}"
        )

# ========== RECHERCHE ET EXPLORATION ==========

@router.get("/search")
async def search_sujets(
    q: str = Query(None, description="Terme de recherche"),
    domaine: str = Query(None, description="Domaine"),
    faculté: str = Query(None, description="Faculté"),
    niveau: str = Query(None, description="Niveau"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Rechercher des sujets
    """
    sujets = crud.get_sujets(
        db=db,
        skip=skip,
        limit=limit,
        search=q,
        domaine=domaine,
        faculté=faculté,
        niveau=niveau
    )
    
    return sujets

@router.get("/explore/recent", response_model=List[schemas.Sujet])
async def get_recent_sujets(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Récupérer les sujets les plus récents pour l'exploration
    """
    try:
        sujets = db.query(Sujet).filter(
            Sujet.is_active == True
        ).order_by(Sujet.created_at.desc()).limit(limit).all()
        
        return sujets
    except Exception as e:
        print(f"Erreur dans get_recent_sujets: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur serveur: {str(e)}"
        )

# ========== RECOMMANDATIONS IA ==========

@router.post("/recommend", response_model=List[schemas.RecommendedSujet])
async def recommend_sujets(
    request: schemas.RecommendationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Recommander des sujets basés sur les intérêts avec IA
    """
    try:
        # Log les données reçues
        print(f"📥 Recommandation request from user {current_user.email}")
        print(f"📥 Interests: {request.interests}")
        print(f"📥 Niveau: {request.niveau}")
        print(f"📥 Faculté: {request.faculté}")
        print(f"📥 Domaine: {request.domaine}")
        print(f"📥 Difficulté: {request.difficulté}")
        print(f"📥 Limit: {request.limit}")
        
        # Validation basique
        if not request.interests or len(request.interests) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le champ 'interests' est requis et ne peut pas être vide"
            )
        
        # Vérifier que interests est une liste
        if not isinstance(request.interests, list):
            if isinstance(request.interests, str):
                # Convertir string en liste
                request.interests = [request.interests]
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Le champ 'interests' doit être une liste de chaînes de caractères"
                )
        
        # Mettre à jour les préférences de l'utilisateur
        crud.update_preference(db, current_user.id, {
            "interests": ", ".join(request.interests),
            "faculty": request.faculté,
            "level": request.niveau
        })
        
        # Récupérer les sujets correspondants
        sujets_db = crud.search_sujets_by_keywords(
            db, 
            request.interests, 
            limit=50
        )
        
        if not sujets_db:
            print("⚠️ Aucun sujet trouvé en base de données")
            # Retourner une liste vide plutôt qu'une erreur
            return []
        
        # Préparer les données pour LLM
        sujets_data = []
        for sujet in sujets_db:
            sujets_data.append({
                "id": sujet.id,
                "titre": sujet.titre,
                "problematique": sujet.problématique,
                "keywords": sujet.keywords,
                "domaine": sujet.domaine,
                "niveau": sujet.niveau,
                "faculté": sujet.faculté,
                "difficulté": sujet.difficulté,
                "description": sujet.description
            })
        
        # Obtenir les recommandations LLM
        try:
            recommendations = recommander_sujets(
                interests=request.interests,
                sujets=sujets_data,
                critères={
                    "niveau": request.niveau,
                    "faculté": request.faculté,
                    "domaine": request.domaine,
                    "difficulté": request.difficulté
                }
            )
            
            print(f"✅ Nombre de recommandations LLM: {len(recommendations)}")
            
        except Exception as llm_error:
            print(f"⚠️ Erreur LLM, utilisation du fallback: {llm_error}")
            # Fallback: recommandations simples basées sur les mots-clés
            recommendations = []
            for i, sujet in enumerate(sujets_data[:request.limit]):
                recommendations.append({
                    "id": sujet["id"],
                    "score": 70 + (i * 5),
                    "raisons": [
                        f"Correspond à vos intérêts: {', '.join(request.interests[:2])}",
                        f"Domaine pertinent: {sujet['domaine']}",
                        f"Niveau adapté: {request.niveau or 'tous niveaux'}"
                    ],
                    "critères": ["Matching mots-clés", "Domaine correspondant", "Niveau adapté"]
                })
        
        # Mapper les recommandations avec les sujets complets
        result = []
        for rec in recommendations[:request.limit]:
            sujet = next((s for s in sujets_db if s.id == rec.get("id", 0)), None)
            if sujet:
                result.append({
                    "sujet": sujet,
                    "score": rec.get("score", 50),
                    "raisons": rec.get("raisons", ["Sujet recommandé par notre système"]),
                    "critères_respectés": rec.get("critères", ["Pertinence générale"])
                })
        
        print(f"✅ Nombre de résultats finaux: {len(result)}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur dans recommend_sujets: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur serveur: {str(e)}"
        )


@router.post("/generate")
async def generate_sujets(
    interests: List[str] = Query(..., description="Intérêts"),
    domaine: str = Query("Génie Civil", description="Domaine"),
    niveau: str = Query("L3", description="Niveau"),
    faculté: str = Query("Génie Civil", description="Faculté"),
    count: int = Query(3, ge=1, le=10, description="Nombre de sujets à générer"),
    current_user = Depends(get_current_user)
):
    """
    Générer de nouveaux sujets avec IA
    """
    sujets = générer_sujets({
        "interests": ", ".join(interests),
        "domaine": domaine,
        "niveau": niveau,
        "faculté": faculté
    }, count)
    
    return sujets

# ========== FEEDBACK ==========

@router.post("/feedback", response_model=schemas.Feedback)
async def submit_feedback(
    feedback: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Soumettre un feedback sur un sujet
    """
    # Créer le feedback
    db_feedback = crud.create_feedback(db, feedback, current_user.id)
    
    # Mettre à jour le compteur de likes si intéressé
    if feedback.intéressé:
        sujet = crud.get_sujet(db, feedback.sujet_id)
        if sujet:
            sujet.like_count += 1
            db.commit()
    
    return db_feedback

# ========== STATISTIQUES ==========

@router.get("/stats/popular")
async def get_popular_sujets(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Récupère les sujets les plus populaires"""
    try:
        sujets = crud.get_popular_sujets(db, limit=limit)
        return sujets
    except Exception as e:
        print(f"Erreur dans get_popular_sujets: {e}")
        # Fallback: sujets récents
        sujets = db.query(Sujet).filter(
            Sujet.is_active == True
        ).order_by(Sujet.created_at.desc()).limit(limit).all()
        return sujets

@router.get("/stats/keywords")
async def get_popular_keywords(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Mots-clés les plus populaires
    """
    return crud.get_popular_keywords(db, limit)

@router.get("/stats/domains")
async def get_domains_stats(db: Session = Depends(get_db)):
    """
    Statistiques par domaine
    """
    stats = db.query(
        Sujet.domaine,
        func.count(Sujet.id).label('count'),
        func.avg(Sujet.vue_count).label('avg_views')
    ).filter(Sujet.is_active == True).group_by(Sujet.domaine).all()
    
    return [
        {"domaine": stat.domaine, "count": stat.count, "avg_views": round(float(stat.avg_views or 0), 1)}
        for stat in stats
    ]

# ========== ACTIONS SUR SUJETS ==========

@router.put("/{sujet_id}", response_model=schemas.Sujet)
async def update_sujet(
    sujet_id: int,
    sujet_update: schemas.SujetUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Mettre à jour un sujet (admin only)
    """
    sujet = crud.update_sujet(db, sujet_id, sujet_update.dict(exclude_unset=True))
    if not sujet:
        raise HTTPException(status_code=404, detail="Sujet non trouvé")
    return sujet

@router.delete("/{sujet_id}")
async def delete_sujet(
    sujet_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Supprimer un sujet (admin only) - soft delete
    """
    sujet = crud.get_sujet(db, sujet_id)
    if not sujet:
        raise HTTPException(status_code=404, detail="Sujet non trouvé")
    
    sujet.is_active = False
    db.commit()
    
    return {"message": "Sujet supprimé avec succès"}

@router.post("/{sujet_id}/like")
async def like_sujet(
    sujet_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Aimer un sujet
    """
    sujet = crud.like_sujet(db, sujet_id)
    if not sujet:
        raise HTTPException(status_code=404, detail="Sujet non trouvé")
    
    # Créer un feedback automatique
    feedback_data = schemas.FeedbackCreate(
        sujet_id=sujet_id,
        intéressé=True,
        commentaire="A aimé ce sujet"
    )
    crud.create_feedback(db, feedback_data, current_user.id)
    
    return {"message": "Sujet aimé avec succès", "like_count": sujet.like_count}