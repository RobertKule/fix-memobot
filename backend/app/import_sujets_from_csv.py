
import csv
import os

from sqlalchemy.orm import Session

from database import SessionLocal
from models import Sujet
from schemas import DifficultyLevel

CSV_PATH_DEFAULT = os.path.join(
    os.path.dirname(__file__),
    "..",
    "data",
    "Sujet_EtudiantsB.csv",
)


def normalize_difficulty(niveau: str) -> str:
    """
    Normalise un niveau/difficulté (ex: L3, M2, TECH2) vers 'facile' | 'moyenne' | 'difficile'
    Tu peux ajuster la logique si besoin.
    """
    niveau = (niveau or "").upper().strip()

    # Très simple / licence 3 → facile/moyenne
    if niveau.startswith("L1") or niveau.startswith("L2"):
        return DifficultyLevel.FACILE.value
    if niveau.startswith("L3"):
        return DifficultyLevel.MOYENNE.value

    # Master / techniques avancées → moyenne/difficile
    if niveau.startswith("M1"):
        return DifficultyLevel.MOYENNE.value
    if niveau.startswith("M2") or "TECH" in niveau:
        return DifficultyLevel.DIFFICILE.value

    # Par défaut
    return DifficultyLevel.MOYENNE.value


def import_sujets_from_csv(csv_path: str = CSV_PATH_DEFAULT):
    db: Session = SessionLocal()
    created = 0
    skipped = 0

    try:
        print(f"📥 Import des sujets depuis: {csv_path}")

        with open(csv_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.reader(f, delimiter=";")

            # Le fichier a un header numérique + colonnes; on va tester la première ligne
            # Si tu as un vrai header, tu peux passer par csv.DictReader, mais ici on prend par index.
            for row in reader:
                # Skip lignes vides
                if not row or (len(row) == 1 and not row[0].strip()):
                    continue

                try:
                    # Selon ton CSV (voir extrait), le format de base est:
                    # id ; titre ; keywords ; domaine ; niveau ; problématique ; objectif ; ... ; description?
                    # Mais vers la fin, les colonnes changent un peu, donc on sécurise avec get par index.
                    # On se base sur les 7 premières colonnes principales observées:
                    # 0: id
                    # 1: titre
                    # 2: mots clés
                    # 3: domaine
                    # 4: niveau
                    # 5: problématique
                    # 6: objectif / phrase
                    # 7: technologies (parfois)
                    # 8: résultat / description courte (parfois)
                    # Comme le fichier est long et un peu irrégulier, on va juste prendre les colonnes importantes.

                    titre = row[1].strip() if len(row) > 1 else ""
                    if not titre:
                        skipped += 1
                        continue

                    keywords = row[2].strip() if len(row) > 2 else ""
                    domaine = row[3].strip() if len(row) > 3 else "Général"
                    niveau = row[4].strip() if len(row) > 4 else "L3"
                    problematique = row[5].strip() if len(row) > 5 else ""
                    description = row[8].strip() if len(row) > 8 else problematique or titre

                    # Certaines lignes ont plus de colonnes (technologies, etc.)
                    technologies = ""
                    if len(row) > 7:
                        technologies = row[7].strip()

                    # Faculté: on derive grosso modo du domaine
                    # Exemple: "Genie civil" → "Génie Civil"
                    faculté = domaine
                    # Tu peux affiner ici si tu as une table propre de correspondance.

                    difficulté = normalize_difficulty(niveau)

                    sujet = Sujet(
                        titre=titre,
                        keywords=keywords or domaine,
                        domaine=domaine,
                        faculté=faculté,
                        niveau=niveau,
                        problématique=problematique or description,
                        méthodologie=None,
                        technologies=technologies or None,
                        description=description,
                        difficulté=difficulté,
                        durée_estimée=None,
                        ressources=None,
                        user_id=None,
                        is_generated=False,
                        vue_count=0,
                        like_count=0,
                        is_active=True,
                    )

                    db.add(sujet)
                    created += 1

                except Exception as row_err:
                    print(f"⚠️ Ligne ignorée (erreur parsing): {row_err}")
                    skipped += 1
                    db.rollback()

        db.commit()
        print(f"✅ Import terminé: {created} sujets créés, {skipped} lignes ignorées")

    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de l'import: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    import_sujets_from_csv()
