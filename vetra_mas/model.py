"""
    inicia e disponiibiliza a o modelo LLM (gemini) pra uso de todos os agentes
    temos um baixo "temperature" pois quetemos priorizar as consistencia na resposta
"""

import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from vetra.config import GOOGLE_API_KEY

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

llm = None

try:
    if not GOOGLE_API_KEY:
        logging.warning("GOOGLE_API_KEY não encontrada no .env. O modelo LLM ficará desativado.")
    else:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",     # Modelo padrão (pode trocar para gemini-1.5-flash)
            temperature=0.2,              # Baixa variabilidade - respostas consistentes
            google_api_key=GOOGLE_API_KEY,
            convert_system_message_to_human=True
        )
        logging.info("Modelo Google Gemini inicializado com sucesso.")
except Exception as e:
    logging.error(f"Erro ao inicializar o Gemini: {e}")