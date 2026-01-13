from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "enseignant"
    STUDENT = "etudiant"

class DifficultyLevel(str, Enum):
    FACILE = "facile"
    MOYENNE = "moyenne"
    DIFFICILE = "difficile"

# Auth
class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class UserBase(BaseModel):
    email: str = Field(..., description="Adresse email")
    full_name: str = Field(..., description="Nom complet")
    role: UserRole = Field(UserRole.STUDENT, description="Rôle de l'utilisateur")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Mot de passe")

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str = Field(..., description="Adresse email")
    password: str = Field(..., description="Mot de passe")

class PasswordResetRequest(BaseModel):
    email: str = Field(..., description="Adresse email")

class PasswordReset(BaseModel):
    token: str = Field(..., description="Token de réinitialisation")
    new_password: str = Field(..., min_length=6, description="Nouveau mot de passe")

# Sujets
class SujetBase(BaseModel):
    titre: str = Field(..., description="Titre du sujet")
    keywords: str = Field(..., description="Mots-clés séparés par virgules")
    domaine: str = Field(..., description="Domaine")
    faculté: str = Field(..., description="Faculté")
    niveau: str = Field(..., description="Niveau académique")
    problématique: str = Field(..., description="Problématique de recherche")
    méthodologie: Optional[str] = Field(None, description="Méthodologie proposée")
    technologies: Optional[str] = Field(None, description="Technologies à utiliser")
    description: str = Field(..., description="Description détaillée")
    difficulté: DifficultyLevel = Field(DifficultyLevel.MOYENNE, description="Niveau de difficulté")
    durée_estimée: Optional[str] = Field(None, description="Estimation de durée")
    ressources: Optional[str] = Field(None, description="Ressources nécessaires")

class SujetCreate(SujetBase):
    pass

class SujetUpdate(BaseModel):
    titre: Optional[str] = None
    keywords: Optional[str] = None
    domaine: Optional[str] = None
    faculté: Optional[str] = None
    niveau: Optional[str] = None
    problématique: Optional[str] = None
    méthodologie: Optional[str] = None
    technologies: Optional[str] = None
    description: Optional[str] = None
    difficulté: Optional[DifficultyLevel] = None
    durée_estimée: Optional[str] = None
    ressources: Optional[str] = None
    is_active: Optional[bool] = None

class Sujet(SujetBase):
    id: int
    vue_count: int
    like_count: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Recommandation
class RecommendationRequest(BaseModel):
    interests: List[str] = Field(..., description="Centres d'intérêt")
    niveau: Optional[str] = None
    faculté: Optional[str] = None
    domaine: Optional[str] = None
    difficulté: Optional[DifficultyLevel] = None
    limit: int = Field(10, ge=1, le=50, description="Nombre de résultats")

class RecommendedSujet(BaseModel):
    sujet: Sujet
    score: float = Field(..., ge=0, le=100, description="Score de correspondance (%)")
    raisons: List[str] = Field(..., description="Raisons de la recommandation")
    critères_respectés: List[str] = Field(..., description="Critères d'acceptation respectés")

# Feedback
class FeedbackCreate(BaseModel):
    sujet_id: int = Field(..., description="ID du sujet")
    rating: Optional[int] = Field(None, ge=1, le=5, description="Note 1-5")
    pertinence: Optional[int] = Field(None, ge=1, le=10, description="Pertinence 1-10")
    commentaire: Optional[str] = Field(None, description="Commentaire")
    intéressé: bool = Field(False, description="Était intéressé par le sujet")
    sélectionné: bool = Field(False, description="A sélectionné ce sujet")

class Feedback(BaseModel):
    id: int
    user_id: int
    sujet_id: int
    rating: Optional[int] = None
    pertinence: Optional[int] = None
    commentaire: Optional[str] = None
    intéressé: bool
    sélectionné: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Préférences
class PreferenceCreate(BaseModel):
    interests: Optional[str] = Field(None, description="Intérêts")
    faculty: Optional[str] = Field(None, description="Faculté")
    level: Optional[str] = Field(None, description="Niveau")

class Preference(BaseModel):
    id: int
    user_id: int
    interests: Optional[str] = None
    faculty: Optional[str] = None
    level: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# IA
class AIQuestion(BaseModel):
    question: str = Field(..., description="Question")
    context: Optional[str] = Field(None, description="Contexte supplémentaire")


# Ajouter à app/schemas.py
class UserPreferenceBase(BaseModel):
    interests: Optional[str] = ""
    faculty: Optional[str] = None
    level: Optional[str] = None

class UserPreferenceCreate(UserPreferenceBase):
    user_id: int

class UserPreferenceUpdate(UserPreferenceBase):
    pass

class UserPreference(UserPreferenceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Ajouter dans app/schemas.py

class AIRequest(BaseModel):
    question: str
    context: Optional[str] = None

class AIResponse(BaseModel):
    question: str
    réponse: str
    suggestions: List[str] = []

class AIAnalysisRequest(BaseModel):
    titre: str
    description: str
    domaine: Optional[str] = None
    niveau: Optional[str] = None
    faculté: Optional[str] = None
    problématique: Optional[str] = None
    keywords: Optional[str] = None
    context: Optional[str] = None

class AIAnalysisResponse(BaseModel):
    pertinence: int
    points_forts: List[str]
    points_faibles: List[str]
    suggestions: List[str]
    recommandations: List[str]

class GenerateSubjectsRequest(BaseModel):
    interests: List[str]
    domaine: Optional[str] = None
    niveau: Optional[str] = None
    faculté: Optional[str] = None
    count: Optional[int] = 3

class GeneratedSubject(BaseModel):
    titre: str
    problématique: str
    keywords: str
    description: str
    methodologie: str
    difficulté: str
    durée_estimée: str