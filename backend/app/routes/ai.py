# app/routes/ai.py 
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
from app.dependencies import get_current_user, get_db,get_current_active_user
from app import schemas, crud
from app.llm_service import repondre_comme_expert, analyser_conversation_expert
from app.recommendation import recommendation_engine

from app.models import User,ConversationMessage
router = APIRouter(tags=["ai"])

# Importer dynamiquement le service LLM
try:
    from app.llm_service import (
        get_acceptance_criteria, 
        analyser_sujet,
        générer_sujets_llm,
        get_tips,
        recommander_sujets_llm,
        repondre_comme_expert
    )
    LLM_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Erreur import llm_service: {e}")
    LLM_AVAILABLE = False
    
    # Fonctions de secours (version améliorée)
    def repondre_comme_expert(question: str, contexte: str = None) -> str:
        return """Je suis MemoBot, votre assistant pour les sujets de mémoire. Pour mieux vous aider :
        
1. **Décrivez votre domaine d'étude et vos intérêts**
2. **Précisez votre niveau académique (L3, M1, M2, Doctorat)**
3. **Mentionnez les technologies/méthodes qui vous intéressent**
4. **Indiquez si vous avez déjà des idées précises**

Je pourrai alors vous proposer des sujets pertinents et vous guider dans votre recherche !"""

    def recommander_sujets_llm(interests: List[str], sujets: List[Dict], critères: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Version améliorée de secours"""
        results = []
        for i, sujet in enumerate(sujets[:3]):  # 3 sujets maximum
            results.append({
                "id": sujet.get("id", i+1),
                "score": 75 + (i * 5),
                "raisons": [
                    f"Correspond à vos intérêts en {', '.join(interests[:2])}",
                    f"Niveau adapté: {critères.get('niveau', 'Master')}",
                    f"Domaine pertinent: {sujet.get('domaine', 'Général')}"
                ],
                "critères": [
                    "Matching avec vos intérêts",
                    "Niveau académique approprié",
                    "Problématique bien définie"
                ],
                "titre": sujet.get("titre", f"Sujet {i+1} sur {critères.get('domaine', 'votre domaine')}"),
                "description": sujet.get("description", "Description générée automatiquement")
            })
        return results

    def analyser_sujet(sujet_data: dict) -> dict:
        return {
            "pertinence": 75,
            "points_forts": ["Sujet bien structuré", "Problématique claire", "Domaine porteur"],
            "points_faibles": ["Méthodologie à préciser", "Ressources à vérifier"],
            "suggestions": [
                "Approfondir la revue de littérature",
                "Définir un protocole expérimental précis",
                "Établir un calendrier détaillé"
            ],
            "recommandations": ["Sujet prometteur à développer", "Consulter un expert du domaine"]
        }

    def générer_sujets_llm(params: dict, count: int) -> List[Dict]:
        """Génère des sujets avec contexte intelligent"""
        domaine = params.get('domaine', 'Informatique')
        niveau = params.get('niveau', 'Master')
        interests = params.get('interests', 'Recherche académique')
        
        sujets = []
        templates = [
            {
                "template": "L'impact de {tech} sur {domaine} : analyse et perspectives",
                "keywords": ["impact", "analyse", "perspectives", "transformation"]
            },
            {
                "template": "Développement d'un système de {application} utilisant {method}",
                "keywords": ["développement", "système", "application", "méthodologie"]
            },
            {
                "template": "Étude comparative des approches de {probleme} en {domaine}",
                "keywords": ["étude comparative", "approches", "performance", "évaluation"]
            }
        ]
        
        for i in range(min(count, 3)):
            template = templates[i % len(templates)]
            titre = template["template"].format(
                tech="l'IA" if "IA" in interests else "les nouvelles technologies",
                domaine=domaine,
                application="recommandation" if i == 0 else "analyse",
                method="le machine learning" if "machine" in interests.lower() else "des algorithmes avancés",
                probleme="classification" if i == 1 else "optimisation"
            )
            
            sujets.append({
                "titre": titre,
                "problematique": f"Comment {titre.lower()} peut-il apporter une valeur ajoutée dans le domaine du {domaine} ?",
                "keywords": f"{domaine}, {', '.join(template['keywords'])}, {', '.join(interests.split(',')[:2]) if isinstance(interests, str) else ', '.join(interests[:2])}",
                "description": f"Ce sujet explore les différentes facettes de {titre.lower()} avec une approche méthodologique rigoureuse adaptée au niveau {niveau}.",
                "methodologie": "Revue de littérature, conception, implémentation, tests et évaluation",
                "difficulté": "moyenne",
                "durée_estimée": "6 mois",
                "original": True  # Marquer comme sujet généré par IA
            })
        
        return sujets

    def get_acceptance_criteria() -> dict:
        return {
            "critères_acceptation": [
                "Pertinence académique avec le cursus",
                "Problématique claire et spécifique",
                "Originalité et contribution au domaine",
                "Faisabilité technique et temporelle",
                "Méthodologie appropriée et bien définie",
                "Accès aux ressources nécessaires",
                "Encadrement disponible et compétent",
                "Alignement avec les intérêts de recherche actuels"
            ],
            "critères_rejet": [
                "Sujet trop vague ou trop large",
                "Duplication sans valeur ajoutée",
                "Ressources insuffisantes ou inaccessibles",
                "Problématique mal formulée ou absente",
                "Délai incompatible avec le calendrier académique",
                "Manque d'encadrement disponible",
                "Hors du domaine de compétence de l'étudiant"
            ]
        }

    def get_tips() -> dict:
        return {
            "choix_sujet": [
                "Choisissez un sujet qui vous passionne vraiment",
                "Assurez-vous de l'existence de ressources bibliographiques",
                "Consultez votre directeur potentiel avant de finaliser",
                "Vérifiez la faisabilité technique et temporelle"
            ],
            "methodologie": [
                "Définissez clairement votre problématique",
                "Choisissez une méthodologie adaptée",
                "Établissez un plan de recherche détaillé",
                "Prévoyez des alternatives en cas de difficultés"
            ],
            "redaction": [
                "Commencez par la revue de littérature",
                "Rédigez régulièrement (un peu chaque jour)",
                "Structurez votre mémoire de manière logique",
                "Faites relire votre travail par des pairs"
            ]
        }


        
@router.post("/generate-three", response_model=schemas.AIGeneratedSubjects)
async def generate_three_subjects(
    request: schemas.GenerateSubjectsRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Génère exactement 3 sujets avec IA et les sauvegarde temporairement"""
    try:
        # Récupérer les préférences
        preference = crud.get_or_create_preference(db, current_user.id)
        
        # Préparer les paramètres
        params = {
            "interests": request.interests if isinstance(request.interests, list) 
                       else [request.interests] if isinstance(request.interests, str)
                       else [],
            "domaine": request.domaine or (preference.faculty if preference else "Général"),
            "niveau": request.niveau or (preference.level if preference else "M2"),
            "faculté": request.faculté or (preference.faculty if preference else "Sciences")
        }
        
        # Vérifier qu'on a des intérêts
        if not params["interests"] and preference and preference.interests:
            params["interests"] = [preference.interests]
        
        if not params["interests"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Veuillez spécifier vos intérêts pour générer des sujets pertinents"
            )
        
        # Générer 3 sujets avec IA
        generated_subjects = générer_sujets_llm(params, 3)
        
        # Créer un identifiant de session pour cette génération
        import uuid
        session_id = str(uuid.uuid4())
        
        # Formater les sujets pour correspondre au schéma
        formatted_subjects = []
        for i, subject in enumerate(generated_subjects):
            formatted_subject = {
                "session_id": session_id,
                "index": i,
                "titre": subject.get("titre", f"Sujet {i+1}"),
                "description": subject.get("description", ""),
                "problématique": subject.get("problématique", subject.get("problematique", "")),  # Gérer les deux formats
                "keywords": subject.get("keywords", ""),
                "domaine": subject.get("domaine", params["domaine"]),
                "niveau": subject.get("niveau", params["niveau"]),
                "faculté": subject.get("faculté", params["faculté"]),
                "difficulté": subject.get("difficulté", "moyenne"),
                "durée_estimée": subject.get("durée_estimée", "6 mois"),
                "methodologie": subject.get("methodologie", subject.get("méthodologie", "")),
                "generated_at": subject.get("generated_at", datetime.utcnow().isoformat()),
                "original": subject.get("original", True)
            }
            formatted_subjects.append(formatted_subject)
        
        return {
            "session_id": session_id,
            "subjects": formatted_subjects,
            "count": len(formatted_subjects),
            "message": f"3 sujets générés basés sur vos intérêts: {', '.join(params['interests'][:3])}"
        }
        
    except Exception as e:
        print(f"Erreur dans generate_three_subjects: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération: {str(e)}"
        )

# Route pour sauvegarder un sujet choisi
@router.post("/save-chosen-subject", response_model=schemas.Sujet)
async def save_chosen_subject(
    request: schemas.SaveChosenSubjectRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sauvegarde un sujet choisi par l'utilisateur dans ses sujets"""
    try:
        print(f"📥 Données reçues: {request}")
        
        # Vérifier et normaliser la difficulté
        difficulty_lower = request.difficulté.lower()
        if difficulty_lower not in ['facile', 'moyenne', 'difficile']:
            difficulty_lower = 'moyenne'
        
        # Créer le sujet dans la base de données
        sujet_data = schemas.SujetCreate(
            titre=request.titre,
            description=request.description,
            keywords=request.keywords,
            domaine=request.domaine,
            niveau=request.niveau,
            faculté=request.faculté,
            problématique=request.problématique,
            méthodologie=request.méthodologie,
            difficulté=difficulty_lower,
            durée_estimée=request.durée_estimée
        )
        
        print(f"📝 Création sujet: {sujet_data}")
        
        # Créer le sujet
        sujet = crud.create_sujet(db, sujet_data, user_id=current_user.id)
        
        # Créer un historique
        history_data = schemas.UserHistoryCreate(
            user_id=current_user.id,
            action="chose_ai_subject",
            details=f"A choisi le sujet généré par IA: {sujet.titre}",
            sujet_id=sujet.id
        )
        crud.create_user_history(db, history_data)
        
        # Mettre à jour les préférences
        if request.interests:
            preference = crud.get_or_create_preference(db, current_user.id)
            current_interests = []
            if preference and preference.interests:
                current_interests = [i.strip() for i in preference.interests.split(',')]
            
            new_interests = list(set(current_interests + request.interests))
            update_data = {"interests": ', '.join(new_interests)}
            crud.update_preference(db, current_user.id, update_data)
        
        print(f"✅ Sujet créé: {sujet.id} - {sujet.titre}")
        return sujet
        
    except Exception as e:
        print(f"❌ Erreur dans save_chosen_subject: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la sauvegarde: {str(e)}"
        )


@router.post("/chat", response_model=schemas.AIChatResponse)
async def chat_with_ai(
    request: schemas.AIChatRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat intelligent avec contexte utilisateur"""
    try:
        # Récupérer les préférences utilisateur
        preference = crud.get_or_create_preference(db, current_user.id)
        user_preferences = {}
        if preference:
            user_preferences = {
                'level': preference.level,
                'faculty': preference.faculty,
                'interests': preference.interests
            }
        
        # Récupérer l'historique complet
        conversation_history = crud.get_conversation_history(db, current_user.id, limit=10)
        
        # Construire le contexte de conversation
        history_context = "\n".join([
            f"{'ÉTUDIANT' if h.role == 'user' else 'MEMOBOT'}: {h.content}"
            for h in conversation_history[-5:]  # 5 derniers messages
        ])
        
        # Analyser la conversation
        messages_list = [
            {"role": msg.role, "content": msg.content}
            for msg in conversation_history
        ]
        analyse = analyser_conversation_expert(messages_list)
        
        # Obtenir la réponse avec les bons paramètres
        message = repondre_comme_expert(
            question=request.message,
            historique=history_context,
            analyse=analyse
        )
        
        # Sauvegarder la conversation
        crud.save_conversation_message(
            db,
            user_id=current_user.id,
            role="user",
            content=request.message
        )
        
        crud.save_conversation_message(
            db,
            user_id=current_user.id,
            role="assistant",
            content=message
        )
        
        # Analyser si on a assez d'infos pour proposer la génération
        should_show_generate = False
        if analyse.get("peut_proposer_sujets"):
            should_show_generate = True
        
        suggestions = []
        if should_show_generate:
            suggestions = [
                "J'ai assez d'informations sur votre projet",
                "Je peux maintenant générer des sujets pertinents",
                "Voulez-vous que je génère 3 sujets ?"
            ]
        
        return {
            "message": message,
            "suggestions": suggestions,
            "actions": [
                {"text": "🎯 Générer 3 sujets", "action": "generate_three"}
            ] if should_show_generate else [],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"Erreur dans chat_with_ai: {e}")
        return {
            "message": "Je rencontre une difficulté technique. Pourriez-vous reformuler votre question ?",
            "suggestions": ["Réessayez en étant plus spécifique"],
            "actions": [],
            "timestamp": datetime.utcnow().isoformat()
        }
    
# la route pour communiquer avec notre AI
# backend/app/routes/ai.py

@router.post("/ask", response_model=schemas.AIResponse)
async def ask_question(
    request: schemas.AIRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Répond comme un expert humain, avec mémoire de la conversation"""
    try:
        # Récupérer l'historique
        conversation_history = crud.get_conversation_history(db, current_user.id, limit=20)
        
        # Préparer l'historique pour le contexte
        historique_texte = ""
        for msg in conversation_history[-8:]:  # 8 derniers messages
            role = "Étudiant" if msg.role == 'user' else "Professeur"
            historique_texte += f"{role}: {msg.content}\n"
        
        # Analyser la conversation comme le ferait un expert
        messages_list = [
            {"role": msg.role, "content": msg.content}
            for msg in conversation_history
        ]
        analyse = analyser_conversation_expert(messages_list)
        
        # Obtenir la réponse naturelle
        reponse = repondre_comme_expert(
            question=request.question,
            historique=historique_texte,
            analyse=analyse
        )
        
        # Sauvegarder les messages
        crud.save_conversation_message(
            db,
            user_id=current_user.id,
            role="user",
            content=request.question
        )
        
        crud.save_conversation_message(
            db,
            user_id=current_user.id,
            role="assistant",
            content=reponse
        )
        
        # Suggestions naturelles
        suggestions = []
        if analyse.get("questions_a_poser"):
            suggestions.append(analyse["questions_a_poser"][0])
        
        return schemas.AIResponse(
            question=request.question,
            message=reponse,
            suggestions=suggestions,
            peut_generer=analyse.get("peut_proposer_sujets", False)
        )
        
    except Exception as e:
        print(f"Erreur: {e}")
        return schemas.AIResponse(
            question=request.question,
            message="Je vous écoute. Parlez-moi de votre projet.",
            suggestions=[],
            peut_generer=False
        )
    
def répondre_question_sans_llm(question: str, analysis: Dict) -> str:
    """Fallback quand LLM non disponible"""
    if len(question) < 20:
        return "Pourriez-vous préciser votre demande ?"
    
    if analysis["a_assez_info"]:
        return "J'ai assez d'informations sur votre projet. Voulez-vous que je génère des sujets de mémoire ?"
    
    if analysis["manques"]:
        return f"Pour mieux vous aider, pourriez-vous me parler de votre {analysis['manques'][0]} ?"
    
    return "Parlez-moi de votre projet de mémoire."
      
@router.post("/recommend", response_model=List[schemas.RecommendedSujet])
async def recommend_with_ai(
    request: schemas.RecommendationRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recommandation améliorée avec suggestion de 3 sujets maximum"""
    try:
        # Limiter à 3 recommandations maximum
        request.limit = min(request.limit, 3)
        
        # Utiliser le moteur traditionnel (garder la logique existante)
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
        
@router.post("/analyze", response_model=schemas.AIAnalysisResponse)
async def analyze_subject(
    request: schemas.AnalyzeSubjectRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyse un sujet avec l'IA"""
    try:
        # Préparer les données pour l'analyse
        sujet_data = {
            "titre": request.titre,
            "description": request.description,
            "domaine": request.domaine or "Général",
            "niveau": request.niveau or "M2",
            "faculté": request.faculté or "Sciences",
            "problématique": request.problématique or "",
            "keywords": request.keywords or ""
        }
        
        # Utiliser la fonction d'analyse existante
        analysis = analyser_sujet(sujet_data)
        
        # Sauvegarder l'analyse dans l'historique
        history_data = schemas.UserHistoryCreate(
            user_id=current_user.id,
            action="ai_analysis",
            details=f"Analysé le sujet: {request.titre[:50]}...",
            metadata={
                "titre": request.titre,
                "pertinence": analysis.get("pertinence", 75),
                "points_forts": analysis.get("points_forts", []),
                "points_faibles": analysis.get("points_faibles", [])
            }
        )
        crud.create_user_history(db, history_data)
        
        # Formater la réponse selon le schéma
        return {
            "pertinence": analysis.get("pertinence", 75),
            "points_forts": analysis.get("points_forts", []),
            "points_faibles": analysis.get("points_faibles", []),
            "suggestions": analysis.get("suggestions", []),
            "recommandations": analysis.get("recommandations", [])
        }
        
    except Exception as e:
        print(f"Erreur dans analyze_subject: {e}")
        # Retourner une analyse par défaut en cas d'erreur
        return {
            "pertinence": 75,
            "points_forts": [
                "Sujet bien structuré",
                "Problématique intéressante",
                "Domaine porteur"
            ],
            "points_faibles": [
                "Méthodologie à préciser",
                "Ressources bibliographiques à vérifier"
            ],
            "suggestions": [
                "Approfondir la revue de littérature",
                "Définir un protocole expérimental précis",
                "Établir un calendrier de recherche"
            ],
            "recommandations": [
                "Consulter un expert du domaine",
                "Valider la faisabilité technique",
                "Planifier les ressources nécessaires"
            ]
        }

@router.post("/generate-from-conversation", response_model=schemas.AIGeneratedSubjects)
async def generate_subjects_from_conversation(
    current_user = Depends(get_current_user),  
    db: Session = Depends(get_db)
):
    """Génère 3 sujets basés sur l'historique de conversation"""
    try:
        # Récupérer toute la conversation
        conversation_history = crud.get_conversation_history(db, current_user.id, limit=50)
        
        # Extraire le texte de l'utilisateur
        user_messages = " ".join([
            h.content for h in conversation_history 
            if h.role == 'user'
        ])
        
        if not user_messages or len(user_messages) < 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pas assez d'informations dans la conversation. Parlez-moi davantage de votre projet."
            )
        
        # Récupérer les préférences
        preference = crud.get_or_create_preference(db, current_user.id)
        
        # Préparer les paramètres de génération
        params = {
            "interests": [user_messages],  # Utiliser toute la conversation comme intérêt
            "domaine": preference.faculty if preference and preference.faculty else "Général",
            "niveau": preference.level if preference and preference.level else "Master",
            "faculté": preference.faculty if preference and preference.faculty else "Sciences"
        }
        
        # Générer 3 sujets
        generated_subjects = générer_sujets_llm(params, 3)
        
        # Créer un identifiant de session
        import uuid
        session_id = str(uuid.uuid4())
        
        # Formater les sujets
        formatted_subjects = []
        for i, subject in enumerate(generated_subjects):
            formatted_subject = {
                "session_id": session_id,
                "index": i,
                "titre": subject.get("titre", f"Sujet {i+1}"),
                "description": subject.get("description", ""),
                "problématique": subject.get("problématique", subject.get("problematique", "")),
                "keywords": subject.get("keywords", ""),
                "domaine": subject.get("domaine", params["domaine"]),
                "niveau": subject.get("niveau", params["niveau"]),
                "faculté": subject.get("faculté", params["faculté"]),
                "difficulté": subject.get("difficulté", "moyenne"),
                "durée_estimée": subject.get("durée_estimée", "6 mois"),
                "methodologie": subject.get("methodologie", subject.get("méthodologie", "")),
                "generated_at": subject.get("generated_at", datetime.utcnow().isoformat()),
                "original": subject.get("original", True)
            }
            formatted_subjects.append(formatted_subject)
        
        # Sauvegarder cette génération dans l'historique
        history_data = schemas.UserHistoryCreate(
            user_id=current_user.id,
            action="generated_from_conversation",
            details=f"Généré 3 sujets basés sur une conversation de {len(conversation_history)} messages",
            metadata={
                "session_id": session_id,
                "subject_count": len(formatted_subjects)
            }
        )
        crud.create_user_history(db, history_data)
        
        return {
            "session_id": session_id,
            "subjects": formatted_subjects,
            "count": len(formatted_subjects),
            "message": f"3 sujets générés basés sur notre conversation ({len(conversation_history)} échanges)"
        }
        
    except Exception as e:
        print(f"Erreur dans generate_from_conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération: {str(e)}"
        )
        
# Route publique pour le chat sans authentification
@router.post("/ask-public", response_model=schemas.AIResponse)
async def ask_question_public(
    request: schemas.AIRequest,
    db: Session = Depends(get_db)
):
    """Route publique pour le chat - accessible sans authentification"""
    try:
        # Construire un contexte simple
        context = "Utilisateur non connecté"
        
        # Obtenir la réponse avec les bons paramètres
        message = repondre_comme_expert(
            question=request.question,
            historique="",
            analyse=None
        )
        
        # Suggestions génériques
        suggestions = [
            "Créez un compte gratuit pour sauvegarder vos conversations",
            "Accédez à notre base de sujets en vous inscrivant"
        ]
        
        return schemas.AIResponse(
            question=request.question,
            message=message,
            suggestions=suggestions
        )
        
    except Exception as e:
        print(f"Erreur dans ask_question_public: {e}")
        return schemas.AIResponse(
            question=request.question,
            message="Je suis désolé, je rencontre des difficultés techniques.",
            suggestions=["Réessayez votre question"]
        )
    
# Vous pouvez aussi créer une route d'analyse publique
@router.post("/analyze-public", response_model=schemas.AIAnalysisResponse)
async def analyze_subject_public(
    request: schemas.AnalyzeSubjectRequest
):
    """Analyse un sujet avec l'IA - accessible sans authentification"""
    try:
        # Préparer les données pour l'analyse
        sujet_data = {
            "titre": request.titre,
            "description": request.description,
            "domaine": request.domaine or "Général",
            "niveau": request.niveau or "M2",
            "faculté": request.faculté or "Sciences",
            "problématique": request.problématique or "",
            "keywords": request.keywords or ""
        }
        
        # Utiliser la fonction d'analyse existante
        analysis = analyser_sujet(sujet_data)
        
        return {
            "pertinence": analysis.get("pertinence", 75),
            "points_forts": analysis.get("points_forts", []),
            "points_faibles": analysis.get("points_faibles", []),
            "suggestions": analysis.get("suggestions", []),
            "recommandations": analysis.get("recommandations", [])
        }
        
    except Exception as e:
        print(f"Erreur dans analyze_subject_public: {e}")
        return {
            "pertinence": 75,
            "points_forts": [
                "Sujet bien structuré",
                "Problématique intéressante",
                "Domaine porteur"
            ],
            "points_faibles": [
                "Méthodologie à préciser",
                "Ressources bibliographiques à vérifier"
            ],
            "suggestions": [
                "Approfondir la revue de littérature",
                "Définir un protocole expérimental précis",
                "Établir un calendrier de recherche"
            ],
            "recommandations": [
                "Créez un compte pour des analyses plus approfondies",
                "Consultez un expert du domaine",
                "Valider la faisabilité technique"
            ]
        }


# ========== CONVERSATION MANAGEMENT ==========
def clear_conversation_history(db: Session, user_id: int) -> int:
    """Supprime l'historique de conversation d'un utilisateur"""
    deleted_count = db.query(ConversationMessage).filter(
        ConversationMessage.user_id == user_id
    ).delete()
    
    db.commit()
    return deleted_count

def get_conversation_history(db: Session, user_id: int, limit: int = 10) -> List[ConversationMessage]:
    """Récupère l'historique de conversation d'un utilisateur"""
    return db.query(ConversationMessage).filter(
        ConversationMessage.user_id == user_id
    ).order_by(ConversationMessage.timestamp.desc()).limit(limit).all()

def save_conversation_message(db: Session, user_id: int, role: str, content: str) -> ConversationMessage:
    """Sauvegarde un message de conversation"""
    db_message = ConversationMessage(
        user_id=user_id,
        role=role,
        content=content,
        timestamp=datetime.utcnow()
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@router.post("/reset-conversation", response_model=schemas.ResetConversationResponse)
async def reset_conversation(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Réinitialise complètement la conversation pour un utilisateur"""
    try:
        # Supprimer l'historique de conversation
        deleted_count = crud.clear_conversation_history(db, current_user.id)
        
        # Ajouter un log d'historique
        history_data = schemas.UserHistoryCreate(
            user_id=current_user.id,
            action="reset_conversation",
            details=f"A réinitialisé la conversation avec MemoBot ({deleted_count} messages supprimés)",
            metadata={
                "timestamp": datetime.utcnow().isoformat(),
                "deleted_messages": deleted_count
            }
        )
        crud.create_user_history(db, history_data)
        
        return {
            "success": True,
            "message": f"Conversation réinitialisée avec succès. {deleted_count} messages supprimés.",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        print(f"Erreur dans reset_conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la réinitialisation: {str(e)}"
        )