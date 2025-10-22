# 🤖 Guia de Implementação do Sistema Multi-Agente

## 📋 Visão Geral

O backend do Vetra está preparado para integrar com um **Sistema Multi-Agente** externo que realiza análise avançada de risco usando IA. Este guia mostra como implementar e conectar o sistema.

---

## 🏗️ Arquitetura

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────────┐
│  Vetra Backend  │─────▶│  Multi-Agent System  │─────▶│  Análise de Risco   │
│   (Node.js)     │ HTTP │    (Python/IA)       │      │  - Token Agent      │
└─────────────────┘      └──────────────────────┘      │  - Address Agent    │
                                                        │  - Pattern Agent    │
                                                        │  - Network Agent    │
                                                        │  - ML Agent         │
                                                        └─────────────────────┘
```

---

## 🎯 Agentes Recomendados

### 1. **Token Agent** 🪙
**Responsabilidade:** Analisar características do token

**Análises:**
- Idade do token (tokens novos = maior risco)
- Liquidez disponível
- Distribuição de holders
- Verificação de contrato
- Histórico de preço

**Fontes de Dados:**
- Solana RPC
- Jupiter Aggregator
- Raydium API
- Token registries

---

### 2. **Address Agent** 📍
**Responsabilidade:** Avaliar reputação dos endereços

**Análises:**
- Histórico de transações
- Idade da carteira
- Padrões de comportamento
- Listas de scam conhecidos
- Conexões com endereços maliciosos

**Fontes de Dados:**
- Blockchain explorer APIs
- Scam databases
- Community reports
- Análise de grafo

---

### 3. **Pattern Agent** 🔍
**Responsabilidade:** Detectar padrões suspeitos

**Análises:**
- Padrões de rug pull
- Pump and dump schemes
- Honeypot detection
- Timing suspeito
- Similaridade com scams anteriores

**Técnicas:**
- Machine Learning
- Pattern matching
- Anomaly detection
- Time-series analysis

---

### 4. **Network Agent** 🌐
**Responsabilidade:** Analisar condições da rede

**Análises:**
- Congestionamento da rede
- Gas fees anormais
- Atividade suspeita simultânea
- Validação de transação

**Fontes de Dados:**
- Solana RPC
- Network statistics
- Mempool analysis

---

### 5. **ML Agent** 🧠
**Responsabilidade:** Previsão com modelos de ML

**Modelos:**
- Random Forest para classificação
- LSTM para detecção de anomalias
- Transformer para análise de padrões
- Ensemble models

**Features:**
- Transaction amount
- Token characteristics
- Address reputation
- Historical patterns
- Time features

---

## 🚀 Como Implementar

### Opção 1: Python Multi-Agent Framework

```python
# requirements.txt
fastapi==0.109.0
uvicorn==0.26.0
httpx==0.26.0
pandas==2.1.4
scikit-learn==1.4.0
tensorflow==2.15.0
solana==0.31.0
web3==6.14.0
```

```python
# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
import asyncio

app = FastAPI(title="Multi-Agent Risk Analysis System")

# Request Models
class Transaction(BaseModel):
    signature: Optional[str]
    type: str
    from_address: str
    to_address: str
    amount: str
    token_address: Optional[str]
    token_symbol: Optional[str]
    timestamp: Optional[int]
    network: Optional[str] = "mainnet-beta"

class Context(BaseModel):
    user_id: Optional[str]
    user_reputation: Optional[int]
    user_transaction_count: Optional[int]
    wallet_age_days: Optional[int]
    previous_high_risk_count: Optional[int]

class Preferences(BaseModel):
    analysis_depth: Optional[str] = "standard"
    include_on_chain_data: Optional[bool] = True
    include_ml_prediction: Optional[bool] = True
    language: Optional[str] = "en"

class AnalysisRequest(BaseModel):
    transaction: Transaction
    context: Optional[Context]
    preferences: Optional[Preferences]

# Agents
class TokenAgent:
    async def analyze(self, transaction: Transaction) -> Dict:
        # TODO: Implementar análise de token
        return {
            "score": 50,
            "findings": ["Token analysis completed"],
            "severity": "medium"
        }

class AddressAgent:
    async def analyze(self, transaction: Transaction) -> Dict:
        # TODO: Implementar análise de endereço
        return {
            "score": 50,
            "findings": ["Address analysis completed"],
            "severity": "medium"
        }

class PatternAgent:
    async def analyze(self, transaction: Transaction) -> Dict:
        # TODO: Implementar análise de padrões
        return {
            "score": 50,
            "findings": ["Pattern analysis completed"],
            "severity": "medium"
        }

class NetworkAgent:
    async def analyze(self, transaction: Transaction) -> Dict:
        # TODO: Implementar análise de rede
        return {
            "score": 30,
            "findings": ["Network conditions normal"],
            "severity": "low"
        }

class MLAgent:
    async def predict(self, transaction: Transaction) -> Dict:
        # TODO: Implementar modelo de ML
        return {
            "score": 50,
            "prediction": "safe",
            "confidence": 0.8
        }

# Coordinator
class MultiAgentCoordinator:
    def __init__(self):
        self.token_agent = TokenAgent()
        self.address_agent = AddressAgent()
        self.pattern_agent = PatternAgent()
        self.network_agent = NetworkAgent()
        self.ml_agent = MLAgent()
    
    async def analyze(self, request: AnalysisRequest) -> Dict:
        # Execute agents in parallel
        results = await asyncio.gather(
            self.token_agent.analyze(request.transaction),
            self.address_agent.analyze(request.transaction),
            self.pattern_agent.analyze(request.transaction),
            self.network_agent.analyze(request.transaction),
            self.ml_agent.predict(request.transaction),
        )
        
        # Aggregate results
        token_result, address_result, pattern_result, network_result, ml_result = results
        
        # Calculate weighted score
        weights = {
            "token": 0.25,
            "address": 0.25,
            "pattern": 0.20,
            "network": 0.10,
            "ml": 0.20
        }
        
        final_score = (
            token_result["score"] * weights["token"] +
            address_result["score"] * weights["address"] +
            pattern_result["score"] * weights["pattern"] +
            network_result["score"] * weights["network"] +
            ml_result["score"] * weights["ml"]
        )
        
        # Determine risk level
        if final_score >= 70:
            risk_level = "high"
        elif final_score >= 40:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return {
            "risk_assessment": {
                "score": int(final_score),
                "level": risk_level,
                "confidence": 0.85
            },
            "agent_analysis": {
                "token_agent": token_result,
                "address_agent": address_result,
                "pattern_agent": pattern_result,
                "network_agent": network_result,
                "ml_agent": ml_result
            },
            "risk_factors": [],
            "recommendations": {
                "action": "review" if risk_level == "high" else "approve",
                "reason": f"Risk level: {risk_level}",
                "alternative_actions": []
            },
            "evidence": {},
            "metadata": {
                "analysis_duration_ms": 2000,
                "agents_used": ["token_agent", "address_agent", "pattern_agent", "network_agent", "ml_agent"],
                "data_sources": ["solana_rpc"],
                "timestamp": "2024-01-01T00:00:00Z",
                "version": "1.0.0"
            }
        }

coordinator = MultiAgentCoordinator()

@app.post("/api/analyze")
async def analyze_transaction(request: AnalysisRequest):
    try:
        result = await coordinator.analyze(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analyze/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "agents": {
            "token_agent": "operational",
            "address_agent": "operational",
            "pattern_agent": "operational",
            "network_agent": "operational",
            "ml_agent": "operational"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
```

### Executar:
```bash
pip install -r requirements.txt
python main.py
```

---

## 🧪 Testar Localmente

### 1. Executar Mock Server:
```bash
cd backend
node examples/mock-multi-agent-server.js
```

### 2. Configurar Backend:
```bash
# backend/.env
MULTI_AGENT_API_URL=http://localhost:5000/api/analyze
MULTI_AGENT_API_KEY=your-dev-key
MULTI_AGENT_TIMEOUT=30000
```

### 3. Testar Integração:
```bash
curl -X POST http://localhost:3000/api/transactions/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "transactionData": {
      "type": "transfer",
      "from": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "to": "4vMsoUT2BWatFweudnQM1xedRLfJgJ7hswhcpz4xgBTy",
      "amount": "1.5",
      "token": "So11111111111111111111111111111111111111112"
    }
  }'
```

---

## 📦 Deploy em Produção

### Opção 1: Railway
```bash
# Deploy Python API
railway init
railway add
railway deploy
```

### Opção 2: Google Cloud Run
```bash
# Build Docker image
docker build -t gcr.io/PROJECT_ID/multi-agent:latest .
docker push gcr.io/PROJECT_ID/multi-agent:latest

# Deploy
gcloud run deploy multi-agent \
  --image gcr.io/PROJECT_ID/multi-agent:latest \
  --platform managed \
  --region us-central1
```

### Opção 3: AWS Lambda + API Gateway
```bash
# Package and deploy
pip install -t package -r requirements.txt
cd package && zip -r ../deployment.zip .
cd .. && zip deployment.zip main.py
aws lambda create-function --function-name multi-agent-analyzer ...
```

---

## 🔐 Segurança

1. **API Key:** Use variável de ambiente segura
2. **Rate Limiting:** 100 req/min por IP
3. **Input Validation:** Validar todos os inputs
4. **HTTPS:** Sempre use HTTPS em produção
5. **Logs:** Não logar dados sensíveis

---

## 📊 Monitoramento

```python
# Adicionar métricas
from prometheus_client import Counter, Histogram

analysis_counter = Counter('analysis_total', 'Total analyses performed')
analysis_duration = Histogram('analysis_duration_seconds', 'Analysis duration')

@analysis_duration.time()
async def analyze_with_metrics(request):
    analysis_counter.inc()
    return await coordinator.analyze(request)
```

---

## 🚀 Próximos Passos

1. **Implementar cada agente** com lógica real
2. **Treinar modelos de ML** com dados históricos
3. **Integrar fontes de dados** externas
4. **Otimizar performance** com caching
5. **Adicionar telemetria** e monitoring
6. **Implementar A/B testing** para modelos

---

## 📚 Recursos

- **Solana Web3.js Docs:** https://solana-labs.github.io/solana-web3.js/
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **Scikit-learn:** https://scikit-learn.org/
- **LangChain (Multi-Agent):** https://python.langchain.com/

---

**Pronto para implementar seu Sistema Multi-Agente! 🚀**

