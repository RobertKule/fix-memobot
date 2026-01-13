# update_users_passwords.py
import sys
import os
from dotenv import load_dotenv
import hashlib

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

# Mettre à jour les mots de passe avec SHA256
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

users = [
    ("admin@thesis.com", hash_password("admin123")),
    ("enseignant@thesis.com", hash_password("enseignant123")),
    ("etudiant@thesis.com", hash_password("etudiant123")),
    ("etudiant2@thesis.com", hash_password("etudiant123"))
]

with engine.connect() as conn:
    for email, hashed_pwd in users:
        conn.execute(
            text("UPDATE users SET hashed_password = :pwd WHERE email = :email"),
            {"pwd": hashed_pwd, "email": email}
        )
        print(f"✅ Mot de passe mis à jour pour {email}")
    
    conn.commit()

print("\n🎉 Mots de passe mis à jour avec SHA256!")