import os
import time
import logging
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from dotenv import load_dotenv

# ---------------------------------------------------
# CARREGAR VARIÁVEIS DE AMBIENTE
# ---------------------------------------------------
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
    print(f".env carregado de: {env_path}")
else:
    print("Arquivo .env não encontrado!")

print("MULTI_AGENT_API_KEY =", os.getenv("MULTI_AGENT_API_KEY"))

# ---------------------------------------------------
# CONFIGURAÇÃO BÁSICA E IMPORTAÇÃO DO GRAFO
# ---------------------------------------------------
logging.basicConfig(level=logging.INFO)
from VETRA_Gemini_Local import build_graph

graph = build_graph()
API_KEY = os.getenv("MULTI_AGENT_API_KEY", "dev-key")
VERSION = "VETRA-MAS-1.0.0"

app = FastAPI(title="VETRA Multi-Agent Risk API", version=VERSION)

# ---------------------------------------------------
# MODELOS DE ENTRADA / SAÍDA
# ---------------------------------------------------
class TransactionInput(BaseModel):
    transaction: Dict[str, Any]
    context: Dict[str, Any] = {}
    preferences: Dict[str, Any] = {}

class HealthResponse(BaseModel):
    status: str
    version: str
    agents: list
    timestamp: str


# ---------------------------------------------------
# FUNÇÕES AUXILIARES
# ---------------------------------------------------
def _severity(score: float) -> str:
    """Converte score numérico em categoria qualitativa."""
    return "low" if score < 0.33 else "medium" if score < 0.66 else "high"

# def _weight(agent: str) -> float:
#     """Define o peso de cada agente para o índice final."""
#     return {"phishing": 0.35, "transaction": 0.30, "rugpull": 0.35}.get(agent, 0.33)


# ---------------------------------------------------
# ENDPOINT DE SAÚDE
# ---------------------------------------------------
@app.get("/api/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        version=VERSION,
        agents=["phishing", "transaction", "rugpull"],
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    )


# ---------------------------------------------------
# ENDPOINT PRINCIPAL /api/analyze
# ---------------------------------------------------
@app.post("/api/analyze")
async def analyze_transaction(req: Request, data: TransactionInput):
    """
    Realiza análise de risco multiagente.
    Compatível com o serviço Node.js (INPUT_SCHEMA / OUTPUT_SCHEMA)
    """

    # --- autenticação opcional ---
    if os.getenv("DISABLE_AUTH", "false").lower() != "true":
        api_key = req.headers.get("X-API-Key")
        if API_KEY and api_key != API_KEY:
            print(f" Chave inválida recebida: {api_key}")
            raise HTTPException(status_code=401, detail="Invalid API Key")

    start_time = time.time()
    tx = data.transaction

    # --- construir prompt / consulta principal ---
    query = (
        f"Analise o token {tx.get('token_symbol', '')} {tx.get('token_address', '')} "
        f"da transação de {tx.get('from_address')} para {tx.get('to_address')} "
        f"no valor de {tx.get('amount')}. Tipo: {tx.get('type')}."
    )

    # --- invocar grafo LangGraph ---
    result = graph.invoke({"query": query})
    final = result.get("final_json", {})

    risk_index = final.get("trust_index", 0)
    level = "low" if risk_index < 0.33 else "medium" if risk_index < 0.66 else "high"

    # ===========================================================
    # MAPEAR SAÍDA PARA O OUTPUT_SCHEMA DO NODE.JS
    # ===========================================================

    # risk_assessment
    risk_assessment = {
        "score": int(round(risk_index * 100)),
        "level": level,
        "confidence": 0.9
    }

    # agent_analysis → renomeado conforme padrão do Node
    agent_analysis = {
        "token_agent": {  # rugpull
            "score": int(round(final.get("scores", {}).get("rugpull", 0) * 100)),
            "findings": [final.get("rationales", {}).get("rugpull", "")],
            "severity": _severity(final.get("scores", {}).get("rugpull", 0))
        },
        "address_agent": {  # transaction
            "score": int(round(final.get("scores", {}).get("transaction", 0) * 100)),
            "findings": [final.get("rationales", {}).get("transaction", "")],
            "severity": _severity(final.get("scores", {}).get("transaction", 0))
        },
        "pattern_agent": {  # phishing
            "score": int(round(final.get("scores", {}).get("phishing", 0) * 100)),
            "findings": [final.get("rationales", {}).get("phishing", "")],
            "severity": _severity(final.get("scores", {}).get("phishing", 0))
        },
        # placeholders opcionais para expansão futura
        "network_agent": {
            "score": 0,
            "findings": ["Network-level agent not yet implemented"],
            "severity": "low"
        },
        "ml_agent": {
            "score": 0,
            "prediction": "N/A",
            "confidence": 0.0
        }
    }

    # risk_factors
    risk_factors = [
        {
            "factor": name,
            "severity": _severity(score),
            "description": final.get("rationales", {}).get(name, ""),
            # "weight": _weight(name)
        }
        for name, score in final.get("scores", {}).items()
    ]

    # recommendations
    recommendations = {
        "action": "block" if level == "high" else "review" if level == "medium" else "approve",
        "reason": f"Overall trust index {risk_index:.2f} ({level} risk)",
        "alternative_actions": ["manual_review", "further_verification"]
    }

    # evidence
    evidence = {
        "on_chain_data": data.context,  # pode ser usado futuramente
        "historical_patterns": {},
        "external_sources": final.get("evidence", [])
    }

    # metadata
    metadata = {
        "analysis_duration_ms": int((time.time() - start_time) * 1000),
        "agents_used": list(final.get("scores", {}).keys()),
        "data_sources": ["LangGraph", "Google Gemini"],
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "version": VERSION
    }

    # resposta final no formato do OUTPUT_SCHEMA
    response = {
        "risk_assessment": risk_assessment,
        "agent_analysis": agent_analysis,
        "risk_factors": risk_factors,
        "recommendations": recommendations,
        "evidence": evidence,
        "metadata": metadata
    }

    return response
