# backend/app/llm_service.py

import os
import json
import re
import csv
from typing import List, Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# ======================
# CONFIG GÉNÉRALE
# ======================

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

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
   
    from langchain_core.documents import Document

    if GOOGLE_API_KEY:
        llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GOOGLE_API_KEY,
            temperature=0.7,
            max_output_tokens=2048,
        )
        json_parser = JsonOutputParser()
        print("✅ LangChain avec Gemini configuré")
    else:
        print("⚠️ GOOGLE_API_KEY non configurée")
        llm = None
        json_parser = None

except ImportError as e:
    print(f"⚠️ LangChain non disponible: {e}")
    llm = None
    json_parser = None
    Chroma = None
    Document = None
    GoogleGenerativeAIEmbeddings = None


try:
    from langchain_chroma import Chroma
    print("✅ Utilisation de langchain_chroma")
except ImportError:
    from langchain_community.vectorstores import Chroma
    print("⚠️ Utilisation de langchain_community (déprécié)")


# ======================
# CHARGEMENT CSV SUJETS
# ======================

def load_sujets_csv(path: Optional[str] = None) -> List[Dict[str, Any]]:
    """Charge la base de sujets étudiants depuis le CSV"""
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

# ======================
# ANALYSE DE CONVERSATION - STYLE EXPERT
# ======================

def analyser_conversation_expert(messages: List[Dict]) -> Dict[str, Any]:
    """
    Analyse la conversation comme le ferait un expert humain.
    """
    if not messages:
        return {
            "compris": False,
            "contexte": "Début de conversation",
            "elements_identifies": {},
            "questions_a_poser": [
                "Pour commencer, pourriez-vous me parler de votre parcours ?",
                "Dans quel département êtes-vous ? (Génie informatique, civil, électrique, électronique ou mécanique ?)",
                "Quel est votre niveau d'études actuel ?"
            ],
            "peut_proposer_sujets": False
        }
    
    # Extraire tous les messages utilisateur
    user_messages = [m for m in messages if m.get("role") == "user" or m.get("sender") == "user"]
    user_text = " ".join([m.get("content", m.get("text", "")).lower() for m in user_messages])
    
    # Éléments à identifier naturellement
    elements = {
        "departement": None,
        "niveau": None,
        "technologies": [],
        "centres_interet": [],
        "type_projet": None,
        "contraintes": []
    }
    
    # Départements de la faculté
    dept_keywords = {
        "Génie Informatique": ["info", "informatique", "logiciel", "programmation", "code", "développement", "dev", "web", "mobile", "ia", "intelligence artificielle", "base de données", "réseau"],
        "Génie Civil": ["civil", "construction", "bâtiment", "structure", "béton", "chantier", "génie civil", "pont", "route", "hydraulique"],
        "Génie Électrique": ["électrique", "electrique", "circuit", "électricité", "electricite", "moteur électrique", "réseau électrique", "énergie"],
        "Génie Électronique": ["électronique", "electronique", "carte", "microcontrôleur", "arduino", "raspberry", "fpga", "circuit imprimé"],
        "Génie Mécanique": ["mécanique", "mecanique", "mécanismes", "moteur", "pièce", "conception mécanique", "fabrication", "usinage"]
    }
    
    for dept, keywords in dept_keywords.items():
        for kw in keywords:
            if kw in user_text:
                elements["departement"] = dept
                break
        if elements["departement"]:
            break
    
    # Niveau d'études
    niveau_keywords = {
        "Licence": ["licence", "l1", "l2", "l3", "bac+3"],
        "Master": ["master", "m1", "m2", "bac+5"],
        "Doctorat": ["doctorat", "phd", "these", "bac+8"]
    }
    
    for niveau, keywords in niveau_keywords.items():
        for kw in keywords:
            if kw in user_text:
                elements["niveau"] = niveau
                break
        if elements["niveau"]:
            break
    
    # Technologies par département
    techs_par_departement = {
        "Génie Informatique": ["react", "next.js", "django", "python", "javascript", "typescript", "node.js", "php", "java", "flutter", "tensorflow", "pytorch", "docker", "git"],
        "Génie Civil": ["autocad", "revit", "civil 3d", "etabs", "sap2000", "robot structural", "archicad", "tekla", "primavera"],
        "Génie Électrique": ["matlab", "simulink", "plecs", "pspice", "autocad electrical", "see electrical", "epanet", "dialux"],
        "Génie Électronique": ["arduino", "raspberry pi", "fpga", "vhdl", "verilog", "altium", "kicad", "eagle", "matlab", "proteus"],
        "Génie Mécanique": ["solidworks", "catia", "autocad", "inventor", "ansys", "abaqus", "comsol", "fusion 360", "nx"]
    }
    
    if elements["departement"]:
        for tech in techs_par_departement.get(elements["departement"], []):
            if tech in user_text:
                elements["technologies"].append(tech)
    
    # Questions naturelles à poser
    questions = []
    if not elements["departement"]:
        questions.append("Dans quel département êtes-vous ? (Génie informatique, civil, électrique, électronique ou mécanique ?)")
    elif elements["departement"] == "Génie Informatique" and not elements["technologies"]:
        questions.append("Quelles technologies ou langages de programmation utilisez-vous habituellement ?")
    elif elements["departement"] in ["Génie Civil", "Génie Mécanique"] and not elements["technologies"]:
        questions.append("Quels logiciels de conception maîtrisez-vous ?")
    
    if not elements["niveau"]:
        questions.append("À quel niveau d'études êtes-vous ? (Licence, Master ou Doctorat ?)")
    
    # Vérifier si on peut proposer des sujets
    peut_proposer = (
        elements["departement"] is not None and 
        (len(elements["technologies"]) > 0 or elements["departement"] in ["Génie Civil", "Génie Mécanique"]) and
        elements["niveau"] is not None
    )
    
    return {
        "compris": len([v for v in elements.values() if v]) > 0,
        "contexte": f"Étudiant en {elements['departement'] or 'département non précisé'} - {elements['niveau'] or 'niveau non précisé'}",
        "elements_identifies": {k: v for k, v in elements.items() if v},
        "questions_a_poser": questions if questions else None,
        "peut_proposer_sujets": peut_proposer
    }

# ======================
# RÉPONSE EXPERT HUMAIN
# ======================

def repondre_comme_expert(question: str, historique: str = "", analyse: Dict = None) -> str:
    """Répond comme le ferait un vrai expert humain."""
    if not llm:
        return repondre_sans_llm(question, analyse)
    
    # Construire le contexte de la conversation
    contexte_utilisateur = ""
    if analyse and analyse.get("elements_identifies"):
        elements = analyse["elements_identifies"]
        if elements.get("departement"):
            contexte_utilisateur += f"L'étudiant est en {elements['departement']}. "
        if elements.get("niveau"):
            contexte_utilisateur += f"Niveau: {elements['niveau']}. "
        if elements.get("technologies"):
            contexte_utilisateur += f"Connaît: {', '.join(elements['technologies'])}. "
    
    prompt = f"""
    Tu es un professeur et expert en encadrement de mémoires à la Faculté des Sciences de l'Ingénieur.
    Tu dialogues avec un étudiant pour l'aider à trouver son sujet de mémoire.
    
    **TON COMPORTEMENT:**
    - Sois naturel, comme dans une vraie conversation
    - Ne te présente PAS à chaque message
    - Utilise un langage humain, pas de formatage robotique
    - Pose UNE question à la fois si besoin de précisions
    - Adapte-toi au département de l'étudiant
    
    **CE QUE JE SAIS DÉJÀ SUR L'ÉTUDIANT:**
    {contexte_utilisateur if contexte_utilisateur else "Nouvel étudiant, je ne sais rien encore"}
    
    **HISTORIQUE RÉCENT:**
    {historique if historique else "Début de conversation"}
    
    **MESSAGE DE L'ÉTUDIANT:**
    "{question}"
    
    **TA RÉPONSE (naturelle, humaine):**
    """
    
    try:
        response = llm.invoke(prompt)
        reponse = response.content if hasattr(response, 'content') else str(response)
        return reponse.strip()
    except Exception as e:
        print(f"Erreur LLM: {e}")
        return repondre_sans_llm(question, analyse)

def repondre_sans_llm(question: str, analyse: Dict = None) -> str:
    """Fallback quand LLM indisponible"""
    if len(question.strip()) < 10:
        return "Je n'ai pas bien compris. Pourriez-vous préciser ?"
    
    if not analyse or not analyse.get("elements_identifies"):
        return "Pour mieux vous guider, pourriez-vous me dire dans quel département vous êtes et votre niveau ?"
    
    departement = analyse.get("elements_identifies", {}).get("departement")
    if departement:
        return f"D'accord, vous êtes en {departement}. Parlez-moi un peu plus de ce qui vous intéresse dans ce domaine."
    
    return "Intéressant. Pouvez-vous m'en dire plus sur votre projet ?"

# ======================
# RECOMMANDATION DE SUJETS (EXPORTÉE)
# ======================

def recommander_sujets_llm(
    interests: List[str],
    sujets: List[Dict],
    critères: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """Recommande des sujets de manière experte avec scores normalisés"""
    # Gestion des entrées None
    if interests is None:
        interests = []
    elif isinstance(interests, str):
        interests = [i.strip() for i in interests.split(',') if i.strip()]
    
    if critères is None:
        critères = {}
    
    # Nettoyer les critères pour éviter les None
    critères_propres = {}
    for k, v in critères.items():
        if v is not None and v != "":
            # S'assurer que c'est une chaîne de caractères
            if not isinstance(v, str):
                v = str(v)
            critères_propres[k] = v
    
    print(f"🎯 Critères nettoyés pour LLM: {critères_propres}")
    
    if not sujets:
        return []
    
    # Si LLM n'est pas disponible, utiliser le fallback intelligent
    if not llm:
        print("⚠️ LLM non disponible, utilisation du fallback")
        return fallback_recommendation(interests, sujets, critères_propres)
    
    try:
        # Filtrer et noter les sujets avec LLM
        results = []
        for sujet in sujets[:20]:  # Limiter à 20 pour la performance
            score = 0
            raisons = []
            critères_respectés = []
            
            # Vérifier les intérêts
            titre = sujet.get("titre", "").lower() if sujet.get("titre") else ""
            description = sujet.get("description", "").lower() if sujet.get("description") else ""
            keywords = sujet.get("keywords", "").lower() if sujet.get("keywords") else ""
            
            for interest in interests:
                if not interest or not isinstance(interest, str):
                    continue
                interest_lower = interest.lower()
                if interest_lower in titre:
                    score += 30
                    raisons.append(f"Correspond à votre intérêt pour '{interest}'")
                elif interest_lower in keywords:
                    score += 20
                    raisons.append(f"Lié à votre intérêt pour '{interest}'")
                elif interest_lower in description:
                    score += 10
            
            # Vérifier le niveau
            niveau_etudiant = critères_propres.get("niveau", "").lower()
            niveau_sujet = sujet.get("niveau", "").lower() if sujet.get("niveau") else ""
            if niveau_etudiant and niveau_sujet:
                if niveau_etudiant in niveau_sujet or niveau_sujet in niveau_etudiant:
                    score += 20
                    raisons.append(f"Niveau adapté: {niveau_sujet}")
                    critères_respectés.append("niveau")
            
            # Vérifier le domaine
            domaine_etudiant = critères_propres.get("domaine", "").lower()
            domaine_sujet = sujet.get("domaine", "").lower() if sujet.get("domaine") else ""
            if domaine_etudiant and domaine_sujet:
                if domaine_etudiant in domaine_sujet or domaine_sujet in domaine_etudiant:
                    score += 25
                    raisons.append(f"Dans votre domaine: {domaine_sujet}")
                    critères_respectés.append("domaine")
            
            # Vérifier la faculté
            faculté_etudiant = critères_propres.get("faculté", "").lower()
            faculté_sujet = sujet.get("faculté", "").lower() if sujet.get("faculté") else ""
            if faculté_etudiant and faculté_sujet:
                if faculté_etudiant in faculté_sujet or faculté_sujet in faculté_etudiant:
                    score += 25
                    raisons.append(f"Correspond à votre faculté: {sujet.get('faculté')}")
                    critères_respectés.append("faculté")
            
            # Vérifier la difficulté
            difficulté_etudiant = critères_propres.get("difficulté", "").lower()
            difficulté_sujet = sujet.get("difficulté", "").lower() if sujet.get("difficulté") else ""
            if difficulté_etudiant and difficulté_sujet:
                if difficulté_etudiant == difficulté_sujet:
                    score += 15
                    raisons.append(f"Difficulté adaptée: {difficulté_sujet}")
                    critères_respectés.append("difficulté")
            
            # Bonus pour les sujets populaires
            vue_count = sujet.get("vue_count", 0)
            like_count = sujet.get("like_count", 0)
            if vue_count and vue_count > 50:
                score += 5
                if not raisons:
                    raisons.append("Sujet populaire")
            if like_count and like_count > 10:
                score += 5
                if not raisons and len(raisons) < 2:
                    raisons.append("Bien noté par la communauté")
            
            # Seuil minimum de pertinence (ajusté pour être plus inclusif)
            if score > 20:
                # Normaliser le score entre 0 et 100
                score_normalise = min(100, score)
                
                if not raisons:
                    raisons = ["Sujet pertinent pour votre profil"]
                
                if not critères_respectés and (faculté_etudiant or domaine_etudiant):
                    # Si aucun critère spécifique n'est respecté mais que le sujet est dans le lot
                    critères_respectés = ["Pertinence générale"]
                
                # CRITIQUE: S'assurer que le sujet a tous les champs requis
                sujet_complet = sujet.copy()
                
                # Ajouter created_at si manquant (avec une valeur par défaut)
                if 'created_at' not in sujet_complet or sujet_complet['created_at'] is None:
                    # Utiliser la date actuelle comme fallback
                    sujet_complet['created_at'] = datetime.now().isoformat()
                
                # S'assurer que tous les champs requis sont présents
                champs_requis = ['id', 'titre', 'description', 'keywords', 'domaine', 
                                  'niveau', 'faculté', 'difficulté', 'problématique', 
                                  'vue_count', 'like_count', 'created_at']
                
                for champ in champs_requis:
                    if champ not in sujet_complet or sujet_complet[champ] is None:
                        if champ == 'created_at':
                            sujet_complet[champ] = datetime.now().isoformat()
                        elif champ in ['vue_count', 'like_count']:
                            sujet_complet[champ] = 0
                        elif champ == 'difficulté':
                            sujet_complet[champ] = 'moyenne'
                        else:
                            sujet_complet[champ] = ''
                
                results.append({
                    "sujet": sujet_complet,
                    "score": score_normalise,
                    "raisons": raisons[:3],  # Garder les 3 meilleures raisons
                    "critères_respectés": critères_respectés or ["Pertinence"]
                })
        
        # Si pas de résultats avec le seuil, prendre les meilleurs sujets
        if not results and sujets:
            print("⚠️ Aucun sujet avec score >20, prise des meilleurs disponibles")
            for i, sujet in enumerate(sujets[:10]):
                # CRITIQUE: S'assurer que le sujet a tous les champs requis
                sujet_complet = sujet.copy()
                
                # Ajouter created_at si manquant
                if 'created_at' not in sujet_complet or sujet_complet['created_at'] is None:
                    sujet_complet['created_at'] = datetime.now().isoformat()
                
                # S'assurer que tous les champs requis sont présents
                champs_requis = ['id', 'titre', 'description', 'keywords', 'domaine', 
                                  'niveau', 'faculté', 'difficulté', 'problématique', 
                                  'vue_count', 'like_count', 'created_at']
                
                for champ in champs_requis:
                    if champ not in sujet_complet or sujet_complet[champ] is None:
                        if champ == 'created_at':
                            sujet_complet[champ] = datetime.now().isoformat()
                        elif champ in ['vue_count', 'like_count']:
                            sujet_complet[champ] = 0
                        elif champ == 'difficulté':
                            sujet_complet[champ] = 'moyenne'
                        else:
                            sujet_complet[champ] = ''
                
                results.append({
                    "sujet": sujet_complet,
                    "score": 70 - (i * 5),  # Score décroissant
                    "raisons": ["Sujet recommandé"],
                    "critères_respectés": ["Disponible"]
                })
        
        # Trier par score
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:20]  # Retourner jusqu'à 20 résultats
        
    except Exception as e:
        print(f"❌ Erreur dans recommander_sujets_llm: {e}")
        import traceback
        traceback.print_exc()
        # Fallback en cas d'erreur
        return fallback_recommendation(interests, sujets, critères_propres)


def fallback_recommendation(
    interests: List[str], 
    sujets: List[Dict], 
    critères: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Fallback intelligent pour les recommandations sans LLM"""
    # Gestion des entrées None
    if interests is None:
        interests = []
    elif isinstance(interests, str):
        interests = [i.strip() for i in interests.split(',') if i.strip()]
    
    if critères is None:
        critères = {}
    
    # Nettoyer les critères
    critères_propres = {k: v.lower() if isinstance(v, str) else v for k, v in critères.items() if v is not None}
    
    print(f"🎯 Fallback avec critères: {critères_propres}")
    print(f"🎯 Fallback avec intérêts: {interests}")
    
    results = []
    
    # Filtrer les sujets pertinents
    for sujet in sujets[:50]:  # Analyser plus de sujets
        score = 0
        raisons = []
        critères_respectés = []
        
        # --- CORRESPONDANCE AVEC LA FACULTÉ (PRIORITAIRE) ---
        faculté_etudiant = critères_propres.get("faculté", "").lower()
        faculté_sujet = sujet.get("faculté", "").lower() if sujet.get("faculté") else ""
        if faculté_etudiant and faculté_sujet:
            # Correspondance exacte ou partielle
            if faculté_etudiant == faculté_sujet or faculté_etudiant in faculté_sujet or faculté_sujet in faculté_etudiant:
                score += 30
                raisons.append(f"Correspond à votre faculté: {sujet.get('faculté')}")
                critères_respectés.append("faculté")
                print(f"✅ Correspondance faculté: {faculté_etudiant} == {faculté_sujet}")
        
        # --- CORRESPONDANCE AVEC LE DOMAINE ---
        domaine_etudiant = critères_propres.get("domaine", "").lower()
        domaine_sujet = sujet.get("domaine", "").lower() if sujet.get("domaine") else ""
        if domaine_etudiant and domaine_sujet:
            if domaine_etudiant == domaine_sujet or domaine_etudiant in domaine_sujet or domaine_sujet in domaine_etudiant:
                score += 25
                raisons.append(f"Dans votre domaine: {sujet.get('domaine')}")
                critères_respectés.append("domaine")
        
        # --- VÉRIFICATION DES INTÉRÊTS ---
        titre = sujet.get("titre", "").lower() if sujet.get("titre") else ""
        description = sujet.get("description", "").lower() if sujet.get("description") else ""
        keywords = sujet.get("keywords", "").lower() if sujet.get("keywords") else ""
        
        for interest in interests:
            if not interest or not isinstance(interest, str):
                continue
            interest_lower = interest.lower()
            if len(interest_lower) < 2:
                continue
                
            if interest_lower in titre:
                score += 20
                raisons.append(f"Correspond à votre intérêt '{interest}' dans le titre")
                if "intérêt" not in critères_respectés:
                    critères_respectés.append("intérêts")
            elif interest_lower in keywords:
                score += 15
                raisons.append(f"Lié à votre intérêt '{interest}'")
                if "intérêt" not in critères_respectés:
                    critères_respectés.append("intérêts")
            elif interest_lower in description:
                score += 10
                if "intérêt" not in critères_respectés and len(raisons) < 3:
                    raisons.append(f"En lien avec '{interest}'")
                    if "intérêt" not in critères_respectés:
                        critères_respectés.append("intérêts")
        
        # --- CORRESPONDANCE AVEC LE NIVEAU ---
        niveau_etudiant = critères_propres.get("niveau", "").lower()
        niveau_sujet = sujet.get("niveau", "").lower() if sujet.get("niveau") else ""
        if niveau_etudiant and niveau_sujet:
            if niveau_etudiant in niveau_sujet or niveau_sujet in niveau_etudiant:
                score += 15
                if "Niveau adapté" not in raisons:
                    raisons.append(f"Niveau adapté: {sujet.get('niveau')}")
                if "niveau" not in critères_respectés:
                    critères_respectés.append("niveau")
        
        # --- CORRESPONDANCE AVEC LA DIFFICULTÉ ---
        difficulté_etudiant = critères_propres.get("difficulté", "").lower()
        difficulté_sujet = sujet.get("difficulté", "").lower() if sujet.get("difficulté") else ""
        if difficulté_etudiant and difficulté_sujet:
            if difficulté_etudiant == difficulté_sujet:
                score += 10
                if "difficulté" not in critères_respectés:
                    critères_respectés.append("difficulté")
        
        # Bonus pour les sujets populaires
        vue_count = sujet.get("vue_count", 0)
        like_count = sujet.get("like_count", 0)
        if vue_count and vue_count > 30:
            score += 5
        if like_count and like_count > 5:
            score += 5
        
        # Ne garder que les sujets avec un score minimum
        # Si l'utilisateur a une faculté définie, être plus sélectif
        seuil_min = 30 if critères_propres.get("faculté") else 20
        
        if score >= seuil_min:
            # S'assurer que le score ne dépasse pas 100
            score_normalise = min(100, score)
            
            # S'assurer qu'on a au moins une raison
            if not raisons:
                if critères_propres.get("faculté"):
                    raisons = ["Correspond à votre faculté"]
                else:
                    raisons = ["Sujet pertinent"]
            
            if not critères_respectés:
                critères_respectés = ["Pertinence"]
            
            # CRITIQUE: S'assurer que le sujet a tous les champs requis
            sujet_complet = sujet.copy()
            
            # Ajouter created_at si manquant
            if 'created_at' not in sujet_complet or sujet_complet['created_at'] is None:
                sujet_complet['created_at'] = datetime.now().isoformat()
            
            # S'assurer que tous les champs requis sont présents
            champs_requis = ['id', 'titre', 'description', 'keywords', 'domaine', 
                              'niveau', 'faculté', 'difficulté', 'problématique', 
                              'vue_count', 'like_count', 'created_at']
            
            for champ in champs_requis:
                if champ not in sujet_complet or sujet_complet[champ] is None:
                    if champ == 'created_at':
                        sujet_complet[champ] = datetime.now().isoformat()
                    elif champ in ['vue_count', 'like_count']:
                        sujet_complet[champ] = 0
                    elif champ == 'difficulté':
                        sujet_complet[champ] = 'moyenne'
                    else:
                        sujet_complet[champ] = ''
            
            results.append({
                "sujet": sujet_complet,
                "score": score_normalise,
                "raisons": raisons[:3],
                "critères_respectés": critères_respectés
            })
    
    # Trier par score
    results.sort(key=lambda x: x["score"], reverse=True)
    
    # Si aucun résultat, prendre les premiers sujets avec un score minimum
    if not results and sujets:
        print("⚠️ Aucun résultat avec le seuil, prise des premiers sujets")
        for i, sujet in enumerate(sujets[:10]):
            # CRITIQUE: S'assurer que le sujet a tous les champs requis
            sujet_complet = sujet.copy()
            
            # Ajouter created_at si manquant
            if 'created_at' not in sujet_complet or sujet_complet['created_at'] is None:
                sujet_complet['created_at'] = datetime.now().isoformat()
            
            # S'assurer que tous les champs requis sont présents
            champs_requis = ['id', 'titre', 'description', 'keywords', 'domaine', 
                              'niveau', 'faculté', 'difficulté', 'problématique', 
                              'vue_count', 'like_count', 'created_at']
            
            for champ in champs_requis:
                if champ not in sujet_complet or sujet_complet[champ] is None:
                    if champ == 'created_at':
                        sujet_complet[champ] = datetime.now().isoformat()
                    elif champ in ['vue_count', 'like_count']:
                        sujet_complet[champ] = 0
                    elif champ == 'difficulté':
                        sujet_complet[champ] = 'moyenne'
                    else:
                        sujet_complet[champ] = ''
            
            results.append({
                "sujet": sujet_complet,
                "score": 60 - (i * 3),
                "raisons": ["Sujet disponible"],
                "critères_respectés": ["Général"]
            })
    
    print(f"✅ Fallback: {len(results)} résultats trouvés")
    return results[:20]  # Retourner jusqu'à 20 résultats

# ======================
# GÉNÉRATION DE SUJETS (EXPORTÉE)
# ======================

def générer_sujets_llm(params: Dict[str, Any], count: int = 3) -> List[Dict[str, Any]]:
    """Génère des sujets de manière experte"""
    if not llm:
        return generate_default_subjects(params, count)
    
    prompt = f"""
    En tant qu'expert en encadrement de mémoires à la Faculté des Sciences de l'Ingénieur,
    propose {count} sujets de mémoire pertinents pour un étudiant.
    
    **PROFIL DE L'ÉTUDIANT:**
    - Département: {params.get('domaine', 'Génie Informatique')}
    - Niveau: {params.get('niveau', 'Master')}
    - Intérêts: {', '.join(params.get('interests', ['Général'])) if isinstance(params.get('interests'), list) else params.get('interests', 'Général')}
    
    **FORMAT DE RÉPONSE (JSON uniquement):**
    [
      {{
        "titre": "Titre clair et précis",
        "description": "Description en 2-3 phrases",
        "keywords": "mot-clé1, mot-clé2, mot-clé3",
        "domaine": "département concerné",
        "niveau": "niveau adapté",
        "problématique": "Question de recherche",
        "méthodologie": "Approche suggérée",
        "difficulté": "facile/moyenne/difficile",
        "durée_estimée": "6 mois"
      }}
    ]
    """
    
    try:
        response = llm.invoke(prompt)
        reponse = response.content if hasattr(response, 'content') else str(response)
        
        # Extraire le JSON
        json_match = re.search(r'\[.*\]', reponse, re.DOTALL)
        if json_match:
            sujets = json.loads(json_match.group())
            return sujets[:count]
    except Exception as e:
        print(f"Erreur génération: {e}")
    
    return generate_default_subjects(params, count)

def generate_default_subjects(params: Dict[str, Any], count: int) -> List[Dict[str, Any]]:
    """Génère des sujets par défaut"""
    departement = params.get("domaine", "Génie Informatique")
    niveau = params.get("niveau", "Master")
    
    sujets_par_departement = {
        "Génie Informatique": [
            {
                "titre": "Développement d'une application web pour la gestion de projets académiques",
                "description": "Concevoir une plateforme collaborative pour le suivi des projets étudiants.",
                "keywords": "react, django, web, base de données",
                "problématique": "Comment faciliter le suivi des projets académiques ?",
                "méthodologie": "Analyse des besoins, conception, développement, tests",
                "difficulté": "moyenne",
                "durée_estimée": "6 mois"
            },
            {
                "titre": "Système de recommandation de sujets de mémoire par machine learning",
                "description": "Développer un algorithme qui suggère des sujets adaptés au profil.",
                "keywords": "machine learning, python, recommandation",
                "problématique": "Comment personnaliser les recommandations de sujets ?",
                "méthodologie": "Collecte de données, modélisation, entraînement, évaluation",
                "difficulté": "difficile",
                "durée_estimée": "8 mois"
            }
        ],
        "Génie Civil": [
            {
                "titre": "Analyse comparative des matériaux écologiques en construction",
                "description": "Étudier les performances des nouveaux matériaux durables.",
                "keywords": "béton écologique, durabilité, résistance",
                "problématique": "Quels matériaux alternatifs pour une construction durable ?",
                "méthodologie": "Étude expérimentale, tests en laboratoire, analyse",
                "difficulté": "moyenne",
                "durée_estimée": "6 mois"
            }
        ]
    }
    
    # Sélectionner les sujets du département ou utiliser un fallback
    sujets = sujets_par_departement.get(departement, sujets_par_departement["Génie Informatique"])
    
    results = []
    for i, sujet in enumerate(sujets[:count]):
        sujet_copie = sujet.copy()
        sujet_copie["domaine"] = departement
        sujet_copie["niveau"] = niveau
        results.append(sujet_copie)
    
    return results

# ======================
# ANALYSE DE SUJET (EXPORTÉE)
# ======================

def analyser_sujet(sujet_data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyse un sujet comme le ferait un expert"""
    if not llm:
        return get_fallback_analysis(sujet_data)
    
    prompt = f"""
    En tant qu'expert en évaluation de mémoires, analyse ce sujet:
    
    **SUJET:**
    Titre: {sujet_data.get('titre', 'Non spécifié')}
    Domaine: {sujet_data.get('domaine', 'Général')}
    Description: {sujet_data.get('description', 'Non spécifiée')}
    
    **FORMAT DE RÉPONSE (JSON):**
    {{
        "pertinence": 75,
        "points_forts": ["point1", "point2"],
        "points_faibles": ["point1", "point2"],
        "suggestions": ["suggestion1", "suggestion2"],
        "recommandations": ["recommandation1", "recommandation2"]
    }}
    """
    
    try:
        response = llm.invoke(prompt)
        reponse = response.content if hasattr(response, 'content') else str(response)
        
        json_match = re.search(r'\{.*\}', reponse, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        print(f"Erreur analyse: {e}")
    
    return get_fallback_analysis(sujet_data)

def get_fallback_analysis(sujet_data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyse de secours"""
    return {
        "pertinence": 75,
        "points_forts": ["Sujet bien structuré", "Domaine porteur"],
        "points_faibles": ["Méthodologie à préciser"],
        "suggestions": ["Approfondir la revue de littérature"],
        "recommandations": ["Sujet prometteur à développer"]
    }

# ======================
# AUTRES FONCTIONS UTILES
# ======================

def get_acceptance_criteria() -> Dict[str, Any]:
    """Retourne les critères d'acceptation des sujets"""
    return {
        "critères_acceptation": [
            "Pertinence académique",
            "Faisabilité technique",
            "Originalité",
            "Adéquation au niveau"
        ],
        "critères_rejet": [
            "Sujet trop vague",
            "Duplication sans valeur ajoutée",
            "Ressources insuffisantes"
        ]
    }

def get_tips() -> Dict[str, List[str]]:
    """Retourne des conseils pour la rédaction"""
    return {
        "choix_sujet": [
            "Choisissez un sujet qui vous passionne",
            "Vérifiez la disponibilité des ressources"
        ],
        "methodologie": [
            "Définissez clairement votre problématique",
            "Choisissez une méthodologie adaptée"
        ]
    }

# ======================
# VECTOR STORE POUR CHROMADB
# ======================

SUJETS_VECTORSTORE = None  # Cache pour le vector store

def build_sujets_vectorstore(persist_directory: Optional[str] = None):
    """
    Construit ou recharge le vector store Chroma pour la recherche sémantique.
    Cette fonction est appelée au démarrage de l'application.
    """
    global SUJETS_VECTORSTORE

    # Si déjà construit, retourner
    if SUJETS_VECTORSTORE is not None:
        return SUJETS_VECTORSTORE

    # Vérifier que les dépendances sont disponibles
    if not llm or not Chroma or not GoogleGenerativeAIEmbeddings or not Document:
        print("⚠️ Chroma ou embeddings non disponibles, vector store désactivé")
        return None

    try:
        # Initialiser les embeddings
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

        # 2) Sinon, on reconstruit à partir du CSV
        sujets = load_sujets_csv()
        docs: List[Document] = []

        for i, s in enumerate(sujets):
            # Créer un document texte à partir des informations du sujet
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
                    },
                )
            )

        # Ajouter les critères d'acceptation comme document de référence
        criteria = get_acceptance_criteria()
        criteres_txt = (
            "CRITÈRES D'ACCEPTATION D'UN SUJET DE MÉMOIRE:\n- "
            + "\n- ".join(criteria["critères_acceptation"])
            + "\n\nCRITÈRES DE REJET:\n- "
            + "\n- ".join(criteria["critères_rejet"])
        )
        
        docs.append(
            Document(
                page_content=criteres_txt,
                metadata={"source": "acceptance_criteria"},
            )
        )

        if docs:
            if persist_directory:
                os.makedirs(persist_directory, exist_ok=True)
                SUJETS_VECTORSTORE = Chroma.from_documents(
                    documents=docs,
                    embedding=embeddings,
                    persist_directory=persist_directory,
                )
                print(f"✅ Vector store construit avec {len(docs)} documents et persisté dans {persist_directory}")
            else:
                SUJETS_VECTORSTORE = Chroma.from_documents(
                    documents=docs,
                    embedding=embeddings,
                )
                print(f"✅ Vector store construit avec {len(docs)} documents (en mémoire)")
        else:
            print("⚠️ Aucun document pour construire le vector store")
            return None

        return SUJETS_VECTORSTORE

    except Exception as e:
        print(f"⚠️ Erreur lors de la construction du vector store: {e}")
        import traceback
        traceback.print_exc()
        return None


def search_sujets_context(query: str, k: int = 5) -> List[Document]:
    """
    Recherche les documents les plus pertinents dans le vector store.
    Utilisé pour fournir du contexte à l'IA.
    """
    vs = build_sujets_vectorstore()
    if not vs:
        return []
    try:
        return vs.similarity_search(query, k=k)
    except Exception as e:
        print(f"⚠️ Erreur lors de la recherche: {e}")
        return []
# ======================
# EXPORTATIONS
# ======================

__all__ = [
    'llm',
    'load_sujets_csv',
    'build_sujets_vectorstore',  
    'search_sujets_context',      
    'analyser_conversation_expert',
    'repondre_comme_expert',
    'repondre_sans_llm',
    'recommander_sujets_llm',
    'générer_sujets_llm',
    'analyser_sujet',
    'get_acceptance_criteria',
    'get_tips'
]