# app/routes/preferences.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.dependencies import get_current_user
from app import crud, schemas
from app.models import User

router = APIRouter(prefix="/users/me/preferences", tags=["preferences"])

@router.get("", response_model=schemas.UserPreference)
def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les préférences de l'utilisateur connecté"""
    preference = crud.get_or_create_preference(db, current_user.id)
    return preference

@router.put("", response_model=schemas.UserPreference)
def update_preferences(
    preference_update: schemas.UserPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour les préférences de l'utilisateur"""
    preference = crud.update_preference(
        db, 
        current_user.id, 
        preference_update.dict(exclude_unset=True)
    )
    return preference