# routers/admin.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models import User, Sujet
from  app.dependencies import get_current_user

admin_router = APIRouter(prefix="/admin", tags=["admin"])
# Dépendance admin
async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user


# ========== ENDPOINTS ADMIN ==========

@admin_router.get("/users")
async def get_admin_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Récupère tous les utilisateurs avec filtres (admin seulement)
    """
    query = db.query(User)
    
    # Appliquer les filtres
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_term)) | 
            (User.full_name.ilike(search_term))
        )
    
    if role:
        query = query.filter(User.role == role)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    # Compter le total avant pagination
    total = query.count()
    
    # Pagination
    users = query.offset(skip).limit(limit).all()
    
    return {
        "users": users,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@admin_router.post("/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Active un utilisateur (admin seulement)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    user.is_active = True
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"Utilisateur {user.email} activé", "user": user}

@admin_router.post("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Désactive un utilisateur (admin seulement)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    user.is_active = False
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"Utilisateur {user.email} désactivé", "user": user}

@admin_router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Supprime un utilisateur (admin seulement)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Ne pas permettre la suppression de soi-même
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte")
    
    # Supprimer l'utilisateur
    db.delete(user)
    db.commit()
    
    return {"message": f"Utilisateur {user.email} supprimé"}

@admin_router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Récupère les statistiques admin
    """
    # Nombre total d'utilisateurs
    total_users = db.query(User).count()
    
    # Utilisateurs actifs
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Nombre total de sujets
    total_sujets = db.query(Sujet).count()
    
    # Sujets actifs
    active_sujets = db.query(Sujet).filter(Sujet.is_active == True).count()
    
    # Nombre d'analyses IA (à adapter selon votre modèle)
    # Si vous avez une table AIAnalysis:
    # total_ai_analyses = db.query(AIAnalysis).count()
    # Sinon, estimation basée sur les sujets analysés:
    sujets_with_analysis = db.query(Sujet).count()
    
    # Statistiques par domaine
    domain_stats = db.query(
        Sujet.domaine,
        func.count(Sujet.id).label('count'),
        func.avg(Sujet.vue_count).label('avg_views')
    ).group_by(Sujet.domaine).all()
    
    # Statistiques par rôle
    role_stats = db.query(
        User.role,
        func.count(User.id).label('count')
    ).group_by(User.role).all()
    
    # Activité récente (7 derniers jours)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    # Nouveaux utilisateurs (7 derniers jours)
    new_users = db.query(User).filter(User.created_at >= seven_days_ago).count()
    
    # Nouveaux sujets (7 derniers jours)
    new_sujets = db.query(Sujet).filter(Sujet.created_at >= seven_days_ago).count()
    
    # Activités récentes
    recent_activities = []
    
    # Ajouter les nouveaux utilisateurs récents
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(5).all()
    for user in recent_users:
        recent_activities.append({
            "type": "user",
            "action": "Nouvelle inscription",
            "user": user.email,
            "timestamp": user.created_at.isoformat()
        })
    
    # Ajouter les nouveaux sujets récents
    recent_sujets = db.query(Sujet).order_by(Sujet.created_at.desc()).limit(5).all()
    for sujet in recent_sujets:
        recent_activities.append({
            "type": "sujet",
            "action": "Sujet créé",
            "user": sujet.titre[:50] + "..." if len(sujet.titre) > 50 else sujet.titre,
            "timestamp": sujet.created_at.isoformat()
        })
    
    # Trier par timestamp
    recent_activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_sujets": total_sujets,
        "active_sujets": active_sujets,
        "ai_analyses": sujets_with_analysis,  # À ajuster
        "domain_stats": [
            {"domaine": d[0], "count": d[1], "avg_views": float(d[2] or 0)}
            for d in domain_stats
        ],
        "role_stats": [
            {"role": r[0], "count": r[1]}
            for r in role_stats
        ],
        "recent_stats": {
            "new_users_7d": new_users,
            "new_sujets_7d": new_sujets
        },
        "recent_activities": recent_activities[:10],  # 10 activités max
        "timestamp": datetime.utcnow().isoformat()
    }

# Fonction de dépendance pour vérifier l'admin
def get_current_admin_user(
    current_user: User = Depends(get_current_user)
):
    """
    Vérifie que l'utilisateur est un administrateur
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Accès refusé. Admin seulement."
        )
    return current_user

