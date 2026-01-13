from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app import models, schemas
from app.auth import get_password_hash

# Users
def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Sujets
def get_sujet(db: Session, sujet_id: int) -> Optional[models.Sujet]:
    return db.query(models.Sujet).filter(models.Sujet.id == sujet_id).first()

def get_sujets(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    domaine: str = None,
    faculté: str = None,
    niveau: str = None,
    difficulté: str = None
) -> List[models.Sujet]:
    
    query = db.query(models.Sujet).filter(models.Sujet.is_active == True)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.Sujet.titre.ilike(search_term)) |
            (models.Sujet.keywords.ilike(search_term)) |
            (models.Sujet.problématique.ilike(search_term))
        )
    
    if domaine:
        query = query.filter(models.Sujet.domaine.ilike(f"%{domaine}%"))
    
    if faculté:
        query = query.filter(models.Sujet.faculté.ilike(f"%{faculté}%"))
    
    if niveau:
        query = query.filter(models.Sujet.niveau == niveau)
    
    if difficulté:
        query = query.filter(models.Sujet.difficulté == difficulté)
    
    return query.order_by(models.Sujet.created_at.desc()).offset(skip).limit(limit).all()

def create_sujet(db: Session, sujet: schemas.SujetCreate) -> models.Sujet:
    db_sujet = models.Sujet(**sujet.dict())
    db.add(db_sujet)
    db.commit()
    db.refresh(db_sujet)
    return db_sujet

def update_sujet_vue_count(db: Session, sujet_id: int):
    sujet = get_sujet(db, sujet_id)
    if sujet:
        sujet.vue_count += 1
        db.commit()

# Préférences
def get_or_create_preference(db: Session, user_id: int) -> models.UserPreference:
    preference = db.query(models.UserPreference).filter(models.UserPreference.user_id == user_id).first()
    if not preference:
        preference = models.UserPreference(user_id=user_id)
        db.add(preference)
        db.commit()
        db.refresh(preference)
    return preference

def update_preference(db: Session, user_id: int, preference_data: Dict[str, Any]) -> models.UserPreference:
    preference = get_or_create_preference(db, user_id)
    
    for key, value in preference_data.items():
        if value is not None:
            setattr(preference, key, value)
    
    db.commit()
    db.refresh(preference)
    return preference

# Feedback
def create_feedback(db: Session, feedback: schemas.FeedbackCreate, user_id: int) -> models.Feedback:
    db_feedback = models.Feedback(**feedback.dict(), user_id=user_id)
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def search_sujets_by_keywords(db: Session, keywords: List[str], limit: int = 10) -> List[models.Sujet]:
    """Recherche simple par mots-clés"""
    if not keywords:
        return []
    
    query = db.query(models.Sujet).filter(models.Sujet.is_active == True)
    
    # Construire la condition OR pour chaque mot-clé
    import sqlalchemy as sa
    conditions = []
    for keyword in keywords:
        keyword_pattern = f"%{keyword.lower()}%"
        conditions.append(sa.func.lower(models.Sujet.keywords).like(keyword_pattern))
        conditions.append(sa.func.lower(models.Sujet.titre).like(keyword_pattern))
        conditions.append(sa.func.lower(models.Sujet.description).like(keyword_pattern))
    
    if conditions:
        query = query.filter(sa.or_(*conditions))
    
    return query.order_by(models.Sujet.vue_count.desc()).limit(limit).all()

def get_popular_keywords(db: Session, limit: int = 20) -> List[Dict[str, Any]]:
    """Récupère les mots-clés les plus populaires"""
    from collections import Counter
    
    sujets = get_sujets(db, limit=1000)
    all_keywords = []
    
    for sujet in sujets:
        keywords = [k.strip().lower() for k in sujet.keywords.split(',')]
        all_keywords.extend(keywords)
    
    keyword_counts = Counter(all_keywords)
    popular = keyword_counts.most_common(limit)
    
    return [{"keyword": k, "count": c} for k, c in popular]

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """Récupère tous les utilisateurs"""
    return db.query(models.User).offset(skip).limit(limit).all()

