import re
from typing import Dict, List, Optional
from vetra.schema import WebResult
from vetra.config import DEFAULT_WEIGHTS, OVERRIDES

def web_scrape(query: str) -> List[WebResult]:
    """substituir por coisas reais"""
    return [
        WebResult(title="Token X – Site Oficial", url="https://example.com", snippet="Contrato auditado e liquidez travada?"),
        WebResult(title="Discussão em Fórum", url="https://forum.example/x", snippet="Relatos de possíveis problemas antigos.")
    ]

def fetch_private_data(identifier: str) -> Dict:
    """apenas simulcao, precisa substituir por coisas reais"""
    return {
        "identifier": identifier,
        "holders_top10": 0.76,
        "lp_locked_days": 2,
        "tx_velocity": 1.8,
        "age_days": 11,
    }


def math_estimator(features: Dict) -> float:
    """calculo heurístico simples de risco (0..1), precisa substituir por algo mais sofisticado"""
    risk = 0.0
    risk += min(1.0, features.get("holders_top10", 0) * 0.8)
    risk += 0.2 if features.get("lp_locked_days", 0) < 7 else 0.0
    risk += 0.1 if features.get("age_days", 0) < 14 else 0.0
    return max(0.0, min(1.0, risk))


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


