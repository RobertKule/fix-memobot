from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import jaro
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from app import crud, models, schemas

class RecommendationEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='french')
        
    def calculate_keyword_match(self, sujet_keywords: str, user_keywords: List[str]) -> float:
        """Calcule le matching entre les mots-clés du sujet et ceux de l'utilisateur"""
        if not user_keywords:
            return 0.0
        
        sujet_keywords_list = [k.strip().lower() for k in sujet_keywords.split(',')]
        
        # Calculer la similarité Jaro-Winkler pour chaque paire de mots-clés
        max_similarities = []
        for user_keyword in user_keywords:
            user_keyword_lower = user_keyword.lower()
            best_similarity = 0.0
            for sujet_keyword in sujet_keywords_list:
                similarity = jaro.jaro_winkler_metric(user_keyword_lower, sujet_keyword)
                if similarity > best_similarity:
                    best_similarity = similarity
            max_similarities.append(best_similarity)
        
        # Retourner la moyenne des meilleures similarités
        return sum(max_similarities) / len(max_similarities) * 100
    
    def calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calcule la similarité cosinus entre deux textes"""
        if not text1 or not text2:
            return 0.0
        
        try:
            tfidf_matrix = self.vectorizer.fit_transform([text1, text2])
            cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
            return float(cosine_sim[0][0]) * 100
        except:
            return 0.0
    
    def recommend_sujets(
        self,
        db: Session,
        request: schemas.RecommendationRequest,
        user_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Recommandation principale des sujets"""
        
        # Récupérer tous les sujets actifs
        sujets = crud.get_sujets(db, is_active=True)
        
        recommendations = []
        
        for sujet in sujets:
            # Calculer les scores de matching
            scores = []
            matching_keywords = []
            reasons = []
            
            # 1. Matching des mots-clés (40%)
            if request.keywords:
                keyword_score = self.calculate_keyword_match(sujet.keywords, request.keywords)
                scores.append(keyword_score * 0.4)
                
                # Identifier les mots-clés correspondants
                sujet_keywords_list = [k.strip().lower() for k in sujet.keywords.split(',')]
                for user_keyword in request.keywords:
                    user_keyword_lower = user_keyword.lower()
                    for sujet_keyword in sujet_keywords_list:
                        if jaro.jaro_winkler_metric(user_keyword_lower, sujet_keyword) > 0.8:
                            matching_keywords.append(sujet_keyword)
                            break
            
            # 2. Matching du niveau (15%)
            if request.level and sujet.level.lower() == request.level.lower():
                scores.append(100 * 0.15)
                reasons.append(f"Niveau correspondant: {sujet.level}")
            else:
                scores.append(0)
            
            # 3. Matching de la faculté (15%)
            if request.faculty and request.faculty.lower() in sujet.faculty.lower():
                scores.append(100 * 0.15)
                reasons.append(f"Faculté correspondante: {sujet.faculty}")
            else:
                scores.append(0)
            
            # 4. Matching du domaine (15%)
            if request.domain and request.domain.lower() in sujet.domain.lower():
                scores.append(100 * 0.15)
                reasons.append(f"Domaine correspondant: {sujet.domain}")
            else:
                scores.append(0)
            
            # 5. Matching de la difficulté (15%)
            if request.difficulty and sujet.difficulty == request.difficulty.value:
                scores.append(100 * 0.15)
                reasons.append(f"Difficulté appropriée: {sujet.difficulty}")
            else:
                scores.append(0)
            
            # Calculer le score total
            if scores:
                total_score = sum(scores)
                
                # Ajouter des raisons basées sur le score
                if total_score > 70:
                    reasons.append("Correspondance excellente avec vos critères")
                elif total_score > 50:
                    reasons.append("Bonne correspondance avec vos critères")
                elif total_score > 30:
                    reasons.append("Correspondance acceptable avec vos critères")
                
                # Ajouter la recommandation si le score est > 20
                if total_score > 20:
                    recommendations.append({
                        "sujet": sujet,
                        "match_score": round(total_score, 2),
                        "matching_keywords": list(set(matching_keywords)),
                        "reasons": reasons
                    })
        
        # Trier par score décroissant
        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        
        # Limiter le nombre de résultats
        return recommendations[:request.limit]
    
    def get_personalized_recommendations(
        self,
        db: Session,
        user_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Recommandations personnalisées basées sur l'historique de l'utilisateur"""
        
        # Récupérer les préférences de l'utilisateur
        preference = crud.get_user_preference(db, user_id=user_id)
        
        if not preference or not preference.preferred_keywords:
            return []
        
        # Construire la requête de recommandation basée sur les préférences
        request = schemas.RecommendationRequest(
            keywords=[k.strip() for k in preference.preferred_keywords.split(',')],
            level=preference.level,
            faculty=preference.preferred_faculty,
            domain=preference.preferred_domains,
            limit=limit
        )
        
        if preference.preferred_difficulty:
            request.difficulty = schemas.DifficultyLevel(preference.preferred_difficulty)
        
        # Obtenir les recommandations
        return self.recommend_sujets(db, request, user_id)
    
    def update_recommendation_model(
        self,
        db: Session,
        feedback: schemas.Feedback
    ):
        """Met à jour le modèle de recommandation basé sur le feedback"""
        # Ici, on pourrait implémenter un apprentissage automatique
        # Pour l'instant, on met juste à jour les préférences de l'utilisateur
        
        if feedback.was_selected or feedback.was_interested:
            # Récupérer le sujet pour extraire ses caractéristiques
            sujet = crud.get_sujet(db, feedback.sujet_id)
            if sujet:
                # Mettre à jour les préférences de l'utilisateur
                preference = crud.get_or_create_user_preference(db, feedback.user_id)
                
                # Ajouter les mots-clés du sujet aux préférences
                if preference.preferred_keywords:
                    existing_keywords = set(preference.preferred_keywords.split(','))
                    new_keywords = set([k.strip() for k in sujet.keywords.split(',')])
                    combined_keywords = existing_keywords.union(new_keywords)
                    preference.preferred_keywords = ','.join(combined_keywords)
                else:
                    preference.preferred_keywords = sujet.keywords
                
                # Mettre à jour le domaine préféré
                if not preference.preferred_domains:
                    preference.preferred_domains = sujet.domain
                
                # Mettre à jour le niveau si nécessaire
                if not preference.level:
                    preference.level = sujet.level
                
                # Incrémenter le compteur d'interactions
                preference.interaction_count += 1
                
                db.commit()

# Instance globale du moteur de recommandation
recommendation_engine = RecommendationEngine()