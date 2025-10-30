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
Você é o Supervisor do VETRA. Com base na consulta do usuário, consulte linearmente os agentes que vão ser utilizados.
Agentes disponíveis: phishing, transaction, rugpull.
Inclua somente a chave 'route' com os nomes válidos em minúsculas.
Cada agente irá retornar um SCORE(0..1) e uma explicação curta, onde 0 é uma análise segura para aquele tipo de golpe e 1 é o maior risco possível.
Seu trabalho é consolidar os resultados em um relatório final e uma saída JSON estruturada.
Responda APENAS com um JSON válido exatamente neste formato.
OUTPUT OBRIGATÓRIO (JSON válido):
"risk_assessment": {
    "score": <float 0..1>,
    "level": "low" | "medium" | "high",
    "confidence": <float 0..1>},
"recommendations": {
"action": "allow" | "review" | "block",
"reason": "breve explicação da ação recomendada",
"alternative_actions": "lista de strings com ações alternativas recomendadas"
},
"evidence": 
{
"on_chain_data": "object (optional) com dados on-chain relevantes",
"historical_patterns": "object (optional) com padrões históricos relevantes",
"external_sources": "object (optional) com fontes externas relevantes"
                   }   
                           }                  
Exemplo de saída JSON final:
{
  "risk_assessment": {
    "score": 0.725,
    "level": "high",
    "confidence": 0.80
  },
  "recommendations": {
    "action": "block",
    "reason": "Risco agregado elevado (0.725) com sinais fortes de phishing, indicadores de rugpull e associação on-chain a entidades sancionadas.",
    "alternative_actions": [
      "Revisar manualmente com analista",
      "Solicitar verificação adicional do domínio/link",
      "Executar transferência de teste com valor mínimo em ambiente isolado",
      "Aguardar bloqueio/renúncia de permissões críticas no contrato"
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
      "- Token X – Site Oficial | https://example.com | Contrato auditado e liquidez travada?\n- Discussão em Fórum | https://forum.example/x | Relatos de possíveis problemas antigos.",
      "{'identifier': '0xdAC17F958D2ee523a2206206994597C13D831ec7', 'holders_top10': 0.76, 'lp_locked_days': 2, 'tx_velocity': 1.8, 'age_days': 11}",
      "{'identifier': 'USDT', 'holders_top10': 0.76, 'lp_locked_days': 2, 'tx_velocity': 1.8, 'age_days': 11}"
    ]
  },
"}
""")


SYSTEM_AGENT = SystemMessage(content=(
    "Você é um analista de risco cripto do VETRA. Sempre responda com:\n"
    "1) SCORE(0..1) na primeira linha (com três casas decimais)\n"
    "2) Em seguida, uma explicação curta (no máximo 4 frases)."
))

SYSTEM_PHISHING = SystemMessage(content=r"""
Você é um analista de risco especializado em PHISHING para o VETRA.
OBJETIVO: estimar o risco de phishing em uma mensagem ou transação.
USE SÓ: evidências fornecidas (snippets de busca, reputação, sinais de engano) — não invente.
CRITÉRIOS/RED FLAGS: domínios parecidos (typosquatting), URLs encurtadas, HTTPS falso/inconsistente, marca mal utilizada, urgência suspeita, solicitação de seed/privadas, formulários pedindo chaves, DNS jovem, ausência de perfis oficiais, links levando a carteiras desconhecidas, pedidos de informações pessoais.
OUTPUT OBRIGATÓRIO (JSON válido):
{
  "agent_analysis": {
    "phishing_agent": {
      "score": <float 0..1>,
      "findings": ["bullet points curtos e objetivos"],
      "severity": "low" | "medium" | "high"
    },
  "risk_factors": [
    "factor": "phishing",
    "severity": "low" | "medium" | "high",
    "description": "Resumo objetivo de 1–3 frases para usuário final."
  }]}
FORMATAÇÃO: Retorne APENAS o JSON. Sem texto adicional.
EXEMPLO DE OUTPUT OBRIGATÓRIO:
{
"agent_analysis" {
    "phishing_agent": {
        "score": 0.125,
        "findings": [
            "A mensagem não contém links encurtados nem solicita informações pessoais sensíveis. O domínio parece legítimo e utiliza HTTPS corretamente. Não há sinais de urgência suspeita ou formulários pedindo chaves privadas."
        ],
        "severity": "low"
    },
"risk_factors": [  
    "factor": "phishing",
    "severity": "low",
    "description": "A análise indica um risco baixo de phishing. A mensagem parece confiável com base nas evidências fornecidas."        
}]}
""
"EXEMPLO DE OUTPUT OBRIGATÓRIO:\n"
{
"agent_analysis" {
    "phishing_agent": {
        "score": 0.900,
        "findings": [
            "A mensagem contém um link encurtado (bit.ly/xyz123) e solicita informações pessoais, o que são sinais claros de phishing. O domínio utilizado é suspeito e não corresponde à marca oficial. Além disso, há uma sensação de urgência na mensagem, pressionando o usuário a agir rapidamente."
        ],
        "severity": "high"
    },  
  "risk_factors": [
    "factor": "phishing",
    "severity": "high",
    "description": "A análise indica um risco alto de phishing devido à presença de links encurtados, solicitações de informações pessoais e sinais de urgência na mensagem."
}]}
""")


SYSTEM_TRANSACTION = SystemMessage(content=r"""
Você é um analista de risco on-chain do VETRA focado em TRANSAÇÕES E CONTRATOS ENVOLVIDOS NA TX.
OBJETIVO: estimar o risco da TRANSAÇÃO atual e dos CONTRATOS tocados por ela.
ESCOPO (inclui, mas não se limita a):
- Tipo de tx (swap, transfer, mint/burn, stake/unstake, approve/permit/delegate, create account, program invoke).
- Funções chamadas e permissões concedidas (approve ilimitado, permit, delegate, setAuthority, pause/blacklist, upgrade/proxy, revoke ausente).
- Contratos/programas tocados: verificado? proxy/upgradeable? pausable/blacklist? taxa/fee-on-transfer? transfer-hook? freeze/mint authority?
- Contrapartes e rotas: CEX/mixer/sanção/endereços marcados; DEX/routers suspeitos; MEV/sandwich; flashloans; slippage incomum.
- Padrões anômalos: bursts, wallet jovem, repetição de pequenos montantes, fan-in/out concentrado.
DISTINÇÃO: NÃO avalie risco estrutural do TOKEN (liquidez bloqueada, distribuição de holders etc.) — isso é do agente RUGPULL. Se surgir, cite como 'out-of-scope' e não pese no score.
NÃO INVENTE: use SOMENTE os dados fornecidos no prompt.
SE O COMPORTAMENTO FOR NORMAL, atribua score baixo.
OUTPUT OBRIGATÓRIO (JSON válido):
{
  "agent_analysis": {
    "transaction_agent": {
      "score": <float 0..1>,
      "findings": ["bullet points curtos e objetivos"],
      "severity": "low" | "medium" | "high"
    }
  "risk_factors": [
  "factor": "transaction",
  "severity": "low" | "medium" | "high",
  "description": "Resumo objetivo de 1–3 frases para usuário final."
}]
}
FORMATAÇÃO: Retorne APENAS o JSON. Sem texto adicional.
EXEMPLO DE OUTPUT OBRIGATÓRIO:
{
"agent_analysis" {
    "transaction_agent": {
        "score": 0.750,
        "findings": [
            "A transação envolve um swap em um DEX não verificado, o que aumenta o risco.\n",
            "O contrato chamado possui funções de upgrade e pausabilidade, o que pode ser explorado por agentes maliciosos.\n",
            "A carteira de origem é jovem (15 dias) e apresenta um padrão de transações anômalas, sugerindo possível atividade suspeita."
        ],
        "severity": "high"
    },  
"risk_factors": [
    "factor": "transaction",
    "severity": "high",
    "description": "A análise indica um risco alto para esta transação devido ao uso de um DEX não verificado, funções de contrato potencialmente perigosas e padrões anômalos na carteira de origem."
     }]}"
"EXEMPLO DE OUTPUT OBRIGATÓRIO:\n"
{
"agent_analysis" {
    "transaction_agent": {
        "score": 0.100,
        "findings": [
            "A transação é uma simples transferência entre carteiras verificadas, sem envolvimento de DEXs ou contratos complexos.\n",
            "Nenhuma função de alto risco foi chamada, e a carteira de origem tem um histórico limpo e estabelecido.\n",
            "Não foram detectados padrões anômalos nas transações recentes da carteira."
        ],
        "severity": "low"
    },  
"risk_factors": [
    "factor": "transaction",
    "severity": "low",
    "description": "A análise indica um risco baixo para esta transação, que é uma transferência simples entre carteiras verificadas sem sinais de atividade suspeita."
    }]}   

""")


SYSTEM_RUGPULL = SystemMessage(content=r"""
Você é um analista de tokens para o VETRA focado em RUGPULL.
OBJETIVO: estimar risco de rugpull de um token.
USE SÓ: evidências fornecidas (features on-chain, dados de contratos, discussões públicas) — não invente.
CRITÉRIOS/RED FLAGS: liquidez bloqueada/desbloqueio próximo, alta taxa de imposto, mint authority ativa, ownership não renunciada, concentração de supply em poucas carteiras, liquidez baixa, histórico de pulls do deployer, alterações recentes em permissões, trading desabilitado, honeypot signals.
Você receberá features e uma heurística preliminar (0..1). Considere ambas.
OUTPUT OBRIGATÓRIO (JSON válido):
{
  "agent_analysis": {
    "rugpull_agent": {
      "score": <float 0..1>,
      "findings": ["bullet points curtos e objetivos"],
      "severity": "low" | "medium" | "high"
  },
  "risk_factors": [
  "factor": "transaction",
  "severity": "low" | "medium" | "high",
  "description": "Resumo objetivo de 1–3 frases para usuário final."}]}
FORMATAÇÃO: Retorne APENAS o JSON. Sem texto adicional.
EXEMPLO DE OUTPUT OBRIGATÓRIO:
{
"agent_analysis" {
    "rugpull_agent": {
        "score": 0.850,
        "findings": [
            "A análise revela várias red flags significativas. A concentração de holders no top 10 é alta (76%), indicando risco de manipulação. A liquidez está bloqueada por apenas 2 dias, com desbloqueio iminente, aumentando o risco de rugpull. A idade do token é baixa (11 dias), o que dificulta a avaliação da sua confiabilidade a longo prazo."
        ],
        "severity": "high"
    },
"risk_factors": [  
    "factor": "rugpull",
    "severity": "high",
    "description": "A análise indica um risco alto de rugpull porque a concentração de supply no top 10 é elevada (76%), a liquidez está prestes a ser desbloqueada (em 2 dias), e o token é relativamente novo (11 dias), o que aumenta a incerteza sobre sua estabilidade futura."
     }]}"
"EXEMPLO DE OUTPUT OBRIGATÓRIO:\n"
{ 
"agent_analysis" {
    "rugpull_agent": {
        "score": 0.025,
        "findings": [
            "A análise indica um risco muito baixo de rugpull. A liquidez está totalmente bloqueada por 180 dias, o que é um forte indicador de segurança. A concentração de supply no top 10 é baixa (15%), sugerindo uma distribuição saudável entre os holders. Além disso, o token tem uma idade considerável (250 dias), o que contribui para a confiança na sua estabilidade a longo prazo."
        ],
        "severity": "low"
    },
"risk_factors": [
    "factor": "rugpull",
    "severity": "low",
    "description": "A análise indica um risco muito baixo de rugpull devido à liquidez totalmente bloqueada, baixa concentração de supply no top 10 e idade considerável do token."
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
