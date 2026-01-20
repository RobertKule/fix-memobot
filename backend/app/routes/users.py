# app/routes/users.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app import crud, schemas
from app.dependencies import get_current_user, require_admin
from app.models import User, UserHistory, Sujet, Feedback, ConversationMessage, UserProfile, UserSkill

router = APIRouter(prefix="", tags=["users"])

# ========== HISTORIQUE ET ACTIVITÉ ==========

@router.get("/me/historique")
async def get_user_history(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Récupérer l'historique de l'utilisateur connecté
    """
    try:
        # Récupérer l'historique des actions
        history = db.query(UserHistory).filter(
            UserHistory.user_id == current_user.id
        ).order_by(UserHistory.created_at.desc()).limit(50).all()
        
        # Formater les résultats
        result = []
        for item in history:
            sujet_info = None
            if item.sujet_id:
                sujet = db.query(Sujet).filter(Sujet.id == item.sujet_id).first()
                if sujet:
                    sujet_info = {
                        "id": sujet.id,
                        "titre": sujet.titre,
                        "domaine": sujet.domaine
                    }
            
            result.append({
                "id": item.id,
                "action": item.action,
                "details": item.details,
                "sujet": sujet_info,
                "created_at": item.created_at.isoformat() if item.created_at else None
            })
        
        return result
    except Exception as e:
        print(f"Erreur dans get_user_history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur serveur: {str(e)}"
        )

@router.get("/me/activity")
async def get_user_activity(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Récupérer l'activité récente de l'utilisateur
    """
    try:
        # Récupérer les derniers feedbacks
        feedbacks = db.query(Feedback).filter(
            Feedback.user_id == current_user.id
        ).order_by(Feedback.created_at.desc()).limit(10).all()
        
        # Récupérer les derniers sujets créés
        user_sujets = db.query(Sujet).filter(
            Sujet.user_id == current_user.id
        ).order_by(Sujet.created_at.desc()).limit(5).all()
        
        # Récupérer l'historique de conversation
        conversations = db.query(ConversationMessage).filter(
            ConversationMessage.user_id == current_user.id
        ).order_by(ConversationMessage.timestamp.desc()).limit(5).all()
        
        return {
            "feedbacks": [
                {
                    "id": f.id,
                    "sujet_id": f.sujet_id,
                    "rating": f.rating,
                    "pertinence": f.pertinence,
                    "commentaire": f.commentaire,
                    "intéressé": f.intéressé,
                    "sélectionné": f.sélectionné,
                    "created_at": f.created_at.isoformat() if f.created_at else None
                }
                for f in feedbacks
            ],
            "sujets_created": [
                {
                    "id": s.id,
                    "titre": s.titre,
                    "domaine": s.domaine,
                    "created_at": s.created_at.isoformat() if s.created_at else None
                }
                for s in user_sujets
            ],
            "conversations": [
                {
                    "id": c.id,
                    "role": c.role,
                    "content": c.content[:100] + "..." if len(c.content) > 100 else c.content,
                    "timestamp": c.timestamp.isoformat() if c.timestamp else None
                }
                for c in conversations
            ]
        }
    except Exception as e:
        print(f"Erreur dans get_user_activity: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur serveur: {str(e)}"
        )

# ========== PRÉFÉRENCES UTILISATEUR ==========

@router.get("/me/preferences")
def get_my_preferences(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer les préférences de l'utilisateur connecté
    """
    preferences = crud.get_or_create_preference(db, current_user.id)
    return preferences

@router.put("/me/preferences")
def update_my_preferences(
    preference_update: dict,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour les préférences de l'utilisateur connecté
    """
    preferences = crud.update_preference(db, current_user.id, preference_update)
    return preferences

# ========== PROFIL UTILISATEUR ==========

@router.get("/{user_id}/profile", response_model=schemas.UserProfile)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Récupérer le profil utilisateur
    """
    # Vérifier que l'utilisateur peut accéder à ce profil
    if user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access other user's profile"
        )
    
    profile = crud.get_or_create_profile(db, user_id)
    return profile

@router.put("/{user_id}/profile", response_model=schemas.UserProfile)
def update_user_profile(
    user_id: int,
    profile_update: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Mettre à jour le profil utilisateur
    """
    # Vérifier que l'utilisateur peut mettre à jour son propre profil
    if user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update other user's profile"
        )
    
    profile = crud.update_user_profile(db, user_id, profile_update.dict(exclude_unset=True))
    return profile

# ========== COMPÉTENCES UTILISATEUR ==========

@router.get("/{user_id}/skills", response_model=List[schemas.UserSkill])
def get_user_skills(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Récupérer les compétences de l'utilisateur
    """
    # Vérifier que l'utilisateur peut accéder à ces données
    if user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access other user's skills"
        )
    
    skills = crud.get_user_skills(db, user_id)
    return skills

@router.post("/{user_id}/skills", response_model=schemas.UserSkill)
def create_user_skill_endpoint(
    user_id: int,
    skill: schemas.UserSkillCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Créer une compétence pour l'utilisateur
    """
    if user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create skill for other user"
        )
    
    return crud.create_user_skill(db, user_id, skill.dict())

@router.put("/{user_id}/skills", response_model=List[schemas.UserSkill])
def update_user_skills_endpoint(
    user_id: int,
    skills: List[schemas.UserSkillCreate],
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Mettre à jour toutes les compétences de l'utilisateur
    """
    if user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update skills for other user"
        )
    
    return crud.update_user_skills(db, user_id, [skill.dict() for skill in skills])

# ========== STATISTIQUES UTILISATEUR ==========

@router.get("/{user_id}/stats", response_model=schemas.UserStats)
def get_user_stats(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Récupérer les statistiques de l'utilisateur
    """
    # Vérifier que l'utilisateur peut accéder à ces données
    if user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access other user's stats"
        )
    
    stats = crud.get_user_stats(db, user_id)
    return stats

@router.get("/me/stats", response_model=schemas.UserStats)
def get_my_stats(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer les statistiques de l'utilisateur connecté
    """
    stats = crud.get_user_stats(db, current_user.id)
    return stats

@router.get("/me/dashboard-stats")
def get_dashboard_stats(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer les statistiques pour le tableau de bord
    """
    try:
        stats = crud.get_dashboard_stats(db, current_user.id)
        return stats
    except Exception as e:
        print(f"Erreur dans get_dashboard_stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur serveur: {str(e)}"
        )

# ========== ROUTES ADMIN ==========

@router.get("/", response_model=List[schemas.User])
def read_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)  # Seulement pour les admins
):
    """
    Récupérer tous les utilisateurs.
    Accessible uniquement aux administrateurs.
    """
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=schemas.User)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)  # Seulement pour les admins
):
    """
    Récupérer un utilisateur spécifique par ID.
    Accessible uniquement aux administrateurs.
    """
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

# ========== EXPORT/IMPORT ==========

@router.get("/me/export")
async def export_user_data(
    format: str = Query("json", pattern="^(json|csv)$"),
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exporter les données de l'utilisateur
    """
    try:
        # Récupérer toutes les données de l'utilisateur
        user_data = {
            "user": crud.get_user(db, current_user.id),
            "profile": crud.get_or_create_profile(db, current_user.id),
            "preferences": crud.get_or_create_preference(db, current_user.id),
            "skills": crud.get_user_skills(db, current_user.id),
            "sujets": db.query(Sujet).filter(Sujet.user_id == current_user.id).all(),
            "feedbacks": db.query(Feedback).filter(Feedback.user_id == current_user.id).all(),
            "history": db.query(UserHistory).filter(UserHistory.user_id == current_user.id).all(),
            "conversations": db.query(ConversationMessage).filter(
                ConversationMessage.user_id == current_user.id
            ).all()
        }
        
        # Convertir les objets datetime en string
        import json
        from datetime import datetime
        
        def json_serial(obj):
            """JSON serializer for objects not serializable by default json code"""
            if isinstance(obj, datetime):
                return obj.isoformat()
            raise TypeError(f"Type {type(obj)} not serializable")
        
        if format == "json":
            return user_data
        else:
            # Pour CSV, on retournerait une version simplifiée
            # Pour l'instant, retournons JSON
            return user_data
            
    except Exception as e:
        print(f"Erreur dans export_user_data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur serveur: {str(e)}"
        )

# ========== NOTIFICATIONS ==========

@router.get("/me/notifications")
async def get_notifications(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer les notifications de l'utilisateur
    """
    try:
        # Pour l'instant, retourner des notifications basées sur l'activité
        notifications = []
        
        # Notifications de nouveaux sujets dans vos domaines d'intérêt
        preferences = crud.get_or_create_preference(db, current_user.id)
        if preferences and preferences.interests:
            interests = [i.strip() for i in preferences.interests.split(',')]
            for interest in interests[:3]:  # Limiter à 3 intérêts
                recent_sujets = db.query(Sujet).filter(
                    Sujet.is_active == True,
                    Sujet.keywords.contains(interest)
                ).order_by(Sujet.created_at.desc()).limit(2).all()
                
                for sujet in recent_sujets:
                    notifications.append({
                        "id": f"interest_{sujet.id}",
                        "type": "new_subject",
                        "title": f"Nouveau sujet dans '{interest}'",
                        "message": f"Un nouveau sujet a été publié : {sujet.titre}",
                        "subject_id": sujet.id,
                        "read": False,
                        "created_at": sujet.created_at.isoformat() if sujet.created_at else None
                    })
        
        # Notifications de feedbacks reçus sur vos sujets
        user_sujets = db.query(Sujet).filter(Sujet.user_id == current_user.id).all()
        for sujet in user_sujets:
            feedbacks = db.query(Feedback).filter(
                Feedback.sujet_id == sujet.id,
                Feedback.user_id != current_user.id
            ).order_by(Feedback.created_at.desc()).limit(2).all()
            
            for feedback in feedbacks:
                notifications.append({
                    "id": f"feedback_{feedback.id}",
                    "type": "feedback_received",
                    "title": "Nouveau feedback reçu",
                    "message": f"Quelqu'un a commenté votre sujet : {sujet.titre}",
                    "subject_id": sujet.id,
                    "feedback_id": feedback.id,
                    "read": False,
                    "created_at": feedback.created_at.isoformat() if feedback.created_at else None
                })
        
        # Trier par date décroissante
        notifications.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        return notifications[:20]  # Limiter à 20 notifications
        
    except Exception as e:
        print(f"Erreur dans get_notifications: {e}")
        return []  # Retourner une liste vide en cas d'erreur

@router.post("/me/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marquer une notification comme lue
    """
    # Pour l'instant, cette fonction ne fait rien car les notifications sont générées dynamiquement
    # Dans une vraie application, vous auriez une table de notifications
    return {"success": True, "message": "Notification marquée comme lue"}

@router.get("/me/notifications/unread-count")
async def get_unread_notifications_count(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer le nombre de notifications non lues
    """
    try:
        notifications = await get_notifications(current_user, db)
        unread_count = sum(1 for n in notifications if not n.get("read", False))
        return {"count": unread_count}
    except Exception as e:
        print(f"Erreur dans get_unread_notifications_count: {e}")
        return {"count": 0}