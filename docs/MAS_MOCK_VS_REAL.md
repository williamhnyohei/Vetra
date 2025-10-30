# 🤖 Multi-Agent System: Mock vs. Real

## 🔀 Dois Caminhos de Análise

Atualmente, você tem **2 arquivos** de análise de risco:

### **Caminho 1: multiAgentRiskAnalyzer.js** (ATUAL - Usa Fallback)
```
Rota → multiAgentRiskAnalyzer.js
            ↓
      Tenta API Externa (localhost:5000)
            ↓ FALHA ❌
      fallbackAnalysis()
            ↓
      Heurísticas Básicas
            ↓
      Retorna análise simples
```

### **Caminho 2: riskAnalyzer.js + multiAgentSystemMock.js** (MOCK COMPLETO)
```
Rota → riskAnalyzer.js
            ↓
      multiAgentSystemMock.js
            ↓
      4 Agentes Simulados:
      ├─ Address Reputation Agent
      ├─ Pattern Detection Agent
      ├─ Amount Analysis Agent
      └─ ML-based Agent
            ↓
      Retorna análise detalhada
```

---

## 📊 Comparação Detalhada

| Aspecto | multiAgentRiskAnalyzer (Atual) | riskAnalyzer + Mock (Criado) |
|---------|--------------------------------|------------------------------|
| **Status** | ✅ Em uso | 🆕 Criado mas não integrado |
| **API Externa** | Tenta chamar | Não chama |
| **Quando Falha** | Usa fallback simples | Mock sempre funciona |
| **Agentes** | 0 (fallback) | 4 agentes simulados |
| **Complexidade** | Baixa (fallback) | Alta (simula MAS real) |
| **Detalhamento** | Básico | Muito detalhado |
| **Recomendações** | Poucas | Muitas e específicas |

---

## 🔧 Estado ATUAL do Código:

### **O QUE ESTÁ ACONTECENDO AGORA:**

```javascript
// backend/src/routes/transactions.js (linha 52)
const analysis = await analyzeTransactionWithMultiAgent(transactionData, options);
                      ↑
                      Chama multiAgentRiskAnalyzer.js
                      ↓
                      Tenta API externa (localhost:5000)
                      ↓ FALHA
                      fallbackAnalysis() → Retorna análise SIMPLES
```

**Resultado**: Análise funciona, mas é **simplificada** (fallback)

---

## 🎯 Para Usar o MOCK Completo:

Você tem 3 opções:

### **Opção 1: Trocar para riskAnalyzer.js** (Recomendado para desenvolvimento)

Em `backend/src/routes/transactions.js`:

```javascript
// ANTES:
const { analyzeTransactionWithMultiAgent } = require('../services/multiAgentRiskAnalyzer');

// DEPOIS:
const { analyzeTransaction } = require('../services/riskAnalyzer');

// E trocar a chamada:
const analysis = await analyzeTransaction(transactionData);
```

**Benefício**: Mock completo com 4 agentes funcionando

### **Opção 2: Configurar API Externa do MAS** (Para produção)

```bash
# .env
MULTI_AGENT_API_URL=https://mas-api.example.com/analyze
MULTI_AGENT_API_KEY=your_secret_key
```

**Benefício**: Análise REAL com AI de verdade

### **Opção 3: Melhorar o Fallback** (Temporário)

Copiar lógica do mock para dentro do `fallbackAnalysis()` do multiAgentRiskAnalyzer.

---

## 🔍 Como Saber Qual Está Sendo Usado?

### **No Console do Backend (Railway Logs)**:

#### **Se usar multiAgentRiskAnalyzer (atual)**:
```
Calling Multi-Agent System API { url: 'http://localhost:5000/api/analyze' }
Multi-Agent API call failed
⚠️ Falling back to basic risk analysis
Using fallback risk analysis
```

#### **Se usar riskAnalyzer + mock**:
```
🔍 Starting risk analysis
🤖 Using Multi-Agent System for analysis
MAS Status: { status: 'MOCK', agents: { ... } }
🤖 Multi-Agent System: Starting analysis (MOCK)
✅ Multi-Agent Analysis Complete (MOCK): { score: 45, level: 'medium' }
```

---

## 💾 O Que é Salvo no Banco?

**Independente** do método, o banco recebe:

```javascript
{
  risk_score: 45,
  risk_level: 'medium',
  risk_reasons: [
    'High value transaction detected',
    'Recipient address has limited history'
  ],
  heuristics: {
    addressRisk: 10,
    patternRisk: 15,
    amountRisk: 20,
    ...
  },
  status: 'pending'
}
```

---

## 🚀 Recomendação

### **Para AGORA (Desenvolvimento/Testes)**:

**Use o Mock Completo**:
1. Trocar rota para usar `riskAnalyzer.js`
2. Ter análises mais detalhadas
3. Simular comportamento do MAS real
4. Testar UI com dados ricos

### **Para DEPOIS (Produção)**:

**Integrar MAS Real**:
1. Configurar API_URL do MAS
2. Usar `multiAgentRiskAnalyzer.js`
3. Ter análise de AI real
4. Fallback continua funcionando se API cair

---

## 🛠️ Como Fazer a Troca (Se Quiser):

### **Arquivo**: `backend/src/routes/transactions.js`

#### **ANTES (linha 10)**:
```javascript
const { analyzeTransactionWithMultiAgent } = require('../services/multiAgentRiskAnalyzer');
```

#### **DEPOIS**:
```javascript
const { analyzeTransaction } = require('../services/riskAnalyzer');
```

#### **ANTES (linha 52)**:
```javascript
const analysis = await analyzeTransactionWithMultiAgent(transactionData, options);
```

#### **DEPOIS**:
```javascript
const analysis = await analyzeTransaction(transactionData);
```

**Rebuild e redeploy** → Pronto! Mock ativo!

---

## 📈 Diferença nos Resultados:

### **Fallback (Atual)**:
```json
{
  "score": 50,
  "level": "medium",
  "confidence": 0.5,
  "reasons": ["Basic heuristic analysis performed"]
}
```

### **Mock Completo**:
```json
{
  "score": 65,
  "level": "medium",
  "confidence": 80,
  "reasons": [
    "💰 High value transaction detected (50 SOL)",
    "⚠️ Recipient address has limited transaction history",
    "⏰ Rapid transaction detected",
    "🤖 ML model detected potential risk patterns"
  ],
  "heuristics": {
    "addressReputation": 10,
    "patternDetection": 15,
    "amountRisk": 35,
    "mlScore": 5
  },
  "agentAnalysis": {
    "addressAgent": { ... },
    "patternAgent": { ... },
    "amountAgent": { ... },
    "mlAgent": { ... }
  },
  "recommendations": [
    "⚠️ Carefully verify the recipient address",
    "🔍 Check if this is a known scam address",
    "💰 Consider reducing the transaction amount"
  ],
  "method": "multi-agent-system",
  "isMock": true
}
```

---

## 💡 Conclusão

- ✅ **Ambos os sistemas funcionam**
- ✅ **Ambos salvam no banco**
- 🎨 **Mock é mais detalhado** (melhor para UI)
- 🚀 **Real (futuro) será mais preciso** (AI de verdade)

**Quer que eu troque para usar o Mock completo agora?** 🔄

