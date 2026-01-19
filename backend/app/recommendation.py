# app/recommendation.py 
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from difflib import SequenceMatcher  # Utilise le module standard Python

from app import crud, models, schemas

class RecommendationEngine:
    def __init__(self):
        pass
        
    def calculate_keyword_match(self, sujet_keywords: str, user_keywords: List[str]) -> float:
        """Calcule le matching entre les mots-clés du sujet et ceux de l'utilisateur"""
        if not user_keywords:
            return 0.0
        
        sujet_keywords_list = [k.strip().lower() for k in sujet_keywords.split(',')]
        
        # Calculer la similarité avec SequenceMatcher (standard Python)
        max_similarities = []
        for user_keyword in user_keywords:
            user_keyword_lower = user_keyword.lower()
            best_similarity = 0.0
            for sujet_keyword in sujet_keywords_list:
                similarity = SequenceMatcher(None, user_keyword_lower, sujet_keyword).ratio()
                if similarity > best_similarity:
                    best_similarity = similarity
            max_similarities.append(best_similarity)
        
        # Retourner la moyenne des meilleures similarités
        return sum(max_similarities) / len(max_similarities) * 100 if max_similarities else 0.0
    
    def recommend_sujets(
        self,
        db: Session,
        interests: List[str],
        niveau: Optional[str] = None,
        faculté: Optional[str] = None,
        domaine: Optional[str] = None,
        difficulté: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Recommandation principale des sujets"""
        
        # Récupérer les sujets
        sujets = crud.get_sujets(db, limit=100)
        
        if not sujets:
            return []
        
        recommendations = []
        
        for sujet in sujets:
            score = 0.0
            reasons = []
            
            # 1. Matching des mots-clés (40%)
            if interests:
                keyword_score = self.calculate_keyword_match(sujet.keywords, interests)
                score += keyword_score * 0.4
                if keyword_score > 50:
                    reasons.append("Mots-clés correspondants")
            
            # 2. Matching du niveau (15%)
            if niveau and sujet.niveau and sujet.niveau.lower() == niveau.lower():
                score += 15
                reasons.append(f"Niveau: {sujet.niveau}")
            
            # 3. Matching de la faculté (15%)
            if faculté and sujet.faculté and faculté.lower() in sujet.faculté.lower():
                score += 15
                reasons.append(f"Faculté: {sujet.faculté}")
            
            # 4. Matching du domaine (15%)
            if domaine and sujet.domaine and domaine.lower() in sujet.domaine.lower():
                score += 15
                reasons.append(f"Domaine: {sujet.domaine}")
            
            # 5. Matching de la difficulté (15%)
            if difficulté and sujet.difficulté and sujet.difficulté.lower() == difficulté.lower():
                score += 15
                reasons.append(f"Difficulté: {sujet.difficulté}")
            
            # Ajouter la recommandation si le score est > 20
            if score > 20:
                recommendations.append({
                    "sujet": sujet,
                    "score": round(score, 2),
                    "raisons": reasons,
                    "critères_respectés": reasons
                })
        
        # Trier par score décroissant
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        
        # Limiter le nombre de résultats
        return recommendations[:limit]

# Instance globale du moteur de recommandation
recommendation_engine = RecommendationEngine()