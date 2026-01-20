from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Sujet, Feedback

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/landing")
def get_landing_stats(db: Session = Depends(get_db)):
    """
    Statistiques globales pour la page d'accueil (public, pas besoin d'être connecté)
    """
    try:
        # Exemples de calculs de base, adapte selon tes besoins
        students_count = db.query(User).count()

        # Un exemple simple de "satisfaction" basée sur les ratings si tu en as,
        # sinon laisse une valeur fixe ou calcule autre chose.
        total_feedbacks = db.query(Feedback).count()
        positive_feedbacks = db.query(Feedback).filter(
            Feedback.rating >= 4
        ).count() if total_feedbacks > 0 else 0

        satisfaction_rate = (
            round(positive_feedbacks / total_feedbacks * 100)
            if total_feedbacks > 0
            else 98  # fallback si pas de données
        )

        # Moyenne de temps (ici fictif), à remplacer par une vraie métrique si tu en as
        avg_time_hours = 48

        # Taux de personnalisation (peut être statique ou calculé)
        personalization_rate = 100

        return {
            "students_count": students_count,
            "satisfaction_rate": satisfaction_rate,
            "avg_time_hours": avg_time_hours,
            "personalization_rate": personalization_rate,
        }
    except Exception as e:
        print(f"Erreur dans get_landing_stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur serveur: {str(e)}",
        )
