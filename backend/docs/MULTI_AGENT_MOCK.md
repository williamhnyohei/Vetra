# Multi-Agent System (MAS) Mock

## 📖 Visão Geral

Este documento descreve o **Mock do Multi-Agent System** implementado para análise de risco de transações Solana.

O Mock simula o comportamento do sistema real de múltiplos agentes, permitindo:
- ✅ Desenvolvimento e testes sem dependências externas
- ✅ Demonstração do fluxo completo de análise
- ✅ Base para integração com o MAS real no futuro

---

## 🤖 Arquitetura do MAS (Mock)

O sistema simula **4 agentes especializados**:

### 1. **Address Reputation Agent**
- **Função**: Analisa a reputação de endereços
- **Verifica**:
  - Endereços em blacklists conhecidas
  - Histórico de transações
  - Idade da conta
- **Contribuição**: Até 50 pontos de risco

### 2. **Pattern Detection Agent**
- **Função**: Detecta padrões suspeitos
- **Verifica**:
  - Transações rápidas/repetidas
  - Horários incomuns
  - Padrões de phishing
- **Contribuição**: Até 30 pontos de risco

### 3. **Amount Analysis Agent**
- **Função**: Analisa valores de transação
- **Verifica**:
  - Valores muito altos
  - Números redondos suspeitos
  - Desvios de padrões normais
- **Contribuição**: Até 45 pontos de risco

### 4. **ML-based Risk Agent**
- **Função**: Modelo de machine learning (simulado)
- **Verifica**:
  - Padrões complexos
  - Combinação de múltiplos fatores
- **Contribuição**: Até 30 pontos de risco

---

## 📊 Fluxo de Análise

```
Transaction Data
      ↓
┌─────────────────┐
│   MAS Mock      │
│  (Orchestrator) │
└────────┬────────┘
         ↓
    ┌────┴────┬────────┬────────┐
    ↓         ↓        ↓        ↓
[Agent 1] [Agent 2] [Agent 3] [Agent 4]
Address   Pattern   Amount     ML
    ↓         ↓        ↓        ↓
    └─────────┴────────┴────────┘
              ↓
       Risk Score (0-100)
       Risk Level (low/medium/high)
       Reasons
       Recommendations
```

---

## 🔧 Como Usar

### **Backend (Automático)**

O Mock é usado automaticamente quando o backend detecta uma transação:

```javascript
// Em riskAnalyzer.js
const useMAS = process.env.USE_MULTI_AGENT_SYSTEM === 'true' || true;

if (useMAS) {
  const analysis = await analyzeTransactionWithMAS(transactionData);
  // Retorna análise completa com agentes
}
```

### **Verificar Status do MAS**

```bash
curl https://vetra-production.up.railway.app/api/mas/status
```

**Response**:
```json
{
  "success": true,
  "mas": {
    "status": "MOCK",
    "message": "Using mock Multi-Agent System. Replace with real MAS API when ready.",
    "agents": {
      "addressReputation": "MOCK",
      "patternDetection": "MOCK",
      "amountAnalysis": "MOCK",
      "mlAgent": "MOCK"
    },
    "timestamp": "2025-10-30T..."
  }
}
```

---

## 📈 Exemplo de Resposta

Quando uma transação é analisada:

```javascript
{
  "score": 65,  // 0-100
  "level": "medium",  // low, medium, high
  "reasons": [
    "💰 High value transaction detected (50 SOL)",
    "⚠️ Recipient address has limited transaction history",
    "🤖 ML model detected potential risk patterns"
  ],
  "heuristics": {
    "addressReputation": 10,
    "patternDetection": 15,
    "amountRisk": 35,
    "mlScore": 5
  },
  "agentAnalysis": {
    "addressAgent": { score: 10, factors: [...] },
    "patternAgent": { score: 15, factors: [...] },
    "amountAgent": { score: 35, factors: [...] },
    "mlAgent": { score: 5, factors: [...] }
  },
  "recommendations": [
    "⚠️ Carefully verify the recipient address",
    "💰 Consider reducing the transaction amount"
  ],
  "confidence": 80,
  "isMock": true,
  "method": "multi-agent-system"
}
```

---

## 🔄 Migração para MAS Real

Quando o sistema real estiver pronto:

### **Passo 1: Criar Serviço Real**

```javascript
// backend/src/services/multiAgentSystem.js
async function analyzeTransactionWithMAS(transactionData) {
  // Chamar API real do MAS
  const response = await axios.post(MAS_API_URL, {
    transaction: transactionData
  });
  
  return response.data;
}
```

### **Passo 2: Configurar Variáveis de Ambiente**

```env
USE_MULTI_AGENT_SYSTEM=true
MAS_API_URL=https://mas-api.example.com
MAS_API_KEY=your_api_key_here
```

### **Passo 3: Atualizar riskAnalyzer.js**

```javascript
// Trocar import
const { analyzeTransactionWithMAS } = require('./multiAgentSystem'); // Real, não Mock
```

### **Passo 4: Testar**

```bash
# Verificar status
curl /api/mas/status

# Deve retornar:
{
  "status": "ACTIVE",  // Não "MOCK"
  "agents": {
    "addressReputation": "ACTIVE",
    "patternDetection": "ACTIVE",
    ...
  }
}
```

---

## 🧪 Testando o Mock

### **1. Via API Direta**

```bash
curl -X POST https://vetra-production.up.railway.app/api/transactions/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionData": {
      "type": "transfer",
      "from": "sender_address",
      "to": "recipient_address",
      "amount": "50",
      "token": "SOL"
    }
  }'
```

### **2. Via Extensão**

1. Faça uma transação em Devnet/Testnet
2. Abra DevTools (F12)
3. Veja logs:
   ```
   🤖 Using Multi-Agent System for analysis
   MAS Status: { status: 'MOCK', ... }
   ```

### **3. Via Railway Database**

```sql
-- Ver análises salvas
SELECT 
  id,
  signature,
  risk_score,
  risk_level,
  risk_reasons,
  analyzed_at
FROM transactions
ORDER BY analyzed_at DESC
LIMIT 10;
```

---

## 🎯 Lógica de Risco (Mock)

### **Risk Score Calculation**

```
Total Risk = 
  Address Reputation (0-50) +
  Pattern Detection (0-30) +
  Amount Analysis (0-45) +
  ML Score (0-30)
  
Max: 155 → Normalizado para 0-100
```

### **Risk Level**

- **Low**: 0-39
- **Medium**: 40-69
- **High**: 70-100

### **Confidence**

```
Confidence = Base(60) + Factors(5 cada) + HighCertainty(10)
```

---

## 📝 Logs e Debug

### **Backend Logs**

```
🔍 Starting risk analysis
🤖 Using Multi-Agent System for analysis
MAS Status: { status: 'MOCK', ... }
🤖 Multi-Agent System: Starting analysis (MOCK)
📦 Transaction: { type, from, to, amount }
✅ Multi-Agent Analysis Complete (MOCK): { score: 45, level: 'medium' }
```

### **Frontend Console**

```
🎯 VETRA INTERCEPTED signTransaction!!!
📤 Sending transaction for analysis...
📥 Transaction analysis response: { score: 45, level: 'medium', isMock: true }
```

---

## 🚀 Roadmap

### **Fase 1: Mock (ATUAL)** ✅
- Implementação de agentes simulados
- Lógica básica de risco
- Integração com backend
- Testes e validação

### **Fase 2: MAS Real (FUTURO)**
- Implementação de agentes reais
- Integração com APIs externas
- Machine Learning real
- Blockchain analysis

### **Fase 3: Otimização**
- Cache de análises
- Performance tuning
- Escalabilidade
- Monitoramento

---

## 📚 Arquivos Relacionados

- `backend/src/services/multiAgentSystemMock.js` - Implementação do mock
- `backend/src/services/riskAnalyzer.js` - Orquestrador
- `backend/src/routes/mas-status.js` - Endpoint de status
- `backend/docs/MULTI_AGENT_API_SPEC.md` - Especificação da API real

---

## 💡 Dicas

1. **Desenvolvimento**: Use o mock para testes rápidos
2. **Produção**: Migre para MAS real quando disponível
3. **Monitoramento**: Use `/api/mas/status` para verificar estado
4. **Debug**: Ative logs detalhados para troubleshooting

---

## 🤝 Contribuindo

Para melhorar o mock:

1. Adicione mais heurísticas em cada agente
2. Refine os pesos de risk score
3. Adicione novos padrões de detecção
4. Melhore as recomendações

---

**Status Atual**: 🟢 Mock Ativo e Funcional  
**Próximo Passo**: Integração com MAS Real  
**Documentação Atualizada**: 30/10/2025

