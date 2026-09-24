"""
On-chain / external tools for Vetra MAS agents.
Uses Solana JSON-RPC and optional Solscan public API.
"""

from __future__ import annotations

import os
import re
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass

import urllib.request
import urllib.error
import json

logger = logging.getLogger(__name__)

SOLANA_RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
SOLSCAN_API_BASE = os.getenv("SOLSCAN_API_BASE", "https://public-api.solscan.io")

# Optional package-style imports with flat-folder fallback
try:
    from schema import WebResult  # type: ignore
except ImportError:
    try:
        from vetra.schema import WebResult  # type: ignore
    except ImportError:
        @dataclass
        class WebResult:
            title: str
            url: str
            snippet: str

try:
    from config import DEFAULT_WEIGHTS, OVERRIDES  # type: ignore
except ImportError:
    try:
        from vetra.config import DEFAULT_WEIGHTS, OVERRIDES  # type: ignore
    except ImportError:
        DEFAULT_WEIGHTS = {"phishing": 0.95, "transaction": 0.75, "rugpull": 0.85}
        OVERRIDES = [
            ("phishing", 0.90, 0.98),
            ("rugpull", 0.90, 0.95),
            ("transaction", 0.90, 0.95),
        ]


def _rpc(method: str, params: list) -> Optional[dict]:
    payload = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    req = urllib.request.Request(
        SOLANA_RPC_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            body = json.loads(resp.read().decode())
            return body.get("result")
    except Exception as e:
        logger.warning("Solana RPC %s failed: %s", method, e)
        return None


def _http_get_json(url: str) -> Optional[dict]:
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "VetraMAS/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        logger.warning("HTTP GET failed %s: %s", url, e)
        return None


def _extract_base58(query: str) -> Optional[str]:
    # Solana addresses are base58, typically 32–44 chars
    m = re.search(r"\b([1-9A-HJ-NP-Za-km-z]{32,44})\b", query)
    return m.group(1) if m else None


def web_scrape(query: str) -> List[WebResult]:
    """Fetch public signals for an address/token from Solscan + RPC summary."""
    results: List[WebResult] = []
    addr = _extract_base58(query) or query.strip()

    # Solscan account metadata (may 404 on some networks)
    meta = _http_get_json(f"{SOLSCAN_API_BASE}/account/{addr}")
    if meta:
        results.append(
            WebResult(
                title=f"Solscan account {addr[:8]}…",
                url=f"https://solscan.io/account/{addr}",
                snippet=json.dumps({k: meta.get(k) for k in list(meta)[:8]})[:400],
            )
        )
    else:
        results.append(
            WebResult(
                title=f"Solscan lookup {addr[:8]}…",
                url=f"https://solscan.io/account/{addr}",
                snippet="No Solscan metadata (network/rate-limit). Falling back to RPC.",
            )
        )

    info = _rpc("getAccountInfo", [addr, {"encoding": "base64"}])
    if info is None:
        results.append(
            WebResult(
                title="RPC account info",
                url=SOLANA_RPC_URL,
                snippet="RPC request failed",
            )
        )
    elif info.get("value") is None:
        results.append(
            WebResult(
                title="Unfunded / new account",
                url=SOLANA_RPC_URL,
                snippet="Account has no on-chain data (possible new or unused address).",
            )
        )
    else:
        lamports = info["value"].get("lamports", 0)
        owner = info["value"].get("owner", "?")
        results.append(
            WebResult(
                title="On-chain account",
                url=SOLANA_RPC_URL,
                snippet=f"lamports={lamports}, owner={owner}",
            )
        )

    return results


def fetch_private_data(identifier: str) -> Dict:
    """
    Derive heuristic features from Solana RPC for an address/mint.
    Returns fields consumed by math_estimator / agents.
    """
    addr = _extract_base58(identifier) or identifier.strip()
    features: Dict = {
        "identifier": addr,
        "holders_top10": 0.0,
        "lp_locked_days": 30,
        "tx_velocity": 0.0,
        "age_days": 365,
        "account_exists": False,
        "lamports": 0,
        "owner": None,
    }

    info = _rpc("getAccountInfo", [addr, {"encoding": "jsonParsed"}])
    if info and info.get("value") is not None:
        features["account_exists"] = True
        features["lamports"] = info["value"].get("lamports", 0)
        features["owner"] = info["value"].get("owner")
        # New accounts with tiny balance → treat as younger / riskier
        if features["lamports"] < 1_000_000:
            features["age_days"] = 3
            features["holders_top10"] = 0.85
            features["lp_locked_days"] = 1
    else:
        features["age_days"] = 0
        features["holders_top10"] = 0.9
        features["lp_locked_days"] = 0
        features["tx_velocity"] = 2.0

    # Recent signature count as crude velocity
    sigs = _rpc("getSignaturesForAddress", [addr, {"limit": 20}])
    if isinstance(sigs, list):
        features["tx_velocity"] = min(5.0, len(sigs) / 4.0)
        if len(sigs) >= 15:
            features["tx_velocity"] = 3.5

    return features


def math_estimator(features: Dict) -> float:
    """Heuristic risk in [0, 1]."""
    risk = 0.0
    risk += min(1.0, float(features.get("holders_top10", 0)) * 0.8)
    risk += 0.2 if float(features.get("lp_locked_days", 30)) < 7 else 0.0
    risk += 0.15 if float(features.get("age_days", 365)) < 14 else 0.0
    risk += min(0.25, float(features.get("tx_velocity", 0)) * 0.08)
    if not features.get("account_exists", True):
        risk += 0.25
    return max(0.0, min(1.0, risk))


def _extract_score(text: str) -> float:
    first = text.split("\n", 1)[0]
    m = re.search(r"([01](?:\.\d+)?)", first)
    try:
        val = float(m.group(1)) if m else 0.5
    except Exception:
        val = 0.5
    return max(0.0, min(1.0, val))


def _first_wallet_or_tx(q: str) -> Optional[str]:
    return _extract_base58(q)


def _first_token(q: str) -> Optional[str]:
    m = re.search(r"\b[A-Z]{2,10}\b", q)
    return m.group(0) if m else None


def aggregate_final_score(
    scores: Dict[str, float],
    weights: Dict[str, float] = None,
    overrides=None,
) -> float:
    weights = weights or DEFAULT_WEIGHTS
    overrides = overrides or OVERRIDES

    prod = 1.0
    for k, s in scores.items():
        w = float(weights.get(k, 1.0))
        s_clamped = min(1.0, max(0.0, s))
        term = max(0.0, 1.0 - w * s_clamped)
        prod *= term
    final_score = 1.0 - prod

    for k, threshold, floor_value in overrides:
        if scores.get(k, 0.0) >= threshold:
            final_score = max(final_score, floor_value)

    return float(min(1.0, max(0.0, final_score)))
