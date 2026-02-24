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
# app/routes/sujets.py - Version corrigée de la route /recommend

@router.post("/recommend", response_model=List[schemas.RecommendedSujet])
async def recommend_sujets(
    request: schemas.RecommendationRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recommandation de sujets basée sur les intérêts et le profil de l'utilisateur"""
    try:
        print(f"📥 Recommandation request from user {current_user.email}")
        
        # ===== 1. RÉCUPÉRER LE PROFIL COMPLET DE L'UTILISATEUR =====
        user_profile = None
        user_preferences = None
        
        # Essayer de récupérer depuis user_profiles
        try:
            from app.models import UserProfile
            user_profile = db.query(UserProfile).filter(
                UserProfile.user_id == current_user.id
            ).first()
        except Exception as e:
            print(f"⚠️ Erreur récupération profile: {e}")
        
        # Essayer de récupérer depuis user_preferences
        try:
            from app.models import UserPreferences
            user_preferences = db.query(UserPreferences).filter(
                UserPreferences.user_id == current_user.id
            ).first()
        except Exception as e:
            print(f"⚠️ Erreur récupération préférences: {e}")
        
        # ===== 2. DÉTERMINER LA FACULTÉ/DOMAINE DE L'UTILISATEUR =====
        user_faculty = None
        user_field = None
        user_level = None
        user_interests = []
        
        # Priorité 1: Request explicite
        if request.faculté:
            user_faculty = request.faculté
        elif request.domaine:
            user_field = request.domaine
        
        # Priorité 2: User profile
        if not user_faculty and user_profile and hasattr(user_profile, 'field'):
            user_field = user_profile.field
            # Déduire la faculté du domaine
            if user_field:
                if "informatique" in user_field.lower() or "info" in user_field.lower():
                    user_faculty = "Génie Informatique"
                elif "civil" in user_field.lower():
                    user_faculty = "Génie Civil"
                elif "electrique" in user_field.lower() or "électrique" in user_field.lower():
                    user_faculty = "Génie Électrique"
                elif "electronique" in user_field.lower() or "électronique" in user_field.lower():
                    user_faculty = "Génie Électronique"
                elif "mecanique" in user_field.lower() or "mécanique" in user_field.lower():
                    user_faculty = "Génie Mécanique"
        
        # Priorité 3: User preferences
        if not user_faculty and user_preferences and hasattr(user_preferences, 'faculty'):
            user_faculty = user_preferences.faculty
        
        if not user_field and user_preferences and hasattr(user_preferences, 'field'):
            user_field = user_preferences.field
        
        # Niveau
        if request.niveau:
            user_level = request.niveau
        elif user_profile and hasattr(user_profile, 'level'):
            user_level = user_profile.level
        elif user_preferences and hasattr(user_preferences, 'level'):
            user_level = user_preferences.level
        
        # Intérêts
        if request.interests:
            user_interests = request.interests
        elif user_profile and hasattr(user_profile, 'interests') and user_profile.interests:
            if isinstance(user_profile.interests, str):
                user_interests = [i.strip() for i in user_profile.interests.split(',') if i.strip()]
        elif user_preferences and hasattr(user_preferences, 'interests') and user_preferences.interests:
            if isinstance(user_preferences.interests, str):
                user_interests = [i.strip() for i in user_preferences.interests.split(',') if i.strip()]
        
        print(f"👤 Profil utilisateur déterminé:")
        print(f"   - Faculté: {user_faculty}")
        print(f"   - Domaine: {user_field}")
        print(f"   - Niveau: {user_level}")
        print(f"   - Intérêts: {user_interests}")
        
        # ===== 3. CONSTRUIRE LA REQUÊTE AVEC FILTRAGE STRICT =====
        query = db.query(Sujet).filter(Sujet.is_active == True)
        
        # FILTRAGE PAR FACULTÉ (TRÈS STRICT)
        if user_faculty:
            print(f"🔍 FILTRAGE STRICT par faculté: '{user_faculty}'")
            # Utiliser une correspondance flexible (contient, pas égalité stricte)
            query = query.filter(
                (Sujet.faculté.ilike(f"%{user_faculty}%")) |
                (Sujet.domaine.ilike(f"%{user_faculty}%"))
            )
        elif user_field:
            print(f"🔍 FILTRAGE STRICT par domaine: '{user_field}'")
            query = query.filter(
                (Sujet.domaine.ilike(f"%{user_field}%")) |
                (Sujet.faculté.ilike(f"%{user_field}%"))
            )
        else:
            # Si pas de faculté/domaine, prendre tous les sujets mais avec un avertissement
            print("⚠️ AUCUNE FACULTÉ/DOMAINE DÉFINI, prise de tous les sujets")
        
        # FILTRAGE PAR NIVEAU (si disponible)
        if user_level:
            print(f"🔍 Filtrage par niveau: '{user_level}'")
            query = query.filter(Sujet.niveau.ilike(f"%{user_level}%"))
        
        # Exécuter la requête
        sujets = query.all()
        print(f"📚 {len(sujets)} sujets trouvés après filtrage par faculté/domaine")
        
        # Si trop peu de sujets, élargir un peu mais GARDER la faculté
        if len(sujets) < 5 and user_faculty:
            print("⚠️ Trop peu de sujets, élargissement mais garde la faculté")
            query = db.query(Sujet).filter(Sujet.is_active == True)
            query = query.filter(
                (Sujet.faculté.ilike(f"%{user_faculty}%")) |
                (Sujet.domaine.ilike(f"%{user_faculty}%"))
            )
            sujets = query.all()
            print(f"📚 {len(sujets)} sujets après élargissement")
        
        # ===== 4. CONVERTIR EN DICTIONNAIRES AVEC TOUS LES CHAMPS =====
        sujets_dict = []
        for sujet in sujets:
            sujet_dict = {
                "id": sujet.id,
                "titre": sujet.titre or "",
                "description": sujet.description or "",
                "keywords": sujet.keywords or "",
                "domaine": sujet.domaine or "",
                "niveau": sujet.niveau or "",
                "faculté": sujet.faculté or "",
                "difficulté": sujet.difficulté or "moyenne",
                "problématique": sujet.problématique or "",
                "vue_count": sujet.vue_count or 0,
                "like_count": sujet.like_count or 0,
                "created_at": datetime.now().isoformat()  # Valeur par défaut
            }
            sujets_dict.append(sujet_dict)
        
        # ===== 5. PRÉPARER LES CRITÈRES POUR LE SCORING =====
        critères = {}
        if user_faculty:
            critères["faculté"] = user_faculty
        if user_field:
            critères["domaine"] = user_field
        if user_level:
            critères["niveau"] = user_level
        
        print(f"📊 Critères pour scoring: {critères}")
        
        # ===== 6. GÉNÉRER LES RECOMMANDATIONS AVEC SCORING =====
        recommendations = []
        
        for sujet_dict in sujets_dict:
            score = 50  # Score de base
            raisons = []
            critères_respectés = []
            
            # --- CORRESPONDANCE FACULTÉ (30 points) ---
            if user_faculty and sujet_dict.get("faculté"):
                if user_faculty.lower() in sujet_dict["faculté"].lower() or sujet_dict["faculté"].lower() in user_faculty.lower():
                    score += 30
                    raisons.append(f"Correspond à votre faculté: {sujet_dict['faculté']}")
                    critères_respectés.append("faculté")
            
            # --- CORRESPONDANCE DOMAINE (25 points) ---
            if user_field and sujet_dict.get("domaine"):
                if user_field.lower() in sujet_dict["domaine"].lower() or sujet_dict["domaine"].lower() in user_field.lower():
                    score += 25
                    if not raisons or "faculté" not in str(raisons):
                        raisons.append(f"Dans votre domaine: {sujet_dict['domaine']}")
                    critères_respectés.append("domaine")
            
            # --- CORRESPONDANCE INTÉRÊTS (20 points) ---
            titre = sujet_dict.get("titre", "").lower()
            keywords = sujet_dict.get("keywords", "").lower()
            description = sujet_dict.get("description", "").lower()
            
            for interest in user_interests:
                if not interest:
                    continue
                interest_lower = interest.lower()
                if interest_lower in titre:
                    score += 15
                    if "intérêt" not in str(raisons):
                        raisons.append(f"Lié à votre intérêt: {interest}")
                    critères_respectés.append("intérêts")
                elif interest_lower in keywords:
                    score += 10
                    if "intérêt" not in str(raisons) and len(raisons) < 2:
                        raisons.append(f"En lien avec: {interest}")
                    critères_respectés.append("intérêts")
            
            # --- CORRESPONDANCE NIVEAU (15 points) ---
            if user_level and sujet_dict.get("niveau"):
                if user_level.lower() in sujet_dict["niveau"].lower() or sujet_dict["niveau"].lower() in user_level.lower():
                    score += 15
                    if "niveau" not in str(raisons):
                        raisons.append(f"Niveau adapté: {sujet_dict['niveau']}")
                    critères_respectés.append("niveau")
            
            # --- PÉNALITÉ POUR LES SUJETS HORS DOMAINE ---
            # Si le sujet est clairement d'une autre faculté, réduire le score
            sujet_faculte = sujet_dict.get("faculté", "").lower()
            if user_faculty and sujet_faculte:
                if "electrique" in sujet_faculte and "informatique" not in user_faculty.lower():
                    score -= 20
                elif "civil" in sujet_faculte and "informatique" not in user_faculty.lower():
                    score -= 20
                elif "mecanique" in sujet_faculte and "informatique" not in user_faculty.lower():
                    score -= 20
            
            # S'assurer que le score est entre 0 et 100
            score = max(0, min(100, score))
            
            # Ajouter aux recommandations si le score est suffisant
            if score >= 30:  # Seuil minimum
                if not raisons:
                    raisons = ["Sujet pertinent"]
                
                recommendations.append({
                    "sujet": sujet_dict,
                    "score": score,
                    "raisons": raisons[:3],
                    "critères_respectés": critères_respectés or ["Pertinence"]
                })
        
        # Trier par score décroissant
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        
        # Limiter le nombre de résultats
        limit = min(request.limit or 10, 20)
        recommendations = recommendations[:limit]
        
        print(f"✅ {len(recommendations)} recommandations finales")
        
        # Afficher la répartition par faculté pour déboguer
        facultes = {}
        for rec in recommendations:
            fac = rec["sujet"].get("faculté", "Inconnu")
            facultes[fac] = facultes.get(fac, 0) + 1
        print(f"📊 Répartition par faculté: {facultes}")
        
        return recommendations
        
    except Exception as e:
        print(f"❌ Erreur dans recommend_sujets: {e}")
        import traceback
        traceback.print_exc()
        # Retourner une liste vide en cas d'erreur
        return []
    
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