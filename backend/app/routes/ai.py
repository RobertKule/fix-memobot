# app/routes/ai.py - Version complète
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.dependencies import get_current_user
from app.models import User
from app import schemas

router = APIRouter(prefix="/ai", tags=["ai"])

# Importer dynamiquement
try:
    from app.llm_service import (
        répondre_question, 
        get_acceptance_criteria, 
        analyser_sujet,
        générer_sujets_llm,
        get_tips,
        recommander_sujets_llm
    )
    LLM_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Erreur import llm_service: {e}")
    LLM_AVAILABLE = False
    
    # Fonctions de secours
    def répondre_question(question: str, contexte: str = None) -> str:
        return "Service IA temporairement indisponible."
    
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

@router.post("/ask")
async def ask_question(
    request: schemas.AIRequest,
    current_user: User = Depends(get_current_user),
):
    """Poser une question à l'IA"""
    if not request.question or not request.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La question est requise"
        )
    
    try:
        réponse = répondre_question(request.question, request.context)
        
        # Extraire des suggestions
        suggestions = []
        if "conseil" in réponse.lower() or "suggestion" in réponse.lower():
            suggestions = [
                "Consulter un enseignant",
                "Étudier des travaux similaires",
                "Définir méthodologie claire"
            ]
        
        return {
            "question": request.question,
            "réponse": réponse,
            "suggestions": suggestions
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )

@router.get("/criteria")
async def get_criteria(current_user: User = Depends(get_current_user)):
    """Critères d'acceptation"""
    try:
        return get_acceptance_criteria()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )

@router.post("/analyze")
async def analyze_subject(
    analysis_request: schemas.AIAnalysisRequest,
    current_user: User = Depends(get_current_user),
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
            "context": analysis_request.context or ""
        }
        
        analysis = analyser_sujet(sujet_data)
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )

@router.post("/generate")
async def generate_subjects(
    generate_request: schemas.GenerateSubjectsRequest,
    current_user: User = Depends(get_current_user),
):
    """Générer des sujets"""
    if not generate_request.interests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Au moins un intérêt est requis"
        )
    
    try:
        params = {
            "interests": ", ".join(generate_request.interests),
            "domaine": generate_request.domaine or "Général",
            "niveau": generate_request.niveau or "L3",
            "faculté": generate_request.faculté or "Général"
        }
        
        generated = générer_sujets_llm(params, generate_request.count or 3)
        return generated
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )

@router.get("/tips")
async def get_tips_endpoint(current_user: User = Depends(get_current_user)):
    """Conseils pour la rédaction"""
    try:
        return get_tips()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )