# test_complete.py
import requests
import json

BASE_URL = "http://localhost:8000"

print("🧪 TEST COMPLET DE L'API AI")
print("="*60)

# 1. Obtenir un token
print("\n1. 🔐 Connexion")
response = requests.post(
    f"{BASE_URL}/api/v1/auth/login-json",
    json={"email": "etudiant@thesis.com", "password": "etudiant123"}
)
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Tous les endpoints AI
endpoints = [
    {
        "name": "Critères d'acceptation",
        "method": "GET",
        "url": "/api/v1/ai/criteria",
        "data": None
    },
    {
        "name": "Question IA",
        "method": "POST", 
        "url": "/api/v1/ai/ask",
        "data": {"question": "Comment choisir un sujet de mémoire en génie civil?"}
    },
    {
        "name": "Analyse sujet",
        "method": "POST",
        "url": "/api/v1/ai/analyze",
        "data": {
            "titre": "Pont suspendu innovant",
            "description": "Conception d'un pont avec matériaux composites",
            "domaine": "Génie Civil",
            "niveau": "Master"
        }
    },
    {
        "name": "Générer sujets",
        "method": "POST",
        "url": "/api/v1/ai/generate",
        "data": {
            "interests": ["pont", "construction", "béton"],
            "domaine": "Génie Civil",
            "count": 2
        }
    },
    {
        "name": "Conseils mémoire",
        "method": "GET",
        "url": "/api/v1/ai/tips",
        "data": None
    }
]

# Tester chaque endpoint
for endpoint in endpoints:
    print(f"\n🔹 {endpoint['name']}")
    print(f"   {endpoint['method']} {endpoint['url']}")
    
    try:
        if endpoint['method'] == 'GET':
            response = requests.get(
                f"{BASE_URL}{endpoint['url']}",
                headers=headers
            )
        else:
            response = requests.post(
                f"{BASE_URL}{endpoint['url']}",
                json=endpoint['data'],
                headers=headers
            )
        
        if response.status_code == 200:
            print(f"   ✅ Status: {response.status_code}")
            data = response.json()
            
            # Afficher un aperçu
            if isinstance(data, dict):
                keys = list(data.keys())[:3]
                print(f"   📊 Données: {keys}...")
            elif isinstance(data, list):
                print(f"   📊 {len(data)} éléments")
        else:
            print(f"   ❌ Status: {response.status_code}")
            print(f"   Erreur: {response.text[:100]}")
            
    except Exception as e:
        print(f"   ❌ Exception: {e}")

print("\n" + "="*60)
print("✅ Tests AI terminés")
print(f"📚 Swagger UI: {BASE_URL}/docs")
print("="*60)