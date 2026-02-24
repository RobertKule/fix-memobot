# app/schemas.py
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any, Union
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

# ========== AUTH SCHEMAS ==========
class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class UserBase(BaseModel):
    email: EmailStr = Field(..., description="Adresse email")
    full_name: str = Field(..., description="Nom complet")
    role: UserRole = Field(UserRole.STUDENT, description="Rôle de l'utilisateur")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Mot de passe")
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError('Le mot de passe doit contenir au moins 6 caractères')
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Adresse email")
    password: str = Field(..., description="Mot de passe")

class PasswordResetRequest(BaseModel):
    email: EmailStr = Field(..., description="Adresse email")

class PasswordReset(BaseModel):
    token: str = Field(..., description="Token de réinitialisation")
    new_password: str = Field(..., min_length=6, description="Nouveau mot de passe")

# ========== SUJET SCHEMAS ==========
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

class Sujet(BaseModel):
    """Modèle Sujet avec tous les champs optionnels pour éviter les erreurs de validation"""
    id: int
    titre: str = ""
    keywords: str = ""
    domaine: str = ""
    faculté: str = ""
    niveau: str = ""
    problématique: str = ""
    méthodologie: Optional[str] = ""
    technologies: Optional[str] = ""
    description: str = ""
    difficulté: str = "moyenne"
    durée_estimée: Optional[str] = ""
    ressources: Optional[str] = ""
    vue_count: int = 0
    like_count: int = 0
    is_active: bool = True
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None  # OPTIONNEL !
    updated_at: Optional[datetime] = None
    is_generated: Optional[bool] = False

    @validator("vue_count", "like_count", pre=True)
    def normalize_counts(cls, v):
        """Normalise les compteurs en entiers"""
        if v is None:
            return 0
        if isinstance(v, int):
            return v
        if isinstance(v, str):
            # Extraire uniquement les chiffres
            digits = ''.join(ch for ch in v if ch.isdigit())
            if digits:
                try:
                    return int(digits)
                except ValueError:
                    return 0
        return 0

    @validator("difficulté", pre=True)
    def normalize_difficulte(cls, v):
        """Normalise la difficulté"""
        if v is None:
            return "moyenne"
        if isinstance(v, DifficultyLevel):
            return v.value
        if isinstance(v, str):
            if v.lower() in ["facile", "moyenne", "difficile"]:
                return v.lower()
            return "moyenne"
        return "moyenne"

    class Config:
        from_attributes = True
        # Permettre les champs supplémentaires
        extra = "allow"
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
            DifficultyLevel: lambda v: v.value
        }

# ========== RECOMMENDATION SCHEMAS ==========
class RecommendationRequest(BaseModel):
    interests: List[str] = Field(default_factory=list, description="Centres d'intérêt")
    niveau: Optional[str] = None
    faculté: Optional[str] = None
    domaine: Optional[str] = None
    difficulté: Optional[DifficultyLevel] = None
    limit: int = Field(10, ge=1, le=50, description="Nombre de résultats")

    class Config:
        extra = "allow"

class RecommendedSujet(BaseModel):
    sujet: Sujet
    score: float = Field(0, ge=0, le=100, description="Score de correspondance (%)")
    raisons: List[str] = Field(default_factory=list, description="Raisons de la recommandation")
    critères_respectés: List[str] = Field(default_factory=list, description="Critères d'acceptation respectés")

    class Config:
        extra = "allow"

# ========== FEEDBACK SCHEMAS ==========
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
        extra = "allow"

# ========== USER PREFERENCE SCHEMAS ==========
class UserPreferenceBase(BaseModel):
    interests: Optional[str] = None
    faculty: Optional[str] = None
    level: Optional[str] = None
    field: Optional[str] = None  # Ajout du champ field

class UserPreferenceCreate(UserPreferenceBase):
    pass

class UserPreferenceUpdate(UserPreferenceBase):
    pass

class UserPreferenceResponse(UserPreferenceBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        extra = "allow"

# ========== USER PROFILE SCHEMAS ==========
class UserProfileBase(BaseModel):
    bio: Optional[str] = None
    location: Optional[str] = None
    university: Optional[str] = None
    field: Optional[str] = None
    level: Optional[str] = None
    interests: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None

class UserProfileCreate(UserProfileBase):
    user_id: int

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfile(UserProfileBase):
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        extra = "allow"

class UserSkillBase(BaseModel):
    name: str
    level: int = Field(..., ge=1, le=10)
    category: Optional[str] = None

class UserSkillCreate(UserSkillBase):
    pass

class UserSkillUpdate(UserSkillBase):
    pass

class UserSkill(UserSkillBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
        extra = "allow"

class UserStats(BaseModel):
    profile_completion: int = 0
    explored_subjects: int = 0
    recommendations_count: int = 0
    active_days: int = 0
    last_active: Optional[datetime] = None

    class Config:
        extra = "allow"

# ========== AI SCHEMAS ==========
class AIRequest(BaseModel):
    question: str
    context: Optional[str] = None

    class Config:
        extra = "allow"

class AIResponse(BaseModel):
    question: str
    message: str
    suggestions: List[str] = []

    class Config:
        from_attributes = True
        extra = "allow"

class AIAnalysisRequest(BaseModel):
    titre: str
    description: str
    domaine: Optional[str] = None
    niveau: Optional[str] = None
    faculté: Optional[str] = None
    problématique: Optional[str] = None
    keywords: Optional[str] = None
    context: Optional[str] = None

    class Config:
        extra = "allow"

class AIAnalysisResponse(BaseModel):
    pertinence: int = 0
    points_forts: List[str] = []
    points_faibles: List[str] = []
    suggestions: List[str] = []
    recommandations: List[str] = []

    class Config:
        extra = "allow"

class AnalyzeSubjectRequest(BaseModel):
    titre: str
    description: str
    domaine: Optional[str] = None
    niveau: Optional[str] = None
    faculté: Optional[str] = None
    problématique: Optional[str] = None
    keywords: Optional[str] = None
    context: Optional[str] = None
    
    class Config:
        from_attributes = True
        extra = "allow"

class GenerateSubjectsRequest(BaseModel):
    interests: List[str] = []
    domaine: Optional[str] = None
    niveau: Optional[str] = None
    faculté: Optional[str] = None
    count: int = 3

    class Config:
        extra = "allow"

class GeneratedSubject(BaseModel):
    titre: str = ""
    problématique: str = ""
    keywords: str = ""
    description: str = ""
    methodologie: str = ""
    difficulté: str = "moyenne"
    durée_estimée: str = ""

    class Config:
        extra = "allow"

class GeneratedSubjectItem(BaseModel):
    """Modèle pour les sujets générés par IA"""
    titre: str = ""
    description: str = ""
    problématique: str = ""
    keywords: str = ""
    domaine: str = ""
    niveau: str = ""
    faculté: str = ""
    difficulté: str = "moyenne"
    durée_estimée: str = ""
    methodologie: Optional[str] = ""
    original: bool = True
    generated_at: Optional[str] = None
    session_id: Optional[str] = None
    index: Optional[int] = None

    class Config:
        extra = "allow"

class AIGeneratedSubjects(BaseModel):
    session_id: str = ""
    subjects: List[GeneratedSubjectItem] = []
    count: int = 0
    message: str = ""

    class Config:
        extra = "allow"

class SaveChosenSubjectRequest(BaseModel):
    titre: str = ""
    description: str = ""
    keywords: str = ""
    domaine: str = ""
    niveau: str = ""
    faculté: str = ""
    problématique: str = ""
    méthodologie: str = ""
    difficulté: str = "moyenne"
    durée_estimée: str = ""
    interests: Optional[List[str]] = None

    class Config:
        extra = "allow"

class ActionButton(BaseModel):
    text: str = ""
    action: str = ""
    icon: Optional[str] = None

    class Config:
        extra = "allow"

class AIChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

    class Config:
        extra = "allow"

class AIChatResponse(BaseModel):
    message: str = ""
    suggestions: List[str] = []
    actions: List[ActionButton] = []
    timestamp: str = ""

    class Config:
        extra = "allow"

class AcceptanceCriteria(BaseModel):
    critères_acceptation: List[str] = []
    critères_rejet: List[str] = []
    conseils_pratiques: List[str] = []

    class Config:
        extra = "allow"

class TipsResponse(BaseModel):
    choix_sujet: List[str] = []
    methodologie: List[str] = []
    redaction: List[str] = []
    soutenance: List[str] = []

    class Config:
        extra = "allow"

class AIRecommendation(BaseModel):
    id: int
    score: float = 0
    raisons: List[str] = []
    critères: List[str] = []

    class Config:
        extra = "allow"

# ========== UTILITY SCHEMAS ==========
class PopularKeyword(BaseModel):
    keyword: str = ""
    count: int = 0

    class Config:
        extra = "allow"

class DomainStats(BaseModel):
    domaine: str = ""
    count: int = 0
    avg_views: float = 0

    class Config:
        extra = "allow"

# ========== DASHBOARD SCHEMAS ==========
class DashboardStats(BaseModel):
    total_sujets: int = 0
    user_sujets: int = 0
    saved_sujets: int = 0
    recommendations_count: int = 0
    last_activity: Optional[datetime] = None
    popular_keywords: List[PopularKeyword] = []
    domain_stats: List[DomainStats] = []

    class Config:
        extra = "allow"

# ========== SETTINGS SCHEMAS ==========
class SettingsBase(BaseModel):
    notifications_enabled: bool = True
    email_notifications: bool = True
    theme: str = "light"
    language: str = "fr"

class SettingsCreate(SettingsBase):
    user_id: int

class SettingsUpdate(SettingsBase):
    pass

class Settings(SettingsBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        extra = "allow"

# ========== HISTORY & CONVERSATION SCHEMAS ==========
class UserHistoryBase(BaseModel):
    action: str = ""
    details: Optional[str] = None
    sujet_id: Optional[int] = None

class UserHistoryCreate(UserHistoryBase):
    user_id: int

class UserHistory(UserHistoryBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
        extra = "allow"

class ConversationMessageBase(BaseModel):
    role: str = ""
    content: str = ""

class ConversationMessageCreate(ConversationMessageBase):
    user_id: int

class ConversationMessage(ConversationMessageBase):
    id: int
    user_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True
        extra = "allow"

class ResetConversationResponse(BaseModel):
    success: bool = False
    message: str = ""
    deleted_count: int = 0

    class Config:
        extra = "allow"

# Alias pour compatibilité
UserPreference = UserPreferenceResponse