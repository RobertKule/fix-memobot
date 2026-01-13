# app/main_setup.py
from app.database import SessionLocal
from app import crud, models
from app.auth import get_password_hash
import asyncio

async def create_demo_data():
    """Crée des données de démo au démarrage"""
    db = SessionLocal()
    try:
        # Créer l'admin s'il n'existe pas
        admin = crud.get_user_by_email(db, "admin@thesis.com")
        if not admin:
            admin_user = models.User(
                email="admin@thesis.com",
                full_name="Administrateur",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("✅ Admin créé")
        
        # Créer l'enseignant
        teacher = crud.get_user_by_email(db, "enseignant@thesis.com")
        if not teacher:
            teacher_user = models.User(
                email="enseignant@thesis.com",
                full_name="Professeur Dupont",
                hashed_password=get_password_hash("enseignant123"),
                role="enseignant",
                is_active=True
            )
            db.add(teacher_user)
            db.commit()
            print("✅ Enseignant créé")
        
        # Créer l'étudiant
        student = crud.get_user_by_email(db, "etudiant@thesis.com")
        if not student:
            student_user = models.User(
                email="etudiant@thesis.com",
                full_name="Étudiant Martin",
                hashed_password=get_password_hash("etudiant123"),
                role="etudiant",
                is_active=True
            )
            db.add(student_user)
            db.commit()
            print("✅ Étudiant créé")
        
        # Créer des sujets de démo
        sujet_count = db.query(models.Sujet).count()
        if sujet_count == 0:
            demo_sujets = [
                models.Sujet(
                    titre="Conception d'un pont suspendu de 170m de portée en zone sismique",
                    keywords="pont, béton, zone sismique, conception, sécurité",
                    domaine="Génie Civil",
                    faculté="Génie Civil",
                    niveau="L3",
                    problématique="Comment concevoir un pont suspendu résistant aux séismes tout en optimisant les coûts ?",
                    méthodologie="Analyse par éléments finis, tests en laboratoire, modélisation 3D",
                    technologies="Autodesk, SAP2000, Robot Structural Analysis",
                    description="Conception détaillée d'un pont suspendu adapté aux zones à haut risque sismique avec optimisation des matériaux.",
                    difficulté="élevée",
                    durée_estimée="9 mois",
                    ressources="Laboratoire de structures, logiciels de simulation"
                ),
                models.Sujet(
                    titre="Valorisation des déchets de verre comme substitut partiel du ciment dans le béton",
                    keywords="déchets, verre, béton, écologie, matériaux composites",
                    domaine="Génie Civil",
                    faculté="Génie Civil",
                    niveau="L3",
                    problématique="Comment réduire l'empreinte carbone du béton en utilisant des déchets de verre ?",
                    méthodologie="Tests de résistance, analyse chimique, étude de durabilité",
                    technologies="Microscope électronique, presses hydrauliques",
                    description="Étude de la faisabilité technique et économique du remplacement partiel du ciment par des déchets de verre broyés.",
                    difficulté="moyenne",
                    durée_estimée="6 mois",
                    ressources="Laboratoire de matériaux, fournisseurs de déchets"
                ),
                models.Sujet(
                    titre="Optimisation d'une poutre en treillis Warren pour un bâtiment industriel",
                    keywords="poutre, treillis, optimisation, structure, industriel",
                    domaine="Génie Civil",
                    faculté="Génie Civil",
                    niveau="L3",
                    problématique="Comment optimiser le poids et la résistance d'une poutre en treillis pour un bâtiment industriel ?",
                    méthodologie="Optimisation mathématique, simulation numérique, tests de validation",
                    technologies="MATLAB, ANSYS, AutoCAD",
                    description="Développement d'un algorithme d'optimisation pour les poutres en treillis de type Warren utilisées dans les bâtiments industriels.",
                    difficulté="moyenne",
                    durée_estimée="5 mois",
                    ressources="Logiciels de CAO, laboratoire de structures"
                )
            ]
            
            for sujet in demo_sujets:
                db.add(sujet)
            
            db.commit()
            print(f"✅ {len(demo_sujets)} sujets de démonstration créés")
        
        print("🚀 Système prêt à fonctionner")
        
    except Exception as e:
        print(f"⚠️ Erreur lors de l'initialisation: {e}")
        db.rollback()
    finally:
        db.close()