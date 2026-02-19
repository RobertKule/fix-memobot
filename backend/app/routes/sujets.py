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
    recommander_sujets_llm,
    analyser_sujet,
    générer_sujets_llm,
    get_acceptance_criteria
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
# app/routes/sujets.py
from pydantic import ValidationError  # à ajouter si pas présent

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

        if not current_user:
            print("❌ [USER-SUJETS] Utilisateur non authentifié")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Non authentifié"
            )

        sujets = db.query(Sujet).filter(
            Sujet.user_id == current_user.id,
            Sujet.is_active == True
        ).order_by(Sujet.created_at.desc()).all()

        if sujets:
            s = sujets[0]
            print("🔍 [USER-SUJETS] Sujet DB exemple:", {
                "id": s.id,
                "vue_count": s.vue_count,
                "like_count": s.like_count,
                "user_id": s.user_id,
                "type_id": type(s.id).__name__,
                "type_vue_count": type(s.vue_count).__name__,
                "type_like_count": type(s.like_count).__name__,
                "type_user_id": type(s.user_id).__name__,
                "created_at": s.created_at,
                "type_created_at": type(s.created_at).__name__,
            })

        return sujets

    except ValidationError as ve:
        print("❌ [USER-SUJETS] ValidationError lors de la sérialisation vers schemas.Sujet")
        print(ve.json())  # <--- très important : nous donne le champ exact
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=ve.errors(),
        )
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
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recommandation de sujets basée sur les intérêts"""
    try:
        print(f"📥 Recommandation request from user {current_user.email}")
        print(f"📥 Interests: {request.interests}")
        print(f"📥 Niveau: {request.niveau}")
        print(f"📥 Faculté: {request.faculté}")
        print(f"📥 Domaine: {request.domaine}")
        print(f"📥 Difficulté: {request.difficulté}")
        print(f"📥 Limit: {request.limit}")
        
        # Récupérer tous les sujets actifs
        sujets = db.query(Sujet).filter(Sujet.is_active == True).all()
        print(f"📚 {len(sujets)} sujets actifs trouvés")
        
        if not sujets:
            return []
        
        # Convertir en dictionnaires
        sujets_dict = []
        for sujet in sujets:
            sujets_dict.append({
                "id": sujet.id,
                "titre": sujet.titre,
                "description": sujet.description,
                "keywords": sujet.keywords,
                "domaine": sujet.domaine,
                "niveau": sujet.niveau,
                "faculté": sujet.faculté,
                "difficulté": sujet.difficulté,
                "problématique": sujet.problématique,
                "vue_count": sujet.vue_count,
                "like_count": sujet.like_count
            })
        
        # Utiliser le LLM pour les recommandations
        critères = {
            "niveau": request.niveau,
            "faculté": request.faculté,
            "domaine": request.domaine,
            "difficulté": request.difficulté
        }
        
        try:
            recommendations = recommander_sujets_llm(
                interests=request.interests,
                sujets=sujets_dict,
                critères=critères
            )
            print(f"✅ {len(recommendations)} recommandations générées avec LLM")
        except Exception as e:
            print(f"⚠️ Erreur LLM, utilisation du fallback: {e}")
            # Fallback: utiliser le moteur traditionnel
            recommendations = []
            for sujet in sujets[:20]:
                score = 50  # Score par défaut
                raisons = ["Sujet pertinent"]
                recommendations.append({
                    "sujet": sujet,
                    "score": score,
                    "raisons": raisons,
                    "critères_respectés": ["Pertinence"]
                })
        
        # Limiter le nombre de résultats
        limit = min(request.limit or 10, 20)
        recommendations = recommendations[:limit]
        
        # S'assurer que tous les scores sont entre 0 et 100
        for rec in recommendations:
            if rec["score"] > 100:
                rec["score"] = 100
            elif rec["score"] < 0:
                rec["score"] = 0
        
        print(f"✅ Nombre de résultats finaux: {len(recommendations)}")
        return recommendations
        
    except Exception as e:
        print(f"❌ Erreur dans recommend_sujets: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la recommandation: {str(e)}"
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