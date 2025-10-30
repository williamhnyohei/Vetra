
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


# # ---------------------------------------------------
# # ENDPOINT PRINCIPAL /api/analyze
# # ---------------------------------------------------
# @app.post("/api/analyze")
# async def analyze_transaction(req: Request, data: TransactionInput):
#     """
#     Realiza análise de risco multiagente.
#     Compatível com o serviço Node.js (INPUT_SCHEMA / OUTPUT_SCHEMA)
#     """

#     # --- autenticação opcional ---
#     if os.getenv("DISABLE_AUTH", "false").lower() != "true":
#         api_key = req.headers.get("X-API-Key")
#         if API_KEY and api_key != API_KEY:
#             print(f" Chave inválida recebida: {api_key}")
#             raise HTTPException(status_code=401, detail="Invalid API Key")

#     start_time = time.time()
#     tx = data.transaction

#     # --- construir prompt / consulta principal ---
#     query = (
#         f"Analise o token {tx.get('token_symbol', '')} {tx.get('token_address', '')} "
#         f"da transação de {tx.get('from_address')} para {tx.get('to_address')} "
#         f"no valor de {tx.get('amount')}. Tipo: {tx.get('type')}."
#     )

#     # --- invocar grafo LangGraph ---
#     result = graph.invoke({"query": query})
#     final = result.get("final_json", {})

#     risk_index = final.get("trust_index", 0)
#     level = "low" if risk_index < 0.33 else "medium" if risk_index < 0.66 else "high"

#     # ===========================================================
#     # MAPEAR SAÍDA PARA O OUTPUT_SCHEMA DO NODE.JS
#     # ===========================================================

#     # risk_assessment
#     risk_assessment = {
#         "score": int(round(risk_index * 100)),
#         "level": level,
#         "confidence": 0.9
#     }

#     # agent_analysis → renomeado conforme padrão do Node
#     agent_analysis = {
#         "token_agent": {  # rugpull
#             "score": int(round(final.get("scores", {}).get("rugpull", 0) * 100)),
#             "findings": [final.get("rationales", {}).get("rugpull", "")],
#             "severity": _severity(final.get("scores", {}).get("rugpull", 0))
#         },
#         "address_agent": {  # transaction
#             "score": int(round(final.get("scores", {}).get("transaction", 0) * 100)),
#             "findings": [final.get("rationales", {}).get("transaction", "")],
#             "severity": _severity(final.get("scores", {}).get("transaction", 0))
#         },
#         "pattern_agent": {  # phishing
#             "score": int(round(final.get("scores", {}).get("phishing", 0) * 100)),
#             "findings": [final.get("rationales", {}).get("phishing", "")],
#             "severity": _severity(final.get("scores", {}).get("phishing", 0))
#         },
#         # placeholders opcionais para expansão futura
#         "network_agent": {
#             "score": 0,
#             "findings": ["Network-level agent not yet implemented"],
#             "severity": "low"
#         },
#         "ml_agent": {
#             "score": 0,
#             "prediction": "N/A",
#             "confidence": 0.0
#         }
#     }

#     # risk_factors
#     risk_factors = [
#         {
#             "factor": name,
#             "severity": _severity(score),
#             "description": final.get("rationales", {}).get(name, ""),
#             # "weight": _weight(name)
#         }
#         for name, score in final.get("scores", {}).items()
#     ]

#     # recommendations
#     recommendations = {
#         "action": "block" if level == "high" else "review" if level == "medium" else "approve",
#         "reason": f"Overall trust index {risk_index:.2f} ({level} risk)",
#         "alternative_actions": ["manual_review", "further_verification"]
#     }

#     # evidence
#     evidence = {
#         "on_chain_data": data.context,  # pode ser usado futuramente
#         "historical_patterns": {},
#         "external_sources": final.get("evidence", [])
#     }

#     # metadata
#     metadata = {
#         "analysis_duration_ms": int((time.time() - start_time) * 1000),
#         "agents_used": list(final.get("scores", {}).keys()),
#         "data_sources": ["LangGraph", "Google Gemini"],
#         "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
#         "version": VERSION
#     }

#     # resposta final no formato do OUTPUT_SCHEMA
#     response = {
#         "risk_assessment": risk_assessment,
#         "agent_analysis": agent_analysis,
#         "risk_factors": risk_factors,
#         "recommendations": recommendations,
#         "evidence": evidence,
#         "metadata": metadata
#     }

#     return response

# @app.post("/api/analyze")
# async def analyze_transaction(req: Request, data: TransactionInput):
#     """
#     Realiza análise de risco multiagente.
#     Agora o grafo LangGraph/LLM já retorna o JSON completo formatado.
#     """

#     # --- autenticação opcional ---
#     if os.getenv("DISABLE_AUTH", "false").lower() != "true":
#         api_key = req.headers.get("X-API-Key")
#         if API_KEY and api_key != API_KEY:
#             print(f" Chave inválida recebida: {api_key}")
#             raise HTTPException(status_code=401, detail="Invalid API Key")

#     start_time = time.time()
#     tx = data.transaction

#     # --- construir prompt principal (consulta base) ---
#     query = (
#         f"Analise o token {tx.get('token_symbol', '')} {tx.get('token_address', '')} "
#         f"da transação de {tx.get('from_address')} para {tx.get('to_address')} "
#         f"no valor de {tx.get('amount')}. Tipo: {tx.get('type')}."
#     )

#     # --- invocar grafo LangGraph ---
#     result = graph.invoke({
#         "query": query,
#         "context": data.context,
#         "preferences": data.preferences
#     })

#     # A LLM já retorna tudo formatado (inclusive nested JSON)
#     final_json = result.get("final_json") or result.get("output") or result

#     # --- segurança mínima: tentar converter string JSON em dict, se necessário ---
#     if isinstance(final_json, str):
#         import json
#         try:
#             final_json = json.loads(final_json)
#         except json.JSONDecodeError:
#             logging.warning("A saída do modelo não é JSON puro — retornando texto cru.")
#             return {"raw_output": final_json}

#     # --- metadados adicionais opcionais ---
#     final_json["metadata"] = final_json.get("metadata", {})
#     final_json["metadata"].update({
#         "analysis_duration_ms": int((time.time() - start_time) * 1000),
#         "version": VERSION
#     })

#     return final_json

# @app.post("/api/analyze")
# async def analyze_transaction(req: Request, data: TransactionInput):
#     """
#     Executa a análise multiagente com a LLM e retorna o JSON completo no formato OUTPUT_SCHEMA.
#     Nenhum valor é mockado — o que não vier da LLM é retornado vazio/nulo.
#     """
#     import json
#     start_time = time.time()

#     # --- Autenticação opcional ---
#     if os.getenv("DISABLE_AUTH", "false").lower() != "true":
#         api_key = req.headers.get("X-API-Key")
#         if API_KEY and api_key != API_KEY:
#             raise HTTPException(status_code=401, detail="Invalid API Key")

#     # --- Construir prompt ---
#     tx = data.transaction
#     query = (
#         f"Analise o token {tx.get('token_symbol', '')} {tx.get('token_address', '')} "
#         f"da transação de {tx.get('from_address')} para {tx.get('to_address')} "
#         f"no valor de {tx.get('amount')}. Tipo: {tx.get('type')}."
#     )

#     # --- Invocar grafo ---
#     result = graph.invoke({
#         "query": query,
#         "context": data.context,
#         "preferences": data.preferences
#     })

#     final = result.get("final_json") or result.get("output") or result

#     # ---------------------------------------------------------
#     # Funções utilitárias para parsing de JSON embutido em string
#     # ---------------------------------------------------------
#     def try_parse_json(value):
#         if isinstance(value, str):
#             v = value.strip().strip('```')
#             if (v.startswith("{") and v.endswith("}")) or (v.startswith("[") and v.endswith("]")):
#                 try:
#                     return json.loads(v)
#                 except:
#                     try:
#                         return json.loads(v.replace("'", '"'))
#                     except:
#                         return value
#         return value

#     def deep_parse(obj):
#         if isinstance(obj, dict):
#             return {k: deep_parse(try_parse_json(v)) for k, v in obj.items()}
#         elif isinstance(obj, list):
#             return [deep_parse(try_parse_json(i)) for i in obj]
#         else:
#             return obj

#     final = deep_parse(final)

#     # ---------------------------------------------------------
#     # Montar estrutura do OUTPUT_SCHEMA
#     # ---------------------------------------------------------
#     trust_index = final.get("trust_index")
#     scores = final.get("scores", {})
#     rationales = final.get("rationales", {})
#     evidence = final.get("evidence", [])
#     metadata = final.get("metadata", {})
#     aggregation_model = final.get("aggregation_model", "")
#     final_report = final.get("final_report", "")

#     def _severity(score):
#         if not isinstance(score, (int, float)):
#             return ""
#         return "low" if score < 0.33 else "medium" if score < 0.66 else "high"

#     # --- Estrutura de saída conforme OUTPUT_SCHEMA ---
#     response = {
#         "risk_assessment": {
#             "score": trust_index,
#             "level": _severity(trust_index) if trust_index is not None else "",
#             "confidence": None,
#         },
#         "agent_analysis": {
#             "token_agent": {
#                 "score": scores.get("rugpull"),
#                 "findings": [rationales.get("rugpull")] if rationales.get("rugpull") else [],
#                 "severity": _severity(scores.get("rugpull")) if scores.get("rugpull") else "",
#             },
#             "address_agent": {
#                 "score": scores.get("transaction"),
#                 "findings": [rationales.get("transaction")] if rationales.get("transaction") else [],
#                 "severity": _severity(scores.get("transaction")) if scores.get("transaction") else "",
#             },
#             "pattern_agent": {
#                 "score": scores.get("phishing"),
#                 "findings": [rationales.get("phishing")] if rationales.get("phishing") else [],
#                 "severity": _severity(scores.get("phishing")) if scores.get("phishing") else "",
#             },
#             "network_agent": {
#                 "score": None,
#                 "findings": [],
#                 "severity": "",
#             },
#             "ml_agent": {
#                 "score": None,
#                 "prediction": "",
#                 "confidence": None,
#             },
#         },
#         "risk_factors": [],
#         "recommendations": {
#             "action": "",
#             "reason": "",
#             "alternative_actions": [],
#         },
#         "evidence": {
#             "on_chain_data": data.context or {},
#             "historical_patterns": {},
#             "external_sources": evidence or [],
#         },
#         "metadata": {
#             "analysis_duration_ms": int((time.time() - start_time) * 1000),
#             "agents_used": list(scores.keys()) if scores else [],
#             "data_sources": ["LangGraph", "Google Gemini"],
#             "timestamp": metadata.get("timestamp", ""),
#             "version": metadata.get("version", VERSION),
#         },
#         "aggregation_model": aggregation_model,
#         "final_report": final_report,
#     }

#     return response



@app.post("/api/analyze")
async def analyze_transaction(req: Request, data: TransactionInput):
    """
    Executa a análise multiagente com a LLM e retorna o JSON completo no formato OUTPUT_SCHEMA.
    Nenhum valor é mockado — o índice global é usado só no risk_assessment.
    Os scores de agentes vêm exatamente como retornados pelo modelo.
    """
    import json
    start_time = time.time()

    # --- Autenticação opcional ---
    if os.getenv("DISABLE_AUTH", "false").lower() != "true":
        api_key = req.headers.get("X-API-Key")
        if API_KEY and api_key != API_KEY:
            raise HTTPException(status_code=401, detail="Invalid API Key")

    # --- Construir prompt ---
    tx = data.transaction
    query = (
        f"Analise o token {tx.get('token_symbol', '')} {tx.get('token_address', '')} "
        f"da transação de {tx.get('from_address')} para {tx.get('to_address')} "
        f"no valor de {tx.get('amount')}. Tipo: {tx.get('type')}."
    )

    # --- Invocar grafo ---
    result = graph.invoke({
        "query": query,
        "context": data.context,
        "preferences": data.preferences
    })

    final = result.get("final_json") or result.get("output") or result

    # ---------------------------------------------------------
    # Parsing de strings JSON dentro de campos textuais
    # ---------------------------------------------------------
    def try_parse_json(value):
        if isinstance(value, str):
            v = value.strip()
            # remover cercas de código simples
            if v.startswith('```'):
                v = v.strip('`')
            # remover aspas exteriores se envolverem o JSON
            if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                v = v[1:-1]
            v = v.strip()
            # tentativa direta
            if (v.startswith("{") and v.endswith("}")) or (v.startswith("[") and v.endswith("]")):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            # substituir aspas simples por duplas e tentar de novo
            try:
                v2 = v.replace("'", '"')
                if (v2.startswith("{") and v2.endswith("}")) or (v2.startswith("[") and v2.endswith("]")):
                    return json.loads(v2)
            except Exception:
                pass
            # heurística: extrair primeiro bloco JSON entre chaves equilibradas
            try:
                start = v.find('{')
                end = v.rfind('}')
                if start != -1 and end != -1 and end > start:
                    candidate = v[start:end+1]
                    return json.loads(candidate)
            except Exception:
                pass
            return value
        return value

    def deep_parse(obj):
        if isinstance(obj, dict):
            return {k: deep_parse(try_parse_json(v)) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [deep_parse(try_parse_json(i)) for i in obj]
        else:
            return obj

    final = deep_parse(final)

    # ---------------------------------------------------------
    # Extrair dados principais
    # ---------------------------------------------------------
    trust_index = final.get("trust_index")
    scores = final.get("scores", {})
    rationales = final.get("rationales", {})
    evidence = final.get("evidence", [])
    metadata = final.get("metadata", {})
    aggregation_model = final.get("aggregation_model", "")
    final_report = final.get("final_report", "")

    # ---------------------------------------------------------
    # Extrair scores internos de cada agente (do JSON dentro das rationales)
    # ---------------------------------------------------------
    def get_agent_block(factor):
        # mapeia o fator para o nome do bloco de agente retornado pelo modelo
        factor_to_agent_key = {
            "phishing": "phishing_agent",
            "transaction": "transaction_agent",
            "rugpull": "rugpull_agent",
        }
        agent_key = factor_to_agent_key.get(factor)
        rationale = rationales.get(factor)
        if isinstance(rationale, dict):
            return rationale.get("agent_analysis", {}).get(agent_key, {})
        return {}

    def get_agent_score_0_1(factor):
        block = get_agent_block(factor)
        score = block.get("score")
        try:
            return float(score) if score is not None else None
        except Exception:
            return None

    def get_agent_severity(factor):
        block = get_agent_block(factor)
        return block.get("severity", "") if isinstance(block, dict) else ""

    def get_agent_findings(factor):
        block = get_agent_block(factor)
        findings = block.get("findings", []) if isinstance(block, dict) else []
        # Garantir array de strings
        if isinstance(findings, list):
            return [str(item) for item in findings]
        return [str(findings)] if findings else []

    def severity_from_score(score01):
        if not isinstance(score01, (int, float)):
            return ""
        return "low" if score01 < 0.33 else "medium" if score01 < 0.66 else "high"

    def build_agent_entry(factor: str) -> Dict[str, Any]:
        block = get_agent_block(factor)
        # score: preferir do bloco; senão, fallback para scores[factor]
        score01 = None
        if isinstance(block, dict) and isinstance(block.get("score"), (int, float)):
            score01 = float(block.get("score"))
        elif isinstance(scores.get(factor), (int, float)):
            score01 = float(scores.get(factor))

        # findings: usar do bloco; senão, texto de rationale se for string
        findings = get_agent_findings(factor)
        if not findings and isinstance(rationales.get(factor), str):
            findings = [rationales.get(factor)]

        # severity: usar do bloco; senão, derivar do score
        severity = ""
        if isinstance(block, dict) and isinstance(block.get("severity"), str):
            severity = block.get("severity", "")
        elif isinstance(score01, (int, float)):
            severity = severity_from_score(score01)

        return {
            "score": int(round(score01 * 100)) if isinstance(score01, (int, float)) else None,
            "findings": findings,
            "severity": severity,
        }

    def get_factor_severity_description(factor: str) -> Dict[str, Any]:
        sev = ""
        desc = ""
        rat = rationales.get(factor)
        if isinstance(rat, dict):
            sev = rat.get("severity", "") or sev
            desc = rat.get("description", "") or desc
        elif isinstance(rat, str):
            parsed = try_parse_json(rat)
            if isinstance(parsed, dict):
                sev = parsed.get("severity", "") or sev
                desc = parsed.get("description", "") or desc
        return {"severity": sev, "description": desc}

    def extract_embedded_risk_factors() -> List[Dict[str, Any]]:
        collected: List[Dict[str, Any]] = []
        seen = set()
        for factor in ["rugpull", "transaction", "phishing"]:
            rat = rationales.get(factor)
            parsed = try_parse_json(rat) if isinstance(rat, str) else rat
            if isinstance(parsed, dict) and isinstance(parsed.get("risk_factors"), list):
                for item in parsed.get("risk_factors"):
                    if not isinstance(item, dict):
                        continue
                    f = str(item.get("factor", factor) or factor)
                    sev = str(item.get("severity", ""))
                    desc = str(item.get("description", ""))
                    key = (f, sev, desc)
                    if key in seen:
                        continue
                    seen.add(key)
                    collected.append({
                        "factor": f,
                        "severity": sev,
                        "description": desc,
                    })
        return collected

    def ensure_all_factors_have_entries(base_items: List[Dict[str, Any]], agent_analysis_map: Dict[str, Any]) -> List[Dict[str, Any]]:
        factor_to_agent = {
            "phishing": "phishing_agent",
            "transaction": "transaction_agent",
            "rugpull": "rugpull_agent",
        }
        present = {it.get("factor"): it for it in base_items}
        for factor in ["rugpull", "transaction", "phishing"]:
            if factor not in present or not (present[factor].get("severity") or present[factor].get("description")):
                agent_key = factor_to_agent[factor]
                agent_entry = agent_analysis_map.get(agent_key, {})
                sev = str(agent_entry.get("severity", ""))
                findings_list = agent_entry.get("findings", []) if isinstance(agent_entry.get("findings"), list) else []
                desc = ", ".join(findings_list[:3]) if findings_list else ""
                present[factor] = {"factor": factor, "severity": sev, "description": desc}
        return [present[f] for f in ["rugpull", "transaction", "phishing"]]

    def clean_report_text(text: str) -> str:
        if not isinstance(text, str):
            return ""
        t = text
        while "```" in t:
            start = t.find("```")
            end = t.find("```", start + 3)
            if end == -1:
                t = t.replace("```", "")
                break
            t = t[:start] + t[end+3:]
        cleaned_lines = []
        for line in t.splitlines():
            if '{' in line and '}' in line and (line.count('{') + line.count('}')) > 2:
                a = line.find('{')
                b = line.rfind('}')
                line = line[:a].rstrip() + line[b+1:]
            cleaned_lines.append(line)
        return "\n".join(cleaned_lines).strip()

    # ---------------------------------------------------------
    # Montar resposta no formato OUTPUT_SCHEMA
    # ---------------------------------------------------------
    agent_map = {
        "rugpull_agent": build_agent_entry("rugpull"),
        "transaction_agent": build_agent_entry("transaction"),
        "phishing_agent": build_agent_entry("phishing"),
    }

    response = {
        "risk_assessment": {
            "score": int(round(trust_index * 100)) if isinstance(trust_index, (int, float)) else None,
            "level": "low" if trust_index and trust_index < 0.33 else
                     "medium" if trust_index and trust_index < 0.66 else
                     "high" if trust_index is not None else "",
            "confidence": metadata.get("confidence", 0.8),
        },
        "agent_analysis": agent_map,
        "risk_factors": (lambda:
            (
                (lambda base_items, extra_items:
                    extra_items if extra_items else (
                        (lambda merged:
                            [
                                {"factor": f, "severity": v.get("severity", ""), "description": v.get("description", "")}
                                for f, v in merged.items()
                            ]
                        )(
                            (lambda merged:
                                (
                                    [merged.__setitem__(it["factor"], {
                                        "severity": it.get("severity", "") or merged.get(it["factor"], {}).get("severity", ""),
                                        "description": it.get("description", "") or merged.get(it["factor"], {}).get("description", ""),
                                    }) or merged for it in extra_items]
                                ) and merged
                            )({
                                it["factor"]: {"severity": it.get("severity", ""), "description": it.get("description", "")}
                                for it in ensure_all_factors_have_entries(base_items, agent_map)
                            })
                        )
                    )
                )(
                    [
                        (lambda f, sd: {"factor": f, "severity": sd["severity"], "description": sd["description"]})(
                            factor, get_factor_severity_description(factor)
                        )
                        for factor in ["rugpull", "transaction", "phishing"]
                    ],
                    extract_embedded_risk_factors()
                )
            )
        )(),
        "recommendations": {
            "action": (
                "block" if (trust_index is not None and trust_index >= 0.66) else
                "review" if (trust_index is not None and trust_index >= 0.33) else
                "approve" if trust_index is not None else ""
            ),
            "reason": (
                f"Overall trust index {trust_index:.2f}"
                if isinstance(trust_index, (int, float)) else ""
            ),
            "alternative_actions": ["manual_review", "further_verification"],
        },
        "evidence": {
            "on_chain_data": data.context or {},
            "historical_patterns": {},
            "external_sources": evidence or [],
        },
        "metadata": {
            "analysis_duration_ms": int((time.time() - start_time) * 1000),
            "agents_used": list(scores.keys()) if scores else [],
            "data_sources": ["LangGraph", "Google Gemini"],
            "timestamp": metadata.get("timestamp", ""),
            "version": metadata.get("version", VERSION),
        },
        "aggregation_model": aggregation_model,
        "final_report": clean_report_text(final_report),
    }

    return response
