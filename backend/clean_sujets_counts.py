# scripts/clean_sujets_counts.py (par exemple)
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Sujet

def clean_counts():
    db: Session = SessionLocal()
    try:
        sujets = db.query(Sujet).all()
        for s in sujets:
            # vue_count
            if not isinstance(s.vue_count, int):
                try:
                    digits = ''.join(ch for ch in str(s.vue_count) if ch.isdigit())
                    s.vue_count = int(digits) if digits else 0
                except Exception:
                    s.vue_count = 0

            # like_count
            if not isinstance(s.like_count, int):
                try:
                    digits = ''.join(ch for ch in str(s.like_count) if ch.isdigit())
                    s.like_count = int(digits) if digits else 0
                except Exception:
                    s.like_count = 0

        db.commit()
        print("✅ Nettoyage terminé")
    except Exception as e:
        db.rollback()
        print("❌ Erreur nettoyage:", e)
    finally:
        db.close()

if __name__ == "__main__":
    clean_counts()
