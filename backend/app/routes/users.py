from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import crud, schemas
from app.dependencies import get_current_user, require_admin
from app.schemas import User, UserUpdate

router = APIRouter()

@router.get("/", response_model=List[User])
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

@router.get("/{user_id}", response_model=User)
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

@router.put("/{user_id}", response_model=User)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)  # Seulement pour les admins
):
    """
    Mettre à jour un utilisateur.
    Accessible uniquement aux administrateurs.
    """
    user = crud.update_user(db, user_id=user_id, user_update=user_update)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)  # Seulement pour les admins
):
    """
    Supprimer un utilisateur.
    Accessible uniquement aux administrateurs.
    """
    success = crud.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

@router.patch("/{user_id}/activate")
def activate_user(
    user_id: int,
    active: bool,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)  # Seulement pour les admins
):
    """
    Activer ou désactiver un utilisateur.
    Accessible uniquement aux administrateurs.
    """
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = active
    db.commit()
    
    return {"message": f"User {'activated' if active else 'deactivated'} successfully"}