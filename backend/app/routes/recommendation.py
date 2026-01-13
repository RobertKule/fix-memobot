from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import crud, schemas
from app.dependencies import get_current_user, require_admin
from app.recommendation import recommendation_engine
from app.schemas import (
    RecommendationRequest, 
    RecommendedSujet,
    UserPreferenceCreate,
    UserPreference,
    FeedbackCreate,
    Feedback,
    SaveSujetRequest,
    SavedSujetResponse
)

router = APIRouter()

@router.post("/recommend", response_model=List[RecommendedSujet])
def get_recommendations(
    request: RecommendationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtenir des recommandations de sujets de mémoire.
    """
    # Incrémenter le compteur d'interactions
    preference = crud.get_or_create_user_preference(db, current_user.id)
    preference.interaction_count += 1
    db.commit()
    
    # Obtenir les recommandations
    recommendations = recommendation_engine.recommend_sujets(
        db=db,
        request=request,
        user_id=current_user.id
    )
    
    return recommendations

@router.get("/personalized", response_model=List[RecommendedSujet])
def get_personalized_recommendations(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtenir des recommandations personnalisées basées sur l'historique.
    """
    recommendations = recommendation_engine.get_personalized_recommendations(
        db=db,
        user_id=current_user.id,
        limit=limit
    )
    
    return recommendations

@router.get("/sujets/", response_model=List[schemas.SujetMemoire])
def read_sujets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    faculty: Optional[str] = None,
    level: Optional[str] = None,
    domain: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Lister tous les sujets de mémoire avec filtres.
    """
    sujets = crud.get_sujets(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        faculty=faculty,
        level=level,
        domain=domain,
        difficulty=difficulty,
        is_active=True
    )
    return sujets

@router.get("/sujets/{sujet_id}", response_model=schemas.SujetMemoire)
def read_sujet(
    sujet_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Récupérer un sujet spécifique par ID.
    Incrémente le compteur de vues.
    """
    sujet = crud.get_sujet(db, sujet_id=sujet_id)
    if sujet is None or not sujet.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sujet not found"
        )
    
    # Incrémenter le compteur de vues
    crud.increment_view_count(db, sujet_id)
    
    return sujet

@router.post("/sujets/", response_model=schemas.SujetMemoire, status_code=status.HTTP_201_CREATED)
def create_sujet(
    sujet: schemas.SujetMemoireCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)  # Seulement pour les admins
):
    """
    Créer un nouveau sujet de mémoire.
    Accessible uniquement aux administrateurs.
    """
    return crud.create_sujet(db=db, sujet=sujet, user_id=current_user.id)

@router.put("/sujets/{sujet_id}", response_model=schemas.SujetMemoire)
def update_sujet(
    sujet_id: int,
    sujet_update: schemas.SujetMemoireUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)  # Seulement pour les admins
):
    """
    Mettre à jour un sujet de mémoire.
    Accessible uniquement aux administrateurs.
    """
    updated_sujet = crud.update_sujet(
        db=db,
        sujet_id=sujet_id,
        sujet_update=sujet_update
    )
    
    if not updated_sujet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sujet not found"
        )
    
    return updated_sujet

@router.delete("/sujets/{sujet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sujet(
    sujet_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)  # Seulement pour les admins
):
    """
    Supprimer un sujet de mémoire.
    Accessible uniquement aux administrateurs.
    """
    success = crud.delete_sujet(db, sujet_id=sujet_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sujet not found"
        )

@router.get("/preferences", response_model=UserPreference)
def get_user_preferences(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Récupérer les préférences de l'utilisateur.
    """
    preference = crud.get_or_create_user_preference(db, current_user.id)
    return preference

@router.put("/preferences", response_model=UserPreference)
def update_user_preferences(
    preference_update: UserPreferenceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Mettre à jour les préférences de l'utilisateur.
    """
    updated_preference = crud.update_user_preference(
        db=db,
        user_id=current_user.id,
        preference_update=preference_update
    )
    
    return updated_preference

@router.post("/feedback", response_model=Feedback)
def submit_feedback(
    feedback: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Soumettre un feedback sur une recommandation.
    """
    # Mettre à jour le modèle de recommandation
    recommendation_engine.update_recommendation_model(db, feedback)
    
    # Créer le feedback
    return crud.create_feedback(db=db, feedback=feedback, user_id=current_user.id)

@router.post("/save", response_model=SavedSujetResponse)
def save_sujet(
    save_request: SaveSujetRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Sauvegarder un sujet dans la liste personnelle.
    """
    saved_sujet = crud.save_sujet_for_user(
        db=db,
        user_id=current_user.id,
        sujet_id=save_request.sujet_id,
        notes=save_request.notes
    )
    
    # Récupérer le sujet complet
    sujet = crud.get_sujet(db, save_request.sujet_id)
    
    return SavedSujetResponse(
        id=saved_sujet.id,
        sujet=sujet,
        saved_at=saved_sujet.saved_at,
        notes=saved_sujet.notes
    )

@router.get("/saved", response_model=List[SavedSujetResponse])
def get_saved_sujets(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Récupérer tous les sujets sauvegardés par l'utilisateur.
    """
    saved_sujets = crud.get_saved_sujets(db, current_user.id)
    
    result = []
    for saved in saved_sujets:
        sujet = crud.get_sujet(db, saved.sujet_id)
        if sujet:
            result.append(SavedSujetResponse(
                id=saved.id,
                sujet=sujet,
                saved_at=saved.saved_at,
                notes=saved.notes
            ))
    
    return result

@router.delete("/saved/{sujet_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_saved_sujet(
    sujet_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retirer un sujet de la liste des sauvegardés.
    """
    success = crud.remove_saved_sujet(db, current_user.id, sujet_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved sujet not found"
        )

@router.get("/stats/popular")
def get_popular_sujets(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Récupérer les sujets les plus populaires.
    """
    sujets = db.query(models.SujetMemoire)\
        .filter(models.SujetMemoire.is_active == True)\
        .order_by(models.SujetMemoire.view_count.desc())\
        .limit(limit)\
        .all()
    
    return sujets

@router.get("/stats/keywords")
def get_popular_keywords(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Récupérer les mots-clés les plus populaires.
    """
    from collections import Counter
    
    sujets = crud.get_sujets(db, is_active=True, limit=1000)
    
    all_keywords = []
    for sujet in sujets:
        keywords = [k.strip() for k in sujet.keywords.split(',')]
        all_keywords.extend(keywords)
    
    keyword_counts = Counter(all_keywords)
    popular_keywords = keyword_counts.most_common(limit)
    
    return [
        {"keyword": keyword, "count": count}
        for keyword, count in popular_keywords
    ]