# backend/app/llm_service.py

import os
import json
import re
import csv
from typing import List, Dict, Any, Optional

from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# ======================
# CONFIG GÉNÉRALE
# ======================

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemma-3-1b-it")

# Cache global des sujets du CSV
SUJETS_CSV_CACHE: List[Dict[str, Any]] = []
SUJETS_CSV_INITIALIZED: bool = False

# =============================
# CONFIGURATION LANGCHAIN
# =============================

llm = None
json_parser = None

try:
    from langchain_google_genai import (
        ChatGoogleGenerativeAI,
        GoogleGenerativeAIEmbeddings,
    )
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
    from langchain_core.exceptions import OutputParserException
    from langchain_community.vectorstores import Chroma
    from langchain_core.documents import Document

    if GOOGLE_API_KEY:
        llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GOOGLE_API_KEY,
            temperature=0.2,
            max_output_tokens=2048,
        )
        json_parser = JsonOutputParser()
        print("✅ LangChain avec Gemini configuré")
    else:
        print("⚠️ GOOGLE_API_KEY non configurée")
        llm = None
        json_parser = None

except ImportError as e:
    print(f"❌ LangChain non disponible: {e}")
    llm = None
    json_parser = None
    Chroma = None
    Document = None
    GoogleGenerativeAIEmbeddings = None

# ======================
# CHARGEMENT CSV SUJETS
# ======================

def load_sujets_csv(path: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Charge la base de sujets étudiants depuis le CSV pour servir de contexte à l'IA.
    """
    global SUJETS_CSV_CACHE, SUJETS_CSV_INITIALIZED

    if SUJETS_CSV_CACHE:
        SUJETS_CSV_INITIALIZED = True
        return SUJETS_CSV_CACHE

    if path is None:
        path = os.path.join(
            os.path.dirname(__file__),
            "..",
            "data",
            "Sujet_EtudiantsB.csv",
        )

    sujets: List[Dict[str, Any]] = []
    try:
        with open(path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f, delimiter=";")
            for row in reader:
                sujets.append(
                    {
                        "titre": row.get("titre") or row.get("Titre") or "",
                        "domaine": row.get("domaine") or row.get("Domaine") or "",
                        "faculté": row.get("faculte") or row.get("Faculté") or "",
                        "niveau": row.get("niveau") or row.get("Niveau") or "",
                        "problématique": row.get("problematique") or row.get("Problématique") or "",
                        "description": row.get("description") or row.get("Description") or "",
                        "keywords": row.get("keywords") or row.get("MotsCles") or "",
                        "statut": row.get("statut") or row.get("Statut") or "",
                    }
                )
        SUJETS_CSV_CACHE = sujets
        SUJETS_CSV_INITIALIZED = True
        print(f"✅ Chargé {len(sujets)} sujets depuis Sujet_EtudiantsB.csv")
    except Exception as e:
        print(f"⚠️ Impossible de charger Sujet_EtudiantsB.csv: {e}")
        SUJETS_CSV_CACHE = []
        SUJETS_CSV_INITIALIZED = False

    return SUJETS_CSV_CACHE

def get_llm_status() -> Dict[str, Any]:
    return {
        "llm_available": llm is not None,
        "sujets_csv_initialized": SUJETS_CSV_INITIALIZED,
        "sujets_csv_count": len(SUJETS_CSV_CACHE),
    }

# ======================
# VECTEUR STORE SUJETS CSV + CRITÈRES DOYEN
# ======================

SUJETS_VECTORSTORE = None  # objet Chroma

def get_acceptance_criteria() -> Dict[str, Any]:
    """
    Retourne les critères d'acceptation / rejet des sujets de mémoire,
    basés explicitement sur les directives du doyen.
    """
    return {
        "critères_acceptation": [
            "Capacité de l’étudiant à traiter le sujet en tenant compte de la disponibilité des données",
            "Complexité du sujet adaptée au niveau de l’étudiant",
            "Sujet réalisable dans les contraintes temporelles et financières",
            "Pertinence du sujet par rapport au domaine de spécialisation",
            "Caractère innovant ou apport original du travail proposé",
            "Le sujet dépasse un simple travail pratique de cours (approche recherche, analyse, réflexion)",
            "Problématique clairement formulée, précise et pertinente",
            "Approche méthodologique cohérente, solide et adaptée aux objectifs",
        ],
        "critères_rejet": [
            "Formulation grammaticale du sujet incorrecte ou peu compréhensible",
            "Sujet inadéquat avec le niveau d’un travail de fin d’études",
            "Sujet inadéquat avec la spécialité concernée",
            "Sujet déjà traité de manière plus pertinente ou plus approfondie sans valeur ajoutée claire",
        ],
        "conseils_pratiques": [
            "Vérifiez que le sujet est réalisable avec les données et les ressources dont vous disposez.",
            "Adaptez la complexité du sujet à votre niveau (Licence, Master, etc.).",
            "Expliquez en quoi votre travail est différent et plus riche qu’un simple projet de cours.",
            "Soignez particulièrement la formulation du titre et de la problématique (clarté, français correct).",
            "Clarifiez votre approche méthodologique : quelles étapes, quelles données, quelles méthodes ?",
        ],
        "message_doyen": (
            "En général, un mémoire est jugé acceptable lorsqu’il respecte plusieurs exigences, "
            "notamment: (1) la capacité de l’étudiant à traiter le sujet, en tenant compte de la "
            "disponibilité des données, de la complexité des concepts au regard du niveau de l’étudiant, "
            "ainsi que des contraintes temporelles et financières; (2) la pertinence du sujet par rapport "
            "au domaine de spécialisation; (3) le caractère innovant du travail proposé; (4) la distinction "
            "du sujet par rapport à un simple travail pratique de cours; (5) la clarté et la pertinence de la "
            "problématique à traiter; (6) la cohérence et la solidité des approches méthodologiques retenues. "
            "Les motifs fréquents de rejet concernent: (1) une mauvaise formulation grammaticale du sujet; "
            "(2) une inadéquation avec le niveau d’un travail de fin d’études ou avec la spécialité; (3) "
            "le fait que le sujet ait déjà été traité de manière plus pertinente ou approfondie."
        ),
    }

def build_sujets_vectorstore(persist_directory: Optional[str] = None):
    """
    Construit (ou recharge) un vecteur store (Chroma) à partir:
    - de la base CSV Sujet_EtudiantsB.csv
    - des critères du doyen

    Si persist_directory est fourni et existe déjà, on recharge au lieu de reconstruire.
    """
    global SUJETS_VECTORSTORE

    if SUJETS_VECTORSTORE is not None:
        return SUJETS_VECTORSTORE

    if not llm or not Chroma or not GoogleGenerativeAIEmbeddings or not Document:
        print("⚠️ LLM/embeddings non dispo, pas de vecteur store.")
        return None

    try:
        embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

        # 1) Si on a un dossier de persistance existant, on recharge
        if persist_directory and os.path.isdir(persist_directory) and os.listdir(persist_directory):
            try:
                SUJETS_VECTORSTORE = Chroma(
                    embedding_function=embeddings,
                    persist_directory=persist_directory,
                )
                print(f"✅ Vector store rechargé depuis {persist_directory}")
                return SUJETS_VECTORSTORE
            except Exception as e:
                print(f"⚠️ Impossible de recharger le vecteur store existant, reconstruction: {e}")

        # 2) Sinon, on reconstruit à partir du CSV + critères
        sujets = load_sujets_csv()
        docs: List[Document] = []

        for i, s in enumerate(sujets):
            content = (
                f"Titre: {s.get('titre','')}\n"
                f"Domaine: {s.get('domaine','')}\n"
                f"Niveau: {s.get('niveau','')}\n"
                f"Faculté: {s.get('faculté','')}\n"
                f"Problématique: {s.get('problématique','')}\n"
                f"Description: {s.get('description','')}\n"
                f"Mots-clés: {s.get('keywords','')}\n"
                f"Statut: {s.get('statut','')}\n"
            )
            docs.append(
                Document(
                    page_content=content,
                    metadata={
                        "source": "csv_sujet",
                        "index": i,
                        "titre": s.get("titre", ""),
                        "domaine": s.get("domaine", ""),
                        "niveau": s.get("niveau", ""),
                        "statut": s.get("statut", ""),
                    },
                )
            )

        # Ajouter un document avec les critères du doyen
        criteria = get_acceptance_criteria()
        criteres_txt = (
            "CRITÈRES D'ACCEPTATION:\n- "
            + "\n- ".join(criteria["critères_acceptation"])
            + "\n\nCRITÈRES DE REJET:\n- "
            + "\n- ".join(criteria["critères_rejet"])
            + "\n\nMESSAGE DU DOYEN:\n"
            + criteria.get("message_doyen", "")
        )

        docs.append(
            Document(
                page_content=criteres_txt,
                metadata={"source": "doyen_criteria"},
            )
        )

        embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

        if persist_directory:
            os.makedirs(persist_directory, exist_ok=True)
            SUJETS_VECTORSTORE = Chroma.from_documents(
                documents=docs,
                embedding=embeddings,
                persist_directory=persist_directory,
            )
        else:
            SUJETS_VECTORSTORE = Chroma.from_documents(
                documents=docs,
                embedding=embeddings,
            )

        print(f"✅ Vector store construit avec {len(docs)} documents")
        return SUJETS_VECTORSTORE

    except Exception as e:
        print(f"⚠️ Erreur lors de la construction du vecteur store: {e}")
        SUJETS_VECTORSTORE = None
        return None

def search_sujets_context(query: str, k: int = 5) -> List[Document]:
    """
    Recherche les documents les plus proches d'une requête.
    Utilisé pour fournir du contexte à l'IA (exemples réels, critères, etc.)
    """
    vs = build_sujets_vectorstore()
    if not vs:
        return []
    try:
        return vs.similarity_search(query, k=k)
    except Exception as e:
        print(f"⚠️ Erreur lors de la recherche dans le vecteur store: {e}")
        return []

# ======================
# ANALYSE DE SUJET
# ======================

def get_fallback_analysis(sujet_data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyse de secours sans IA"""
    return {
        "pertinence": 75,
        "points_forts": [
            f"Sujet dans le domaine: {sujet_data.get('domaine', 'Général')}",
            "Problématique identifiée dans les données",
            f"Niveau adapté: {sujet_data.get('niveau', 'L3')}",
        ],
        "points_faibles": [
            "Analyse automatique limitée sans IA",
            "Suggestions génériques",
            "Validation humaine requise",
        ],
        "suggestions": [
            "Consulter un enseignant référent pour validation",
            "Préciser la méthodologie de recherche",
            "Définir des objectifs spécifiques et mesurables",
        ],
        "recommandations": [
            "Sujet potentiellement intéressant à approfondir",
            "Valider la faisabilité avec un expert",
            "Étudier des travaux similaires pour inspiration",
        ],
    }

def analyser_sujet(sujet_data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyse un sujet avec LangChain, en tenant compte des critères du doyen et de la base CSV."""
    if not llm:
        return get_fallback_analysis(sujet_data)

    criteria = get_acceptance_criteria()

    # Recherche de contexte pertinent (sujets similaires + critères du doyen)
    query = (
        f"{sujet_data.get('titre','')} "
        f"{sujet_data.get('domaine','')} "
        f"{sujet_data.get('niveau','')} "
        f"{sujet_data.get('keywords','')}"
    )
    retrieved_docs = search_sujets_context(query, k=5)

    init_note = (
        "NOTE: La base réelle de sujets étudiants n'est pas encore entièrement initialisée, "
        "l'analyse repose donc surtout sur les critères du doyen et quelques exemples partiels.\n"
        if not SUJETS_CSV_INITIALIZED
        else ""
    )

    prompt_template = """
    Tu es un expert en évaluation de sujets de mémoire universitaire (MemoBot).
    Tu dois évaluer un sujet comme le ferait un doyen d'université.

    === NOTE D'ÉTAT ===
    {init_note}

    === DIRECTIVES DU DOYEN (CRITÈRES) ===
    Critères d'acceptation principaux:
    {criteres_acceptation}

    Critères de rejet fréquents:
    {criteres_rejet}

    Message du doyen:
    {message_doyen}

    === CONTEXTE RÉEL (BASE SUJETS + DOYEN) ===
    Voici quelques extraits pertinents issus de notre base interne (sujets réels + critères du doyen):
    {contexte_retrieved}

    === SUJET À ANALYSER ===
    TITRE: {titre}
    DOMAINE: {domaine}
    NIVEAU: {niveau}
    FACULTÉ: {faculté}
    PROBLÉMATIQUE: {problematique}
    DESCRIPTION: {description}
    MOTS-CLÉS: {keywords}

    === TÂCHE ===
    Analyse ce sujet de mémoire en respectant les critères du doyen et en te basant sur les exemples.
    Fais une analyse détaillée selon ces critères:
    1. Pertinence générale (0-100%)
    2. Points forts (3-5 points)
    3. Points faibles (2-3 points)
    4. Suggestions d'amélioration (3-5 suggestions)
    5. Recommandations finales (2-3 recommandations)

    Réponds en JSON avec cette structure EXACTE:
    {{
        "pertinence": 85,
        "points_forts": ["point1", "point2", "point3"],
        "points_faibles": ["point1", "point2"],
        "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
        "recommandations": ["recommandation1", "recommandation2"]
    }}
    """

    try:
        # Concaténation du contenu des documents récupérés
        contexte_retrieved = ""
        for d in retrieved_docs:
            contexte_retrieved += f"\n---\n{d.page_content}\n"

        prompt = ChatPromptTemplate.from_template(prompt_template)
        chain = prompt | llm | StrOutputParser()

        raw = chain.invoke(
            {
                "titre": sujet_data.get("titre", ""),
                "domaine": sujet_data.get("domaine", ""),
                "niveau": sujet_data.get("niveau", ""),
                "faculté": sujet_data.get("faculté", ""),
                "problematique": sujet_data.get("problématique", sujet_data.get("problematique", "")),
                "description": sujet_data.get("description", ""),
                "keywords": sujet_data.get("keywords", ""),
                "criteres_acceptation": "\n- " + "\n- ".join(criteria["critères_acceptation"]),
                "criteres_rejet": "\n- " + "\n- ".join(criteria["critères_rejet"]),
                "message_doyen": criteria.get("message_doyen", ""),
                "contexte_retrieved": contexte_retrieved or "Pas de contexte disponible.",
                "init_note": init_note,
            }
        )

        # Nettoyage de la sortie (enlever ```json, ``` etc.)
        cleaned = raw.strip()
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as e:
            print(f"⚠️ Erreur JSON brute dans analyser_sujet: {e}")
            print(cleaned)
            return get_fallback_analysis(sujet_data)

        if not isinstance(parsed, dict):
            return get_fallback_analysis(sujet_data)

        for key in ["pertinence", "points_forts", "points_faibles", "suggestions", "recommandations"]:
            if key not in parsed:
                return get_fallback_analysis(sujet_data)

        return parsed

    except Exception as e:
        print(f"⚠️ Erreur dans analyser_sujet: {e}")
        return get_fallback_analysis(sujet_data)

# ======================
# RECOMMANDATION DE SUJETS
# ======================

def fallback_recommendation(interests: List[str], sujets: List[Dict]) -> List[Dict[str, Any]]:
    """Recommandation de secours sans IA"""
    results = []

    if not sujets:
        return results

    for sujet in sujets[:5]:
        score = 0
        matching_points = []

        titre = sujet.get("titre", "").lower()
        keywords = sujet.get("keywords", "").lower()
        domaine = sujet.get("domaine", "").lower()

        for interest in interests:
            interest_lower = interest.lower()

            if interest_lower in titre:
                score += 30
                matching_points.append(f"Intérêt '{interest}' dans le titre")

            if interest_lower in keywords:
                score += 25
                matching_points.append(f"Intérêt '{interest}' dans les mots-clés")

            if interest_lower in domaine:
                score += 20
                matching_points.append(f"Intérêt '{interest}' dans le domaine")

        if score > 0:
            results.append(
                {
                    "id": sujet.get("id", 0),
                    "score": min(score, 100),
                    "raisons": matching_points[:3] if matching_points else ["Correspondance générale"],
                    "critères": [
                        "Matching automatique par mots-clés",
                        f"Niveau: {sujet.get('niveau', 'N/A')}",
                        f"Domaine: {sujet.get('domaine', 'N/A')}",
                    ],
                }
            )

    results.sort(key=lambda x: x["score"], reverse=True)
    return results

def recommander_sujets_llm(
    interests: List[str],
    sujets: List[Dict],
    critères: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """Recommande des sujets avec LangChain"""
    if not llm or not sujets:
        return fallback_recommendation(interests, sujets)

    sujets_text = ""
    for sujet in sujets[:10]:
        sujets_text += f"\n• ID: {sujet.get('id', 'N/A')}"
        sujets_text += f" | Titre: {sujet.get('titre', 'Sans titre')}"
        sujets_text += f" | Mots-clés: {sujet.get('keywords', '')}"
        sujets_text += f" | Niveau: {sujet.get('niveau', 'N/A')}"
        sujets_text += f" | Domaine: {sujet.get('domaine', 'Général')}"

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
    Pour les sujets les plus pertinents, fournis:
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

    Retourne seulement les 3-5 sujets les plus pertinents, triés par score décroissant.
    """

    try:
        prompt = ChatPromptTemplate.from_template(prompt_template)
        chain = prompt | llm | StrOutputParser()

        response = chain.invoke(
            {
                "interests": ", ".join(interests) if interests else "Non spécifié",
                "niveau": critères.get("niveau", "Non spécifié"),
                "faculté": critères.get("faculté", "Non spécifiée"),
                "domaine": critères.get("domaine", "Non spécifié"),
                "difficulté": critères.get("difficulté", "moyenne"),
                "sujets_text": sujets_text,
            }
        )

        try:
            json_match = re.search(r"\[.*\]", response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                result = json.loads(json_str)
                return result
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"⚠️ Erreur parsing JSON recommandation: {e}")

        return fallback_recommendation(interests, sujets)

    except Exception as e:
        print(f"⚠️ Erreur recommandation LangChain: {e}")
        return fallback_recommendation(interests, sujets)

# ======================
# RÉPONSE À UNE QUESTION
# ======================
def répondre_question(question: str, contexte: str = None) -> str:
    """Répond DIRECTEMENT aux questions - version SIMPLIFIÉE et DIRECTE"""
    if not llm:
        return f"D'accord, je comprends ta question : '{question}'. Pourrais-tu me dire plus précisément ce que tu recherches ?"
    
    # PROMPT ULTRA SIMPLE - PAS DE FORMALITÉS
    prompt = f"""
    Tu es MemoBot, assistant conversationnel pour aider les étudiants à trouver des sujets de mémoire.
    
    **TÂCHE :** Réponds DIRECTEMENT et NATURELLEMENT à la question de l'étudiant.
    **STYLE :** Comme si tu parlais à un ami - simple, direct, utile.
    **NE FAIS PAS :** Ne commence pas par "Bonjour, je suis MemoBot..."
    **NE FAIS PAS :** Ne liste pas des questions en retour automatiquement
    
    CONTEXTE (si utile) :
    {contexte or 'Pas de contexte'}
    
    QUESTION DE L'ÉTUDIANT :
    "{question}"
    
    TA RÉPONSE (directe, naturelle, utile) :
    """
    
    try:
        # Appel DIRECT sans LangChain complexe
        response = llm.invoke(prompt)
        
        # Extraire le texte
        if hasattr(response, 'content'):
            answer = response.content.strip()
        else:
            answer = str(response).strip()
        
        # NETTOYAGE : Enlever les salutations automatiques
        unwanted_starts = [
            "Bonjour ! Je suis MemoBot",
            "Je suis MemoBot",
            "En tant que MemoBot",
            "Bonjour,",
            "Salut,",
            "Hello,",
        ]
        
        for unwanted in unwanted_starts:
            if answer.startswith(unwanted):
                # Garder seulement après la salutation
                answer = answer[len(unwanted):].strip()
                # Supprimer la ponctuation qui suit
                if answer.startswith(','):
                    answer = answer[1:].strip()
                if answer.startswith('!'):
                    answer = answer[1:].strip()
        
        # Si la réponse est vide ou trop courte, réponse alternative
        if not answer or len(answer) < 10:
            return f"D'accord, je comprends que tu cherches : '{question}'. Qu'est-ce qui t'intéresse particulièrement dans ce domaine ?"
        
        return answer
        
    except Exception as e:
        print(f"⚠️ Erreur dans répondre_question: {e}")
        return f"Je vois que tu parles de '{question[:50]}...'. C'est intéressant ! Dis-m'en plus sur ce que tu recherches exactement."

def répondre_question_cohérente(question: str, contexte: str = None) -> str:
    """Version qui FORCE la cohérence avec l'historique"""
    if not llm:
        return f"Je comprends : '{question}'. Pourrais-tu préciser par rapport à notre discussion ?"
    
    # Analyse le contexte pour détecter le sujet en cours
    sujet_en_cours = None
    if contexte:
        contexte_lower = contexte.lower()
        if "génie civil" in contexte_lower or "civil" in question.lower():
            sujet_en_cours = "génie civil"
        elif "sécurité" in contexte_lower or "sécurité" in question.lower():
            sujet_en_cours = "sécurité"
        elif "bâtiment" in contexte_lower or "bâtiment" in question.lower():
            sujet_en_cours = "bâtiment"
    
    prompt = f"""
    Tu es MemoBot, assistant spécialisé dans les sujets de mémoire académiques.
    
    **CONTEXTE DE LA CONVERSATION:**
    {contexte or 'Début de conversation'}
    
    **SUJET EN COURS DÉTECTÉ:** {sujet_en_cours or 'Non spécifié'}
    
    **NOUVELLE QUESTION DE L'ÉTUDIANT:**
    "{question}"
    
    **RÈGLES IMPÉRATIVES:**
    1. Reste ABSOLUMENT COHÉRENT avec l'historique
    2. Si le sujet change brusquement, dit: "Pour rester sur [sujet précédent]..."
    3. Ne parle pas d'autres sujets que celui en cours
    4. Sois utile pour la recherche d'un sujet de mémoire
    5. Propose des pistes académiques concrètes
    
    **TA RÉPONSE (cohérente, académique, utile):**
    """
    
    try:
        response = llm.invoke(prompt)
        answer = response.content if hasattr(response, 'content') else str(response)
        
        # Vérification FORCÉE de cohérence
        if sujet_en_cours and sujet_en_cours not in answer.lower():
            # Réponse n'est pas cohérente, on force
            correction = f"""
            L'étudiant dit: "{question}"
            
            Mais nous parlions de: {sujet_en_cours}
            
            Réponds EN RESTANT sur le sujet {sujet_en_cours}.
            Commence par: "Pour rester sur le {sujet_en_cours}..."
            
            Réponse cohérente:
            """
            corrected = llm.invoke(correction)
            answer = corrected.content if hasattr(corrected, 'content') else str(corrected)
        
        return answer.strip()
        
    except Exception as e:
        print(f"⚠️ Erreur dans répondre_question_cohérente: {e}")
        if sujet_en_cours:
            return f"Pour rester sur le sujet du {sujet_en_cours}, {question[:50]}... Quel aspect précis veux-tu explorer ?"
        return f"Je comprends: '{question[:50]}...'. Quel lien fais-tu avec notre discussion précédente ?"

# ======================
# GÉNÉRATION DE SUJETS
# ======================

def generate_default_subjects(params: Dict[str, Any], count: int) -> List[Dict[str, Any]]:
    """Génère des sujets par défaut sans IA"""
    domaine = params.get("domaine", "Informatique")
    niveau = params.get("niveau", "Master")
    faculté = params.get("faculté", "Sciences")

    subjects = []
    for _ in range(count):
        subjects.append(
            {
                "titre": f"Application de l'IA dans le domaine du {domaine}",
                "problématique": (
                    f"Comment l'intelligence artificielle peut-elle transformer les pratiques et "
                    f"processus dans le {domaine} ?"
                ),
                "keywords": f"IA, {domaine}, transformation, innovation, technologie",
                "description": (
                    f"Étude des applications potentielles de l'intelligence artificielle dans le secteur du {domaine}, "
                    "avec une analyse des impacts et des défis à relever."
                ),
                "methodologie": "Revue de littérature, analyse comparative, étude de cas",
                "difficulté": "moyenne",
                "durée_estimée": "6 mois",
                "domaine": domaine,
                "niveau": niveau,
                "faculté": faculté,
                "original": True,
                "generated_at": datetime.utcnow().isoformat(),
            }
        )

    return subjects

def générer_sujets_llm(params: Dict[str, Any], count: int) -> List[Dict[str, Any]]:
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
        "problématique": "Problématique de recherche",
        "keywords": "mot1, mot2, mot3, mot4, mot5",
        "description": "Description du sujet",
        "methodologie": "Méthodologie suggérée",
        "difficulté": "moyenne",
        "durée_estimée": "6 mois"
      }}
    ]

    Génère exactement {count} sujets originaux, pertinents et réalisables.
    """

    try:
        prompt = ChatPromptTemplate.from_template(prompt_template)
        chain = prompt | llm | StrOutputParser()

        response = chain.invoke(
            {
                "interests": params.get("interests", "Recherche académique"),
                "domaine": params.get("domaine", "Général"),
                "niveau": params.get("niveau", "L3"),
                "faculté": params.get("faculté", "Sciences"),
                "count": count,
            }
        )

        try:
            json_match = re.search(r"\[.*\]", response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                sujets = json.loads(json_str)

                for sujet in sujets:
                    sujet["domaine"] = params.get("domaine", "Général")
                    sujet["niveau"] = params.get("niveau", "L3")
                    sujet["faculté"] = params.get("faculté", "Sciences")
                    sujet["original"] = True
                    sujet["generated_at"] = datetime.utcnow().isoformat()

                return sujets[:count]
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"⚠️ Erreur parsing JSON génération: {e}")

        return generate_default_subjects(params, count)

    except Exception as e:
        print(f"⚠️ Erreur génération LangChain: {e}")
        return generate_default_subjects(params, count)

# ======================
# CONSEILS GÉNÉRAUX
# ======================

def get_tips() -> Dict[str, List[str]]:
    """
    Retourne des conseils pour la rédaction de mémoire
    """
    return {
        "choix_sujet": [
            "Choisissez un sujet qui vous passionne vraiment",
            "Assurez-vous que le sujet soit ni trop large ni trop étroit",
            "Vérifiez la disponibilité des ressources",
            "Le sujet doit apporter une contribution originale",
            "Consultez votre directeur potentiel avant de finaliser",
        ],
        "methodologie": [
            "Définissez clairement votre problématique de recherche",
            "Choisissez une méthodologie adaptée à votre question",
            "Élaborez un plan de recherche détaillé",
            "Documentez rigoureusement toutes vos sources",
            "Testez votre méthodologie sur un échantillon réduit",
        ],
        "redaction": [
            "Structurez votre mémoire de manière logique",
            "Rédigez régulièrement (un peu chaque jour)",
            "Utilisez un style académique clair et précis",
            "Citez vos sources selon les normes",
            "Faites relire votre travail par d'autres",
        ],
        "soutenance": [
            "Préparez votre présentation bien à l'avance",
            "Structurez votre présentation clairement",
            "Entraînez-vous plusieurs fois à présenter",
            "Préparez un support visuel professionnel",
            "Anticipez les questions du jury",
        ],
    }

# ======================
# TEST LOCAL
# ======================

if __name__ == "__main__":
    print("🧪 Test de LangChain avec Gemini...")

    if llm:
        try:
            prompt = ChatPromptTemplate.from_template("Réponds simplement 'OK' si tu fonctionnes.")
            chain = prompt | llm | StrOutputParser()
            response = chain.invoke({})
            print(f"✅ LangChain fonctionne: {response}")
        except Exception as e:
            print(f"❌ Erreur test LangChain: {e}")
    else:
        print("⚠️ LangChain non configuré, mode fallback activé")

    print("\n✅ Module llm_service prêt")