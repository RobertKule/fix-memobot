# app/llm_service.py
import os
import json
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# ======================
# CONFIGURATION LANGCHAIN
# ======================
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
    from langchain_core.exceptions import OutputParserException
    
    # Initialiser LangChain avec Gemini
    llm = ChatGoogleGenerativeAI(
        model=os.getenv("GEMINI_MODEL", "gemma-3-1b-it"),
        google_api_key=GOOGLE_API_KEY,
        temperature=os.getenv("GEMINI_TEMPERATURE", 0.2),
        max_output_tokens=2048
    )
    
    # Parser JSON
    json_parser = JsonOutputParser()
    
    print("✅ LangChain avec Gemini configuré")
    
except ImportError as e:
    print(f"❌ LangChain non disponible: {e}")
    llm = None
    json_parser = None

# ======================
# FONCTIONS AVEC LANGCHAIN
# ======================

def analyser_sujet(sujet_data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyse un sujet avec LangChain"""
    
    if not llm:
        return get_fallback_analysis(sujet_data)
    
    prompt_template = """
    Tu es un expert en évaluation de sujets de mémoire universitaire.
    
    Analyse ce sujet de mémoire:
    
    **TITRE**: {titre}
    **DOMAINE**: {domaine}
    **NIVEAU**: {niveau}
    **FACULTÉ**: {faculté}
    **PROBLÉMATIQUE**: {problematique}
    **DESCRIPTION**: {description}
    **MOTS-CLÉS**: {keywords}
    
    Fais une analyse détaillée selon ces critères:
    1. Pertinence générale (0-100%)
    2. Points forts (3-5 points)
    3. Points faibles (2-3 points)
    4. Suggestions d'amélioration (3-5 suggestions)
    5. Recommandations finales (2-3 recommandations)
    
    Réponds en JSON avec cette structure exacte:
    {{
        "pertinence": 85,
        "points_forts": ["point1", "point2", "point3"],
        "points_faibles": ["point1", "point2"],
        "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
        "recommandations": ["recommandation1", "recommandation2"]
    }}
    """
    
    try:
        prompt = ChatPromptTemplate.from_template(prompt_template)
        chain = prompt | llm | json_parser
        
        result = chain.invoke({
            "titre": sujet_data.get('titre', ''),
            "domaine": sujet_data.get('domaine', ''),
            "niveau": sujet_data.get('niveau', ''),
            "faculté": sujet_data.get('faculté', ''),
            "problematique": sujet_data.get('problematique', ''),
            "description": sujet_data.get('description', ''),
            "keywords": sujet_data.get('keywords', '')
        })
        
        return result
        
    except (OutputParserException, Exception) as e:
        print(f"⚠️ Erreur analyse LangChain: {e}")
        return get_fallback_analysis(sujet_data)

def recommander_sujets_llm(
    interests: List[str], 
    sujets: List[Dict], 
    critères: Dict
) -> List[Dict]:
    """Recommande des sujets avec LangChain"""
    
    if not llm or not sujets:
        return fallback_recommendation(interests, sujets)
    
    # Formater les sujets
    sujets_text = ""
    for sujet in sujets[:15]:  # Limiter à 15 sujets pour le contexte
        sujets_text += f"\n• ID: {sujet['id']}"
        sujets_text += f" | Titre: {sujet['titre']}"
        sujets_text += f" | Mots-clés: {sujet['keywords']}"
        sujets_text += f" | Niveau: {sujet['niveau']}"
        sujets_text += f" | Domaine: {sujet['domaine']}"
    
    prompt_template = """
    Tu es un assistant spécialisé dans la recommandation de sujets de mémoire.
    
    **PROFIL ÉTUDIANT:**
    - Intérêts: {interests}
    - Niveau: {niveau}
    - Faculté: {faculté}
    - Domaine: {domaine}
    - Difficulté: {difficulté}
    
    **SUJETS DISPONIBLES:**
    {sujets_text}
    
    **TÂCHE:**
    Pour chaque sujet, évalue:
    1. Score de pertinence (0-100) basé sur les intérêts et critères
    2. 2-3 raisons principales de recommandation
    3. Critères d'acceptation respectés
    
    **FORMAT DE RÉPONSE (JSON):**
    [
      {{
        "id": 1,
        "score": 85,
        "raisons": ["Raison 1", "Raison 2"],
        "critères": ["Critère 1", "Critère 2"]
      }}
    ]
    
    Retourne seulement les 5 sujets les plus pertinents, triés par score décroissant.
    """
    
    try:
        prompt = ChatPromptTemplate.from_template(prompt_template)
        # Utiliser StrOutputParser puis parser le JSON manuellement
        chain = prompt | llm | StrOutputParser()
        
        response = chain.invoke({
            "interests": ", ".join(interests),
            "niveau": critères.get('niveau', 'Non spécifié'),
            "faculté": critères.get('faculté', 'Non spécifiée'),
            "domaine": critères.get('domaine', 'Non spécifié'),
            "difficulté": critères.get('difficulté', 'Moyenne'),
            "sujets_text": sujets_text
        })
        
        # Parser le JSON de la réponse
        try:
            # Chercher du JSON dans la réponse
            import re
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"⚠️ Erreur parsing JSON: {e}")
            return fallback_recommendation(interests, sujets)
            
    except Exception as e:
        print(f"⚠️ Erreur recommandation LangChain: {e}")
        return fallback_recommendation(interests, sujets)

def répondre_question(question: str, contexte: str = None) -> str:
    """Répond à une question avec LangChain"""
    
    if not llm:
        return "Le service IA est temporairement indisponible. Veuillez consulter votre enseignant."
    
    prompt_template = """
    Tu es un expert-conseil en sujets de mémoire universitaire.
    
    **QUESTION DE L'ÉTUDIANT:**
    {question}
    
    {contexte}
    
    **INSTRUCTIONS:**
    1. Donne une réponse claire, concise et utile
    2. Propose des conseils pratiques si pertinent
    3. Sois encourageant et professionnel
    4. Réponds en français
    
    **RÉPONSE:**
    """
    
    try:
        prompt = ChatPromptTemplate.from_template(prompt_template)
        chain = prompt | llm | StrOutputParser()
        
        contexte_text = f"**CONTEXTE SUPPLÉMENTAIRE:**\n{contexte}" if contexte else ""
        
        réponse = chain.invoke({
            "question": question,
            "contexte": contexte_text
        })
        
        return réponse
        
    except Exception as e:
        print(f"⚠️ Erreur réponse LangChain: {e}")
        return f"Je ne peux pas répondre pour le moment. Erreur: {str(e)[:100]}"

def générer_sujets_llm(
    params: Dict[str, Any],
    count: int = 3
) -> List[Dict[str, Any]]:
    """Génère des sujets avec LangChain"""
    
    if not llm:
        return generate_default_subjects(params, count)
    
    prompt_template = """
    Tu es un générateur de sujets de mémoire universitaires.
    
    **SPÉCIFICATIONS:**
    - Intérêts: {interests}
    - Domaine: {domaine}
    - Niveau: {niveau}
    - Faculté: {faculté}
    - Nombre de sujets: {count}
    
    **EXIGENCES POUR CHAQUE SUJET:**
    1. Un titre précis et accrocheur
    2. Une problématique claire et pertinente
    3. 5-7 mots-clés séparés par des virgules
    4. Une description concise (2-3 phrases)
    5. Une méthodologie suggérée
    6. Une difficulté (facile/moyenne/difficile)
    7. Une durée estimée (ex: 3-6 mois)
    
    **FORMAT DE RÉPONSE (JSON):**
    [
      {{
        "titre": "Titre du sujet",
        "problematique": "Problématique de recherche",
        "keywords": "mot1, mot2, mot3, mot4, mot5",
        "description": "Description du sujet",
        "methodologie": "Méthodologie suggérée",
        "difficulté": "moyenne",
        "durée_estimée": "6 mois"
      }}
    ]
    
    Génère exactement {count} sujets originaux et pertinents.
    """
    
    try:
        prompt = ChatPromptTemplate.from_template(prompt_template)
        chain = prompt | llm | StrOutputParser()
        
        response = chain.invoke({
            "interests": params.get('interests', 'Recherche académique'),
            "domaine": params.get('domaine', 'Général'),
            "niveau": params.get('niveau', 'L3'),
            "faculté": params.get('faculté', 'Sciences'),
            "count": count
        })
        
        # Parser le JSON
        try:
            import re
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                sujets = json.loads(json_str)
                return sujets[:count]
        except json.JSONDecodeError:
            pass
            
        return generate_default_subjects(params, count)
        
    except Exception as e:
        print(f"⚠️ Erreur génération LangChain: {e}")
        return generate_default_subjects(params, count)

def get_acceptance_criteria() -> Dict[str, Any]:
    """
    Retourne les critères d'acceptation des sujets de mémoire
    """
    return {
        "critères_acceptation": [
            "1. Pertinence avec le domaine d'étude de l'étudiant",
            "2. Problématique clairement définie et spécifique",
            "3. Originalité et valeur ajoutée par rapport à l'état de l'art",
            "4. Faisabilité technique (ressources disponibles)",
            "5. Faisabilité temporelle (6-12 mois maximum)",
            "6. Accès aux données et matériaux nécessaires",
            "7. Intérêt scientifique et/ou pratique démontré",
            "8. Adéquation avec le niveau académique (L3, Master, etc.)",
            "9. Objectifs de recherche SMART (Spécifiques, Mesurables, Atteignables, Réalistes, Temporels)",
            "10. Méthodologie appropriée et bien définie"
        ],
        "critères_rejet": [
            "1. Sujet trop large, vague ou mal défini",
            "2. Duplication d'un travail existant sans valeur ajoutée significative",
            "3. Ressources insuffisantes ou inaccessibles (données, équipement, budget)",
            "4. Problématique absente, floue ou mal formulée",
            "5. Aspects non-éthiques ou non conformes à la déontologie de la recherche",
            "6. Hors du domaine de compétence de l'étudiant ou de l'établissement",
            "7. Objectifs irréalistes, non mesurables ou trop ambitieux",
            "8. Manque d'encadrement disponible ou compétent dans le domaine",
            "9. Coût trop élevé sans source de financement identifiée",
            "10. Délai de réalisation incompatible avec le calendrier académique"
        ],
        "conseils_pratiques": [
            "1. Consultez votre directeur de mémoire potentiel dès les premières réflexions",
            "2. Effectuez une revue de littérature préliminaire pour identifier les lacunes",
            "3. Définissez une méthodologie réaliste et adaptée à votre question de recherche",
            "4. Établissez un calendrier détaillé avec des jalons intermédiaires",
            "5. Identifiez précisément les ressources nécessaires (données, logiciels, équipement)",
            "6. Assurez-vous d'avoir les compétences requises ou un plan pour les acquérir",
            "7. Prévoyez des alternatives (plan B) en cas de difficultés imprévues",
            "8. Documentez soigneusement votre processus de recherche dès le début",
            "9. Préparez une soutenance claire et professionnelle dès la phase de proposition",
            "10. Anticipez les questions du jury et préparez vos réponses"
        ]
    }

# ======================
# FONCTIONS DE SECOURS
# ======================

def get_fallback_analysis(sujet_data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyse de secours sans IA"""
    return {
        "pertinence": 75,
        "points_forts": [
            f"Sujet dans le domaine: {sujet_data.get('domaine', 'Général')}",
            "Problématique identifiée dans les données",
            f"Niveau adapté: {sujet_data.get('niveau', 'L3')}"
        ],
        "points_faibles": [
            "Analyse automatique limitée sans IA",
            "Suggestions génériques",
            "Validation humaine requise"
        ],
        "suggestions": [
            "Consulter un enseignant référent pour validation",
            "Préciser la méthodologie de recherche",
            "Définir des objectifs spécifiques et mesurables"
        ],
        "recommandations": [
            "Sujet potentiellement intéressant à approfondir",
            "Valider la faisabilité avec un expert",
            "Étudier des travaux similaires pour inspiration"
        ]
    }

def fallback_recommendation(interests: List[str], sujets: List[Dict]) -> List[Dict]:
    """Recommandation de secours sans IA"""
    results = []
    
    for sujet in sujets[:10]:
        score = 0
        matching_points = []
        
        # Vérifier les correspondances
        titre = sujet.get('titre', '').lower()
        keywords = sujet.get('keywords', '').lower()
        domaine = sujet.get('domaine', '').lower()
        
        for interest in interests:
            interest_lower = interest.lower()
            
            # Score pour correspondance dans le titre
            if interest_lower in titre:
                score += 30
                matching_points.append(f"Intérêt '{interest}' dans le titre")
            
            # Score pour correspondance dans les mots-clés
            if interest_lower in keywords:
                score += 25
                matching_points.append(f"Intérêt '{interest}' dans les mots-clés")
            
            # Score pour correspondance dans le domaine
            if interest_lower in domaine:
                score += 20
                matching_points.append(f"Intérêt '{interest}' dans le domaine")
        
        if score > 0:
            results.append({
                "id": sujet["id"],
                "score": min(score, 100),
                "raisons": matching_points[:3] if matching_points else ["Correspondance générale"],
                "critères": [
                    "Matching automatique par mots-clés",
                    f"Niveau: {sujet.get('niveau', 'N/A')}",
                    f"Domaine: {sujet.get('domaine', 'N/A')}"
                ]
            })
    
    # Trier par score
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:5]

def generate_default_subjects(params: Dict[str, Any], count: int) -> List[Dict[str, Any]]:
    """Génère des sujets par défaut"""
    domaine = params.get('domaine', 'Génie Civil')
    niveau = params.get('niveau', 'L3')
    faculté = params.get('faculté', 'Génie Civil')
    interests = params.get('interests', 'Recherche académique')
    
    subjects = []
    for i in range(1, count + 1):
        subjects.append({
            "titre": f"{domaine} - Sujet {i}: Application des technologies innovantes en {domaine}",
            "problematique": f"Comment les avancées technologiques contemporaines peuvent-elles être appliquées pour résoudre des problèmes spécifiques en {domaine} au niveau {niveau}?",
            "keywords": f"{domaine}, {niveau}, innovation, technologie, recherche appliquée, méthodologie, {faculté}",
            "description": f"Étude approfondie des applications possibles des technologies émergentes dans le domaine du {domaine}, avec une approche adaptée au niveau {niveau}. Ce sujet explore les interfaces entre la théorie et la pratique dans un contexte académique rigoureux.",
            "methodologie": "Revue systématique de littérature, analyse comparative, étude de cas pratiques, modélisation conceptuelle",
            "difficulté": "moyenne",
            "durée_estimée": "5-7 mois"
        })
    
    return subjects

# ======================
# TEST DE CONNEXION
# ======================

if __name__ == "__main__":
    print("🧪 Test de LangChain avec Gemini...")
    
    if llm:
        try:
            # Test simple
            prompt = ChatPromptTemplate.from_template("Réponds simplement 'OK' si tu fonctionnes.")
            chain = prompt | llm | StrOutputParser()
            response = chain.invoke({})
            print(f"✅ LangChain fonctionne: {response}")
            
            # Test des critères
            print(f"\n📋 Critères disponibles:")
            criteria = get_acceptance_criteria()
            print(f"  - {len(criteria['critères_acceptation'])} critères d'acceptation")
            print(f"  - {len(criteria['critères_rejet'])} critères de rejet")
            print(f"  - {len(criteria['conseils_pratiques'])} conseils pratiques")
            
        except Exception as e:
            print(f"❌ Erreur test LangChain: {e}")
    else:
        print("⚠️ LangChain non configuré")
    
    print("\n✅ Module llm_service prêt")