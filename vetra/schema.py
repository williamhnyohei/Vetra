from typing import Dict, List, Any, TypedDict
from dataclasses import dataclass

class VetraState(TypedDict, total=False):
    query: str
    route: List[str]
    scores: Dict[str, float]
    rationales: Dict[str, str]
    evidence: List[str]
    final_report: str
    final_json: Dict[str, Any]

@dataclass
class WebResult:
    title: str
    url: str
    snippet: str