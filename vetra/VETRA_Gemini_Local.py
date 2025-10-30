#!/usr/bin/env python
# coding: utf-8

# # VETRA – Sistema Multiagente com LangGraph + Google Gemini
# 
# Este notebook implementa um MVP funcional do VETRA, um sistema multiagente para avaliação de risco e viabilidade no contexto cripto.

# In[27]:


import os
import re
import json
import logging
import time
import random
from typing import Dict, List, Optional, TypedDict, Any
from dataclasses import dataclass
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END

from typing import Dict

# In[28]:


# Configuração básica de logs
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

load_dotenv()

logging.info("Inicializando o modelo Google Gemini...")
llm = None

try:
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        logging.warning("A variável GOOGLE_API_KEY não foi encontrada no .env. O LLM não estará disponível.")
    else:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",     # Você pode trocar para "gemini-1.5-flash" (mais rápido, menor custo)
            temperature=0.2,
            google_api_key=GOOGLE_API_KEY,
            convert_system_message_to_human=True
        )
        logging.info("Modelo Google Gemini inicializado com sucesso.")
except Exception as e:
    logging.error(f"Erro ao inicializar o Gemini: {e}")




# In[29]:


class VetraState(TypedDict, total=False):
    query: str                      # Consulta original do usuário
    route: List[str]                # Sequência de agentes a executar
    scores: Dict[str, float]        # Pontuações (0..1) de cada agente
    rationales: Dict[str, str]      # Explicações curtAS de cada agente
    evidence: List[str]             # Evidências agregadas pelos agentes
    final_report: str               # Relatório final consolidado
    final_json: Dict[str, Any]      # Saída JSON final estruturada


# # tools

# In[30]:


#todo: precisa substituir por integrações reais

@dataclass
class WebResult:
    title: str
    url: str
    snippet: str
# ok
def web_scrape(query: str) -> List[WebResult]:
    """substituir por coisas reais"""
    return [
        WebResult(title="Token X – Site Oficial", url="https://example.com", snippet="Contrato auditado e liquidez travada?"),
        WebResult(title="Discussão em Fórum", url="https://forum.example/x", snippet="Relatos de possíveis problemas antigos.")
    ]

# ok
def fetch_private_data(identifier: str) -> Dict:
    """apenas simulcao, precisa substituir por coisas reais"""
    return {
        "identifier": identifier,
        "holders_top10": 0.76,
        "lp_locked_days": 2,
        "tx_velocity": 1.8,
        "age_days": 11,
    }
# ok
def math_estimator(features: Dict) -> float:
    """calculo heurístico simples de risco (0..1), precisa substituir por algo mais sofisticado"""
    risk = 0.0
    risk += min(1.0, features.get("holders_top10", 0) * 0.8)
    risk += 0.2 if features.get("lp_locked_days", 0) < 7 else 0.0
    risk += 0.1 if features.get("age_days", 0) < 14 else 0.0
    return max(0.0, min(1.0, risk))




DEFAULT_WEIGHTS = {
    "phishing": 0.95,     # phishing costuma ser “fatal” p/ segurança do usuário
    "transaction": 0.75,  # risco comportamental on-chain
    "rugpull": 0.85,      # tokenomics/liquidez perigosos
}


OVERRIDES = [
    ("phishing",   0.90, 0.98),
    ("rugpull",    0.90, 0.95),
    ("transaction",0.90, 0.95),
]

# # prompts

# In[ ]:


# SYSTEM_SUP = SystemMessage(content=(
#     'Você é o Supervisor do VETRA. Com base na consulta do usuário, decida quais agentes devem ser executados. '
#     'Agentes disponíveis: phishing, transaction, rugpull.'
#     'Responda APENAS com um JSON válido exatamente neste formato: {"route":["phishing","rugpull","transaction"]}.'
#     "Inclua somente a chave 'route' com os nomes válidos em minúsculas."
# ))

SYSTEM_SUP = SystemMessage(content=r"""
You are VETRA’s Supervisor. Based on the user’s query, linearly consult the agents that will be used.
Available agents: phishing, transaction, rugpull.
Include only the 'route' key with valid lowercase names.
Each agent will return a SCORE (0..1) and a short explanation, where 0 means a safe analysis for that type of scam and 1 is the highest possible risk.
Your job is to consolidate the results into a final report and a structured JSON output.
Respond ONLY with a valid JSON exactly in this format.
REQUIRED OUTPUT (valid JSON):
"risk_assessment": {
    "score": <float 0..1>,
    "level": "low" | "medium" | "high",
    "confidence": <float 0..1>},
"recommendations": {
"action": "allow" | "review" | "block",
"reason": "brief explanation of the recommended action",
"alternative_actions": "list of strings with alternative recommended actions"
},
"evidence": 
{
"on_chain_data": "object (optional) with relevant on-chain data",
"historical_patterns": "object (optional) with relevant historical patterns",
"external_sources": "object (optional) with relevant external sources"
                   }   
                           }                  
Final JSON output example:
{
  "risk_assessment": {
    "score": 0.725,
    "level": "high",
    "confidence": 0.80
  },
  "recommendations": {
    "action": "block",
    "reason": "High aggregate risk (0.725) with strong phishing signals, rugpull indicators, and on-chain association with sanctioned entities.",
    "alternative_actions": [
      "Manual review by an analyst",
      "Request additional verification of the domain/link",
      "Execute a test transfer with minimum amount in an isolated environment",
      "Wait for critical permissions to be locked/renounced on the contract"
    ]
  },
"evidence": {
                               "on_chain_data": {
      "block_number": 21345678,
      "gas_price": "24 gwei",
      "tx_hash": "0xa9f123b5d6e8f7c9b012a3f45a6b7c89d90f12e34f5a678b90123c4567d89abc",
      "wallet_age_days": 9,
      "previous_transactions": 1200,
      "flagged_addresses": [
        "0x9999999999999999999999999999999999999999"
      ]
    },
    "historical_patterns": {},
    "external_sources": [
      "- Token X – Official Site | https://example.com | Audited contract and locked liquidity?\n- Forum Discussion | https://forum.example/x | Reports of possible past issues.",
      "{'identifier': '0xdAC17F958D2ee523a2206206994597C13D831ec7', 'holders_top10': 0.76, 'lp_locked_days': 2, 'tx_velocity': 1.8, 'age_days': 11}",
      "{'identifier': 'USDT', 'holders_top10': 0.76, 'lp_locked_days': 2, 'tx_velocity': 1.8, 'age_days': 11}"
    ]
  },
"}"
""")


SYSTEM_AGENT = SystemMessage(content=(
    "Você é um analista de risco cripto do VETRA. Sempre responda com:\n"
    "1) SCORE(0..1) na primeira linha (com três casas decimais)\n"
    "2) Em seguida, uma explicação curta (no máximo 4 frases)."
))

SYSTEM_PHISHING = SystemMessage(content=r"""
You are a risk analyst specialized in PHISHING for VETRA.
OBJECTIVE: estimate the phishing risk in a message or transaction.
USE ONLY: provided evidence (search snippets, reputation, deception signals) — do not fabricate.
CRITERIA/RED FLAGS: look-alike domains (typosquatting), shortened URLs, fake/inconsistent HTTPS, misuse of brand, suspicious urgency, requests for seed/private keys, forms asking for keys, young DNS, absence of official profiles, links leading to unknown wallets, requests for personal information.
REQUIRED OUTPUT (valid JSON):
{
  "agent_analysis": {
    "phishing_agent": {
      "score": <float 0..1>,
      "findings": ["short and objective bullet points"],
      "severity": "low" | "medium" | "high"
    },
  "risk_factors": [
    "factor": "phishing",
    "severity": "low" | "medium" | "high",
    "description": "Objective 1–3 sentence summary for the end user."
  }]}
FORMAT: Return ONLY the JSON. No additional text.
MANDATORY OUTPUT EXAMPLE:
{
"agent_analysis" {
    "phishing_agent": {
        "score": 0.125,
        "findings": [
            "The message does not contain shortened links nor does it request sensitive personal information. The domain appears legitimate and correctly uses HTTPS. There are no signs of suspicious urgency or forms asking for private keys."
        ],
        "severity": "low"
    },
"risk_factors": [  
    "factor": "phishing",
    "severity": "low",
    "description": "The analysis indicates a low phishing risk. The message appears trustworthy based on the evidence provided."        
}]}
""
"MANDATORY OUTPUT EXAMPLE:\n"
{
"agent_analysis" {
    "phishing_agent": {
        "score": 0.900,
        "findings": [
            "The message contains a shortened link (bit.ly/xyz123) and requests personal information, which are clear phishing signs. The domain used is suspicious and does not match the official brand. In addition, the message conveys a sense of urgency, pressuring the user to act quickly."
        ],
        "severity": "high"
    },  
  "risk_factors": [
    "factor": "phishing",
    "severity": "high",
    "description": "The analysis indicates a high phishing risk due to the presence of shortened links, requests for personal information, and urgency signals in the message."
}]}
""")

SYSTEM_TRANSACTION = SystemMessage(content=r"""
You are VETRA’s on-chain risk analyst focused on TRANSACTIONS AND CONTRACTS INVOLVED IN THE TX.
OBJECTIVE: estimate the risk of the CURRENT TRANSACTION and the CONTRACTS it touches.
SCOPE (includes but is not limited to):
- Tx type (swap, transfer, mint/burn, stake/unstake, approve/permit/delegate, create account, program invoke).
- Called functions and granted permissions (unlimited approve, permit, delegate, setAuthority, pause/blacklist, upgrade/proxy, missing revoke).
- Contracts/programs touched: verified? proxy/upgradeable? pausable/blacklist? fee-on-transfer? transfer-hook? freeze/mint authority?
- Counterparties and routes: CEX/mixer/sanctioned/flagged addresses; suspicious DEX/routers; MEV/sandwich; flashloans; unusual slippage.
- Anomalous patterns: bursts, young wallet, repeated small amounts, concentrated fan-in/out.
DISTINCTION: DO NOT assess structural TOKEN risk (locked liquidity, holder distribution, etc.) — that’s for the RUGPULL agent. If it appears, cite as 'out-of-scope' and do not weigh it in the score.
DO NOT FABRICATE: use ONLY the data provided in the prompt.
IF THE BEHAVIOR IS NORMAL, assign a low score.
REQUIRED OUTPUT (valid JSON):
{
  "agent_analysis": {
    "transaction_agent": {
      "score": <float 0..1>,
      "findings": ["short and objective bullet points"],
      "severity": "low" | "medium" | "high"
    }
  "risk_factors": [
  "factor": "transaction",
  "severity": "low" | "medium" | "high",
  "description": "Objective 1–3 sentence summary for the end user."
}]
}
FORMAT: Return ONLY the JSON. No additional text.
MANDATORY OUTPUT EXAMPLE:
{
"agent_analysis" {
    "transaction_agent": {
        "score": 0.750,
        "findings": [
            "The transaction involves a swap on an unverified DEX, which increases risk.\n",
            "The called contract has upgrade and pausability functions, which can be exploited by malicious actors.\n",
            "The source wallet is young (15 days) and shows a pattern of anomalous transactions, suggesting possible suspicious activity."
        ],
        "severity": "high"
    },  
"risk_factors": [
    "factor": "transaction",
    "severity": "high",
    "description": "The analysis indicates a high risk for this transaction due to the use of an unverified DEX, potentially dangerous contract functions, and anomalous patterns in the source wallet."
     }]}"

"MANDATORY OUTPUT EXAMPLE:\n"
{
"agent_analysis" {
    "transaction_agent": {
        "score": 0.100,
        "findings": [
            "The transaction is a simple transfer between verified wallets, with no involvement of DEXs or complex contracts.\n",
            "No high-risk function was called, and the source wallet has a clean and established history.\n",
            "No anomalous patterns were detected in the wallet’s recent transactions."
        ],
        "severity": "low"
    },  
"risk_factors": [
    "factor": "transaction",
    "severity": "low",
    "description": "The analysis indicates a low risk for this transaction, which is a simple transfer between verified wallets with no signs of suspicious activity."
    }]}   
""")


SYSTEM_RUGPULL = SystemMessage(content=r"""
You are a token analyst for VETRA focused on RUGPULL.
OBJECTIVE: estimate the rugpull risk of a token.
USE ONLY: provided evidence (on-chain features, contract data, public discussions) — do not fabricate.
CRITERIA/RED FLAGS: locked liquidity/near unlock, high tax rate, active mint authority, ownership not renounced, supply concentration in few wallets, low liquidity, deployer’s past pulls, recent permission changes, trading disabled, honeypot signals.
You will receive features and a preliminary heuristic (0..1). Consider both.
REQUIRED OUTPUT (valid JSON):
{
  "agent_analysis": {
    "rugpull_agent": {
      "score": <float 0..1>,
      "findings": ["short and objective bullet points"],
      "severity": "low" | "medium" | "high"
  },
  "risk_factors": [
  "factor": "transaction",
  "severity": "low" | "medium" | "high",
  "description": "Objective 1–3 sentence summary for the end user."}]}
FORMAT: Return ONLY the JSON. No additional text.
MANDATORY OUTPUT EXAMPLE:
{
"agent_analysis" {
    "rugpull_agent": {
        "score": 0.850,
        "findings": [
            "The analysis reveals several significant red flags. Top-10 holder concentration is high (76%), indicating manipulation risk. Liquidity is locked for only 2 days, with an imminent unlock, increasing rugpull risk. The token’s age is low (11 days), making long-term reliability hard to assess."
        ],
        "severity": "high"
    },
"risk_factors": [  
    "factor": "rugpull",
    "severity": "high",
    "description": "The analysis indicates a high rugpull risk because the top-10 supply concentration is elevated (76%), liquidity is about to be unlocked (in 2 days), and the token is relatively new (11 days), increasing uncertainty about its future stability."
     }]}"

"MANDATORY OUTPUT EXAMPLE:\n"
{ 
"agent_analysis" {
    "rugpull_agent": {
        "score": 0.025,
        "findings": [
            "The analysis indicates a very low rugpull risk. Liquidity is fully locked for 180 days, which is a strong safety indicator. Top-10 supply concentration is low (15%), suggesting a healthy distribution among holders. In addition, the token has a considerable age (250 days), contributing to confidence in its long-term stability."
        ],
        "severity": "low"
    },
"risk_factors": [
    "factor": "rugpull",
    "severity": "low",
    "description": "The analysis indicates a very low rugpull risk due to fully locked liquidity, low top-10 supply concentration, and considerable token age."
    }]}
""")



# 
# # agents

# In[ ]:


# def supervisor_node(state: VetraState) -> VetraState:
#     """Decide a lista de agentes a executar com base na query do usuário"""
#     user_q = state["query"].strip()
#     msg = [SYSTEM_SUP, HumanMessage(content=user_q)]
#     raw = llm.invoke(msg).content if llm else "phishing,transaction,rugpull"
#     csv = raw.strip().lower()

#     valid = []
#     for part in re.split(r"[\,\n;\s]+", csv):
#         if part in {"phishing", "transaction", "rugpull"} and part not in valid:
#             valid.append(part)
#     if not valid:
#         valid = ["phishing"]

#     return {**state, "route": valid, "scores": {}, "rationales": {}, "evidence": []}

def supervisor_node(state: VetraState) -> VetraState:
    """Define uma rota fixa linear (phishing -> transaction -> rugpull)."""
    # Garante que sempre siga a sequência completa
    route = ["phishing", "transaction", "rugpull"]
    return {
        **state,
        "route": route,
        "scores": {},
        "rationales": {},
        "evidence": []
    }



# def phishing_agent_node(state: VetraState) -> VetraState:
#     query = state["query"]
#     results = web_scrape(query)
#     snippets = "\n".join([f"- {r.title} | {r.url} | {r.snippet}" for r in results])

#     prompt = f"Analise possível phishing relacionado a: {query}.\nEvidências:\n{snippets}\nAvalie o risco."
#     out = llm.invoke([SYSTEM_PHISHING, HumanMessage(content=prompt)]).content.strip() if llm else "0.2\nSite parece legítimo e usa SSL válido."
#     score = _extract_score(out)
#     rationale = out.split("\n", 1)[1] if "\n" in out else ""

#     state.setdefault("scores", {})["phishing"] = score
#     state.setdefault("rationales", {})["phishing"] = rationale
#     state.setdefault("evidence", []).append(snippets)

#     route = state.get("route", [])
#     if "phishing" in route:
#         route.remove("phishing")
#         state["route"] = route

#     return state

def phishing_agent_node(state: VetraState) -> VetraState:
    query = state["query"]
    results = web_scrape(query)
    snippets = "\n".join([f"- {r.title} | {r.url} | {r.snippet}" for r in results])

    prompt = f"Analise possível phishing relacionado a: {query}.\nEvidências:\n{snippets}\nAvalie o risco."
    out = llm.invoke([SYSTEM_PHISHING, HumanMessage(content=prompt)]).content.strip() if llm else "0.2\nSite parece legítimo e usa SSL válido."
    score = _extract_score(out)
    rationale = out.split("\n", 1)[1] if "\n" in out else ""

    state.setdefault("scores", {})["phishing"] = score
    state.setdefault("rationales", {})["phishing"] = rationale
    state.setdefault("evidence", []).append(snippets)

    return state



# def transaction_agent_node(state: VetraState) -> VetraState:
#     identifier = _first_wallet_or_tx(state["query"]) or "unknown"
#     feats = fetch_private_data(identifier)

#     prompt = f"Analise comportamento on-chain. Dados: {feats}\nForneça SCORE de risco e uma justificativa curta."
#     out = llm.invoke([SYSTEM_TRANSACTION, HumanMessage(content=prompt)]).content.strip() if llm else "0.7\nTransações concentradas em poucas carteiras."
#     score = _extract_score(out)
#     rationale = out.split("\n", 1)[1] if "\n" in out else ""

#     state.setdefault("scores", {})["transaction"] = score
#     state.setdefault("rationales", {})["transaction"] = rationale
#     state.setdefault("evidence", []).append(str(feats))

#     route = state.get("route", [])
#     if "transaction" in route:
#         route.remove("transaction")
#         state["route"] = route

#     return state

def transaction_agent_node(state: VetraState) -> VetraState:
    identifier = _first_wallet_or_tx(state["query"]) or "unknown"
    feats = fetch_private_data(identifier)

    prompt = f"Analise comportamento on-chain. Dados: {feats}\nForneça SCORE de risco e uma justificativa curta."
    out = llm.invoke([SYSTEM_TRANSACTION, HumanMessage(content=prompt)]).content.strip() if llm else "0.7\nTransações concentradas em poucas carteiras."
    score = _extract_score(out)
    rationale = out.split("\n", 1)[1] if "\n" in out else ""

    state.setdefault("scores", {})["transaction"] = score
    state.setdefault("rationales", {})["transaction"] = rationale
    state.setdefault("evidence", []).append(str(feats))

    return state



# def rugpull_agent_node(state: VetraState) -> VetraState:
#     identifier = _first_token(state["query"]) or "tokenX"
#     feats = fetch_private_data(identifier)
#     heuristic = math_estimator(feats)

#     prompt = f"Analise risco de rugpull. Features: {feats}\nHeurística preliminar: {heuristic:.3f}\nForneça SCORE final e justificativa curta."
#     out = llm.invoke([SYSTEM_RUGPULL, HumanMessage(content=prompt)]).content.strip() if llm else "0.9\nLiquidez destrava em breve; risco elevado."
#     score = _extract_score(out)
#     rationale = out.split("\n", 1)[1] if "\n" in out else ""

#     # Combinação simples entre o score do modelo e a heurística para estabilidade
#     score = float(min(1.0, max(0.0, 0.7 * score + 0.3 * heuristic)))

#     state.setdefault("scores", {})["rugpull"] = score
#     state.setdefault("rationales", {})["rugpull"] = rationale
#     state.setdefault("evidence", []).append(str(feats))

#     route = state.get("route", [])
#     if "rugpull" in route:
#         route.remove("rugpull")
#         state["route"] = route

#     return state


def rugpull_agent_node(state: VetraState) -> VetraState:
    identifier = _first_token(state["query"]) or "tokenX"
    feats = fetch_private_data(identifier)
    heuristic = math_estimator(feats)

    prompt = f"Analise risco de rugpull. Features: {feats}\nHeurística preliminar: {heuristic:.3f}\nForneça SCORE final e justificativa curta."
    out = llm.invoke([SYSTEM_RUGPULL, HumanMessage(content=prompt)]).content.strip() if llm else "0.9\nLiquidez destrava em breve; risco elevado."
    score = _extract_score(out)
    rationale = out.split("\n", 1)[1] if "\n" in out else ""

    score = float(min(1.0, max(0.0, 0.7 * score + 0.3 * heuristic)))

    state.setdefault("scores", {})["rugpull"] = score
    state.setdefault("rationales", {})["rugpull"] = rationale
    state.setdefault("evidence", []).append(str(feats))

    return state


# In[33]:


def _extract_score(text: str) -> float:
    """Extrai o valor SCORE (0..1) da primeira linha de texto do agente."""
    first = text.split("\n", 1)[0]
    m = re.search(r"([01](?:\.\d+)?)", first)
    try:
        val = float(m.group(1)) if m else 0.5
    except Exception:
        val = 0.5
    return max(0.0, min(1.0, val))


def _first_wallet_or_tx(q: str) -> Optional[str]:
    m = re.search(r"0x[a-fA-F0-9]{6,}", q)
    return m.group(0) if m else None


def _first_token(q: str) -> Optional[str]:
    m = re.search(r"\b[A-Z]{2,10}\b", q)
    return m.group(0) if m else None




def aggregate_final_score( 
    scores: Dict[str, float],
    weights: Dict[str, float] = None,
    overrides = None
) -> float:
    """
    scores: {"phishing": s_p, "transaction": s_t, "rugpull": s_r} com valores em [0,1].
    Retorna score final em [0,1], monotônico e “puxado para 1” quando há alto risco em um agente.
    """
    weights = weights or DEFAULT_WEIGHTS
    overrides = overrides or OVERRIDES

    # 1) Noisy-OR ponderado
    prod = 1.0
    for k, s in scores.items():
        w = float(weights.get(k, 1.0))
        s_clamped = min(1.0, max(0.0, s))
        term = max(0.0, 1.0 - w * s_clamped)
        prod *= term
    final_score = 1.0 - prod

    # 2) Overrides (short-circuit) para casos críticos
    for k, threshold, floor_value in overrides:
        if scores.get(k, 0.0) >= threshold:
            final_score = max(final_score, floor_value)

    # 3) Clamp final por segurança
    return float(min(1.0, max(0.0, final_score)))

# In[34]:


# def trust_index_node(state: VetraState) -> VetraState:
#     """Agrega os resultados dos agentes e produz um relatório final e valores em JSON."""
#     scores = state.get("scores", {})
#     weights = {"phishing": 0.35, "transaction": 0.30, "rugpull": 0.35}

#     num = sum(weights.get(k, 0.0) * v for k, v in scores.items())
#     den = sum(weights.values())
#     trust_index = num / den if den else 0.0

#     bullets = [f"- {k.title()}: {scores[k]:.3f} — {state['rationales'].get(k, '')}" for k in scores]
#     report = f"VETRA Trust Index: {trust_index:.3f} (0 = seguro, 1 = risco alto)\n\n" + "\n".join(bullets)
#     state["final_report"] = report

#     # JSON estruturado (guardado no estado para exibição posterior)
#     state["final_json"] = {
#         "trust_index": round(trust_index, 3),
#         "scores": {k: round(v, 3) for k, v in scores.items()},
#         "rationales": state.get("rationales", {}),
#         "evidence": state.get("evidence", []),
#         "final_report": report
#     }
#     return state


def trust_index_node(state: VetraState) -> VetraState:
    """Agrega os resultados dos agentes e produz o Trust Index final."""
    scores = state.get("scores", {})
    rationales = state.get("rationales", {})
    evidence = state.get("evidence", [])

    # Calcula índice final com agregador não linear
    trust_index = aggregate_final_score(scores)

    # Relatório legível
    bullets = [f"- {k.title()}: {scores[k]:.3f} — {rationales.get(k, '')}" for k in scores]
    report = f"VETRA Trust Index: {trust_index:.3f} (0 = seguro, 1 = risco alto)\n\n" + "\n".join(bullets)

    # Armazena no estado
    state["final_report"] = report
    state["final_json"] = {
        "trust_index": round(trust_index, 3),
        "scores": {k: round(v, 3) for k, v in scores.items()},
        "rationales": rationales,
        "evidence": evidence,
        "aggregation_model": "Noisy-OR Weighted + Overrides",
        "final_report": report
    }
    return state


# In[35]:


# def build_graph():
#     graph = StateGraph(VetraState)
#     graph.add_node("supervisor", supervisor_node)
#     graph.add_node("phishing", phishing_agent_node)
#     graph.add_node("transaction", transaction_agent_node)
#     graph.add_node("rugpull", rugpull_agent_node)
#     graph.add_node("trust_index", trust_index_node)

#     graph.set_entry_point("supervisor")

#     def choose_next(state: VetraState):
#         route = state.get("route", [])
#         if not route:
#             return "trust_index"
#         nxt = route.pop(0)
#         state["route"] = route
#         return nxt

#     def route_after_agent(state: VetraState):
#         route = state.get("route", [])
#         if not route:
#             return "trust_index"
#         return "supervisor"

#     graph.add_conditional_edges("supervisor", choose_next, {
#         "phishing": "phishing",
#         "transaction": "transaction", 
#         "rugpull": "rugpull",
#         "trust_index": "trust_index",
#     })

#     for node in ["phishing", "transaction", "rugpull"]:
#         graph.add_conditional_edges(node, route_after_agent, {
#             "supervisor": "supervisor",
#             "trust_index": "trust_index"
#         })

#     graph.add_edge("trust_index", END)
#     return graph.compile()

def build_graph():
    graph = StateGraph(VetraState)
    graph.add_node("supervisor", supervisor_node)
    graph.add_node("phishing", phishing_agent_node)
    graph.add_node("transaction", transaction_agent_node)
    graph.add_node("rugpull", rugpull_agent_node)
    graph.add_node("trust_index", trust_index_node)

    graph.set_entry_point("supervisor")

    # Rota fixa: sempre segue a sequência completa
    graph.add_edge("supervisor", "phishing")
    graph.add_edge("phishing", "transaction")
    graph.add_edge("transaction", "rugpull")
    graph.add_edge("rugpull", "trust_index")

    graph.add_edge("trust_index", END)

    return graph.compile()

# In[36]:


# app = build_graph()

# # Exemplo de consulta 
# consulta = "Analise o token ABC 0x1234567890 e verifique risco de rugpull e phishing."

# resultado = app.invoke({"query": consulta})

# # Exibir relatório legível
# print("--------- RELATÓRIO FINAL ---------")
# print(resultado.get("final_report", "(nenhum relatório gerado)"))
# print("-----------------------------------\n")

# # Exibir JSON estruturado
# final_json = resultado.get("final_json", {})
# print("--------- SAÍDA JSON ---------")
# print(json.dumps(final_json, ensure_ascii=False, indent=2))
# print("--------------------------------")


# 
