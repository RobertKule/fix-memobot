# test_llm.py
import os
from dotenv import load_dotenv

load_dotenv()

print("=== DIAGNOSTIC LLM ===")
print(f"GOOGLE_API_KEY défini: {'OUI' if os.getenv('GOOGLE_API_KEY') else 'NON'}")
print(f"GOOGLE_API_KEY (premiers 10 chars): {os.getenv('GOOGLE_API_KEY')[:10] if os.getenv('GOOGLE_API_KEY') else 'N/A'}")

try:
    from app.llm_service import get_llm_status
    status = get_llm_status()
    print(f"LLM disponible: {status['llm_available']}")
    print(f"Sujets CSV chargés: {status['sujets_csv_initialized']}")
    print(f"Nombre de sujets: {status['sujets_csv_count']}")
    
    # Tester une réponse simple
    from app.llm_service import répondre_question
    test_response = répondre_question("Bonjour, qui es-tu ?", "test")
    print(f"Test réponse: {test_response[:100]}...")
    
except Exception as e:
    print(f"Erreur: {e}")