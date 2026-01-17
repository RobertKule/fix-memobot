# test_gemini_new.py

import os
import sys
from dotenv import load_dotenv

# Ajouter le répertoire parent au path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.llm_service import test_gemini, répondre_question

load_dotenv()

if __name__ == "__main__":
    print("🔧 Test de l'API Gemini...")
    
    # Test de connexion
    if test_gemini():
        print("\n✅ Connexion réussie!")
        # Test de message à une question
        print("\n🤖 Test de question...")
        response = répondre_question("Quels sont les critères d'acceptation d'un sujet de mémoire?")
        print(f"Réponse: {response['message'][:200]}...")
        
        if response['suggestions']:
            print(f"Suggestions: {response['suggestions']}")
    else:
        print("\n❌ Échec de connexion")
        print("Vérifiez que:")
        print("1. Votre clé API Gemini est correcte dans le .env")
        print("2. L'API Gemini est activée sur Google Cloud Console")
        print("3. Vous utilisez le bon modèle (gemini-1.5-pro-latest)")