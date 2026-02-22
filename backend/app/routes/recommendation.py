# app/routes/recommendation.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import crud, schemas, models
from app.dependencies import get_current_user, require_admin
from app.recommendation import recommendation_engine

router = APIRouter(prefix="/recommendations", tags=["recommendation"])

@router.post("/recommend", response_model=List[schemas.RecommendedSujet])
def get_recommendations(
    request: schemas.RecommendationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtenir des recommandations de sujets de mémoire.
    """
    try:
        # Obtenir les recommandations
        recommendations = recommendation_engine.recommend_sujets(
            db=db,
            interests=request.interests,
            niveau=request.niveau,
            faculté=request.faculté,
            domaine=request.domaine,
            difficulté=request.difficulté,
            limit=request.limit
        )
        
        return recommendations
    except Exception as e:
        print(f"Erreur dans get_recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la recommandation: {str(e)}"
        )

@router.get("/personalized", response_model=List[schemas.RecommendedSujet])
def get_personalized_recommendations(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtenir des recommandations personnalisées basées sur l'historique.
    """
    try:
        # Récupérer les préférences de l'utilisateur
        # CORRECTION : utiliser get_or_create_preference au lieu de get_user_preference
        preferences = crud.get_or_create_preference(db, current_user.id)
        
        interests = []
        if preferences and preferences.interests:
            interests = [i.strip() for i in preferences.interests.split(',') if i.strip()]
        
        # Si pas d'intérêts, utiliser des intérêts par défaut
        if not interests:
            interests = ["informatique", "recherche", "développement"]
        
        recommendations = recommendation_engine.recommend_sujets(
            db=db,
            interests=interests,
            niveau=preferences.level if preferences else None,
            faculté=preferences.faculty if preferences else None,
            limit=limit
        )
        
        return recommendations
    except Exception as e:
        print(f"Erreur dans get_personalized_recommendations: {e}")
        return []
    
@router.get("/stats/popular", response_model=List[schemas.Sujet])
def get_popular_sujets(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Récupérer les sujets les plus populaires.
    """
    try:
        sujets = db.query(models.Sujet)\
            .filter(models.Sujet.is_active == True)\
            .order_by(models.Sujet.vue_count.desc())\
            .limit(limit)\
            .all()
        return sujets
    except Exception as e:
        print(f"Erreur dans get_popular_sujets: {e}")
        return []

@router.get("/stats/keywords")
def get_popular_keywords(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Récupérer les mots-clés les plus populaires.
    """
    try:
        from collections import Counter
        
        sujets = db.query(models.Sujet).filter(models.Sujet.is_active == True).limit(500).all()
        
        all_keywords = []
        for sujet in sujets:
            if sujet.keywords:
                keywords = [k.strip().lower() for k in sujet.keywords.split(',') if k.strip()]
                all_keywords.extend(keywords)
        
        keyword_counts = Counter(all_keywords)
        popular_keywords = keyword_counts.most_common(limit)
        
        return [
            {"keyword": keyword, "count": count}
            for keyword, count in popular_keywords
        ]
    except Exception as e:
        print(f"Erreur dans get_popular_keywords: {e}")
        return []