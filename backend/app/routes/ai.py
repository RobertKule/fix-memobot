# app/routes/ai.py - VERSION COMPLÈTE FONCTIONNELLE
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app import schemas
from app.recommendation import recommendation_engine

router = APIRouter(tags=["ai"])

# Importer dynamiquement le service LLM
try:
    from app.llm_service import (
        répondre_question, 
        get_acceptance_criteria, 
        analyser_sujet,
        générer_sujets_llm,
        get_tips
    )
    LLM_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Erreur import llm_service: {e}")
    LLM_AVAILABLE = False
    
    # Fonctions de secours
    def répondre_question(question: str, contexte: str = None) -> str:
        return "Le service IA est temporairement indisponible. Veuillez consulter votre enseignant pour des conseils personnalisés."
    
    def get_acceptance_criteria() -> dict:
        return {
            "critères_acceptation": ["Consulter votre directeur"],
            "critères_rejet": ["Service IA indisponible"],
            "conseils_pratiques": ["Contactez votre établissement"]
        }
    
    def analyser_sujet(sujet_data: dict) -> dict:
        return {
            "pertinence": 70,
            "points_forts": ["Analyse automatique"],
            "points_faibles": ["Service IA indisponible"],
            "suggestions": ["Consulter un enseignant"],
            "recommandations": ["Valider avec expert"]
        }
    
    def générer_sujets_llm(params: dict, count: int) -> list:
        return []
    
    def get_tips() -> dict:
        return {
            "choix_sujet": ["Consulter expert"],
            "methodologie": ["Définir méthodologie"],
            "redaction": ["Rédiger régulièrement"],
            "soutenance": ["Préparer soutenance"]
        }

@router.post("/ask", response_model=schemas.AIResponse)
async def ask_question(
    request: schemas.AIRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Poser une question à l'IA"""
    if not request.question or not request.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La question est requise"
        )
    
    try:
        # Récupérer le contexte de l'utilisateur (préférences)
        from app import crud
        preference = crud.get_or_create_preference(db, current_user.id)
        
        user_context = ""
        if preference:
            if preference.interests:
                user_context += f"Intérêts de l'utilisateur: {preference.interests}\n"
            if preference.level:
                user_context += f"Niveau: {preference.level}\n"
            if preference.faculty:
                user_context += f"Faculté: {preference.faculty}\n"
        
        if request.context:
            user_context += f"\nContexte supplémentaire: {request.context}"
        
        réponse = répondre_question(request.question, user_context)
        
        # Extraire des suggestions potentielles
        suggestions = []
        if "conseil" in réponse.lower() or "suggestion" in réponse.lower():
            suggestions = [
                "Consulter un enseignant référent",
                "Étudier des travaux similaires",
                "Définir une méthodologie claire"
            ]
        
        return {
            "question": request.question,
            "réponse": réponse,
            "suggestions": suggestions
        }
    except Exception as e:
        print(f"Erreur dans ask_question: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du traitement de la question: {str(e)}"
        )

@router.get("/criteria")
async def get_criteria(current_user = Depends(get_current_user)):
    """Critères d'acceptation"""
    try:
        return get_acceptance_criteria()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )

@router.post("/analyze", response_model=schemas.AIAnalysisResponse)
async def analyze_subject(
    analysis_request: schemas.AIAnalysisRequest,
    current_user = Depends(get_current_user),
):
    """Analyser un sujet"""
    if not analysis_request.titre or not analysis_request.description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Titre et description requis"
        )
    
    try:
        sujet_data = {
            "titre": analysis_request.titre,
            "description": analysis_request.description,
            "domaine": analysis_request.domaine or "Général",
            "niveau": analysis_request.niveau or "L3",
            "faculté": analysis_request.faculté or "Général",
            "problematique": analysis_request.problématique or "",
            "keywords": analysis_request.keywords or "",
        }
        
        analysis = analyser_sujet(sujet_data)
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )

@router.post("/generate", response_model=List[schemas.GeneratedSubject])
async def generate_subjects(
    generate_request: schemas.GenerateSubjectsRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Générer des sujets avec IA"""
    if not generate_request.interests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Au moins un intérêt est requis"
        )
    
    try:
        # Récupérer les préférences de l'utilisateur pour enrichir la génération
        from app import crud
        preference = crud.get_or_create_preference(db, current_user.id)
        
        # Utiliser les préférences si disponibles, sinon les paramètres de la requête
        domaine = generate_request.domaine or (preference.faculty if preference else "Général")
        niveau = generate_request.niveau or (preference.level if preference else "L3")
        faculté = domaine  # Utiliser le domaine comme faculté par défaut
        
        params = {
            "interests": ", ".join(generate_request.interests),
            "domaine": domaine,
            "niveau": niveau,
            "faculté": faculté
        }
        
        generated = générer_sujets_llm(params, generate_request.count or 3)
        return generated
    except Exception as e:
        print(f"Erreur dans generate_subjects: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération: {str(e)}"
        )

@router.get("/tips")
async def get_tips_endpoint(current_user = Depends(get_current_user)):
    """Conseils pour la rédaction"""
    try:
        return get_tips()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )

@router.post("/recommend", response_model=List[schemas.RecommendedSujet])
async def recommend_with_ai(
    request: schemas.RecommendationRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recommandation de sujets avec IA"""
    try:
        # Récupérer les sujets correspondant aux critères de base
        from app import crud
        sujets = crud.get_sujets(
            db,
            domaine=request.domaine,
            faculté=request.faculté,
            niveau=request.niveau,
            limit=50
        )
        
        if not sujets:
            return []
        
        # Préparer les données pour l'IA
        sujets_data = []
        for sujet in sujets:
            sujets_data.append({
                "id": sujet.id,
                "titre": sujet.titre,
                "keywords": sujet.keywords,
                "domaine": sujet.domaine,
                "niveau": sujet.niveau,
                "faculté": sujet.faculté,
                "difficulté": sujet.difficulté,
                "problématique": sujet.problématique,
                "description": sujet.description
            })
        
        # Obtenir les recommandations de l'IA
        if LLM_AVAILABLE:
            try:
                from app.llm_service import recommander_sujets_llm
                
                critères = {
                    "niveau": request.niveau,
                    "faculté": request.faculté,
                    "domaine": request.domaine,
                    "difficulté": request.difficulté
                }
                
                ai_recommendations = recommander_sujets_llm(
                    request.interests,
                    sujets_data,
                    critères
                )
                
                # Associer les recommandations IA avec les sujets complets
                results = []
                for rec in ai_recommendations:
                    sujet = next((s for s in sujets if s.id == rec["id"]), None)
                    if sujet:
                        results.append({
                            "sujet": sujet,
                            "score": rec.get("score", 0),
                            "raisons": rec.get("raisons", []),
                            "critères_respectés": rec.get("critères", [])
                        })
                
                return results[:request.limit]
                
            except Exception as e:
                print(f"⚠️ Erreur recommandation IA, utilisation du moteur traditionnel: {e}")
        
        # Fallback: utiliser le moteur de recommandation traditionnel
        recommendations = recommendation_engine.recommend_sujets(
            db=db,
            interests=request.interests,
            niveau=request.niveau,
            faculté=request.faculté,
            domaine=request.domaine,
            difficulté=request.difficulté,
            limit=request.limit
        )
        
        # Convertir au format attendu
        results = []
        for rec in recommendations:
            results.append({
                "sujet": rec["sujet"],
                "score": rec["score"],
                "raisons": rec["raisons"],
                "critères_respectés": rec["critères_respectés"]
            })
        
        return results
        
    except Exception as e:
        print(f"Erreur dans recommend_with_ai: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la recommandation: {str(e)}"
        )