# 🔄 Fluxo Completo de Interceptação de Transações Solana

## 📊 Diagrama Visual Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        🌐 PÁGINA WEB (Raydium, Jupiter, etc)                │
│                                  User clicks "Swap"                          │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    💼 CARTEIRA (Phantom/Solflare/Backpack)                   │
│                     window.solana.signTransaction()                          │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ↓ INTERCEPTADO!
┌─────────────────────────────────────────────────────────────────────────────┐
│  📜 INJECTED SCRIPT (frontend/extension/src/injected/index.ts)              │
│                                                                               │
│  1. Detecta método: signTransaction/signAndSendTransaction/etc               │
│  2. Serializa transação                                                      │
│  3. Gera requestId único                                                     │
│  4. Envia via window.postMessage()                                           │
│      type: 'VETRA_TRANSACTION_REQUEST'                                       │
│      payload: { method, transaction, url, timestamp, network }               │
│  5. AGUARDA resposta (timeout: 10s)                                          │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ↓ window.postMessage
┌─────────────────────────────────────────────────────────────────────────────┐
│  📄 CONTENT SCRIPT (frontend/extension/src/content/index.ts)                │
│                                                                               │
│  1. Recebe mensagem do injected script                                       │
│  2. Envia para background via chrome.runtime.sendMessage()                   │
│      type: 'ANALYZE_TRANSACTION'                                             │
│  3. Aguarda resposta do background                                           │
│  4. Retorna resposta via window.postMessage()                                │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ↓ chrome.runtime.sendMessage
┌─────────────────────────────────────────────────────────────────────────────┐
│  🎛️ BACKGROUND SCRIPT (frontend/extension/src/background/index.ts)          │
│                                                                               │
│  1. Recebe mensagem: type='ANALYZE_TRANSACTION'                              │
│  2. handleTransactionAnalysis(payload)                                       │
│      ├─ Detecta rede (mainnet/devnet/testnet)                                │
│      ├─ Parse transaction (parseTransaction)                                 │
│      ├─ Prepara transactionData                                              │
│      └─ Verifica autenticação (authService)                                  │
│                                                                               │
│  3. Chama API Backend:                                                       │
│      apiService.analyzeTransaction(transactionData)                          │
│      ↓                                                                        │
│      POST https://vetra-production.up.railway.app/api/transactions/analyze   │
│      Headers: { Authorization: Bearer TOKEN }                                │
│      Body: { transactionData }                                               │
│                                                                               │
│  4. Recebe resposta da API                                                   │
│  5. Carrega configurações do usuário (chrome.storage)                        │
│      └─ auto_block_high_risk                                                 │
│                                                                               │
│  6. Lógica de Bloqueio/Aprovação:                                            │
│      ├─ Se HIGH RISK + auto_block = true → BLOQUEIA                          │
│      ├─ Se HIGH RISK + auto_block = false → Abre UI para aprovação          │
│      └─ Se LOW/MEDIUM → Aprova automaticamente                               │
│                                                                               │
│  7. Retorna resultado com:                                                   │
│      { blocked, approved, riskScore, riskLevel, reasons... }                 │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ↓ HTTP POST
┌─────────────────────────────────────────────────────────────────────────────┐
│        🚀 BACKEND API (backend/src/routes/transactions.js)                   │
│                     Railway: vetra-production.up.railway.app                 │
│                                                                               │
│  POST /api/transactions/analyze                                              │
│  ┌───────────────────────────────────────────────────────────────┐          │
│  │ 1. Validação de Input (express-validator)                     │          │
│  │ 2. Extrai userId (se autenticado)                             │          │
│  │                                                                │          │
│  │ 3. Verifica Cache (Redis)                                     │          │
│  │    Key: analysis:{signature}                                  │          │
│  │    ├─ Cache HIT → Retorna resultado cacheado                  │          │
│  │    └─ Cache MISS → Continua                                   │          │
│  │                                                                │          │
│  │ 4. Chama Multi-Agent System:                                  │          │
│  │    analyzeTransactionWithMultiAgent(transactionData, options) │          │
│  │    ↓                                                           │          │
│  └────┼───────────────────────────────────────────────────────────          │
└───────┼───────────────────────────────────────────────────────────────────┘
        │
        ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  🤖 MULTI-AGENT RISK ANALYZER                                                │
│     (backend/src/services/multiAgentRiskAnalyzer.js)                         │
│                                                                               │
│  1. Prepara inputData (prepareInputData)                                     │
│  2. Valida inputData (validateInputData)                                     │
│  3. Tenta chamar API EXTERNA do MAS:                                         │
│     ↓                                                                         │
│     POST http://localhost:5000/api/analyze (MULTI_AGENT_API_URL)            │
│     Headers: { X-API-Key: ... }                                              │
│     ↓                                                                         │
│     ❌ FALHA (API não configurada ainda)                                     │
│     ↓                                                                         │
│  4. FALLBACK para análise básica:                                            │
│     fallbackAnalysis(transactionData)                                        │
│     ├─ Heurísticas simples                                                   │
│     ├─ Score baseado em amount, type                                         │
│     └─ Retorna: { score, level, confidence, reasons, ... }                   │
│                                                                               │
│  5. Normaliza resultado (normalizeAnalysisResult)                            │
│  6. Cacheia resultado (Redis)                                                │
│  7. Retorna análise                                                          │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ↓ Retorna para route
┌─────────────────────────────────────────────────────────────────────────────┐
│        🚀 BACKEND API (backend/src/routes/transactions.js)                   │
│                                                                               │
│  5. Recebe resultado da análise                                              │
│                                                                               │
│  6. Se usuário AUTENTICADO → SALVA NO BANCO:                                 │
│     ┌─────────────────────────────────────────────────┐                     │
│     │ db('transactions').insert({                     │                     │
│     │   user_id: userId,                              │                     │
│     │   signature: transactionData.signature,         │                     │
│     │   transaction_hash: transactionData.signature,  │                     │
│     │   type: transactionData.type,                   │                     │
│     │   from_address: transactionData.from,           │                     │
│     │   to_address: transactionData.to,               │                     │
│     │   amount: transactionData.amount,               │                     │
│     │   token_address: transactionData.token,         │                     │
│     │   risk_score: analysis.score,                   │                     │
│     │   risk_level: analysis.level,                   │                     │
│     │   risk_reasons: analysis.reasons,               │                     │
│     │   heuristics: analysis.heuristics,              │                     │
│     │   status: 'pending',                            │                     │
│     │   analyzed_at: new Date(),                      │                     │
│     │ })                                              │                     │
│     └─────────────────────────────────────────────────┘                     │
│     ↓                                                                         │
│  7. Response:                                                                 │
│     {                                                                         │
│       success: true,                                                          │
│       analysis: { score, level, reasons, ... },                              │
│       transaction: { id, risk_score, risk_level, status },                   │
│       authenticated: true                                                     │
│     }                                                                         │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ↓ PostgreSQL (Knex.js)
┌─────────────────────────────────────────────────────────────────────────────┐
│            💾 RAILWAY POSTGRESQL DATABASE                                    │
│                                                                               │
│  TABLE: transactions                                                          │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │ id (uuid)                    - Primary key                   │           │
│  │ user_id (uuid)               - FK → users.id                 │           │
│  │ signature (string)           - Transaction signature         │           │
│  │ transaction_hash (string)    - TX hash                       │           │
│  │ type (string)                - transfer, swap, etc           │           │
│  │ from_address (string)        - Source address                │           │
│  │ to_address (string)          - Destination address           │           │
│  │ amount (decimal)             - Transaction amount            │           │
│  │ token_address (string)       - Token contract                │           │
│  │ token_symbol (string)        - SOL, USDC, etc                │           │
│  │ risk_score (integer)         - 0-100                         │           │
│  │ risk_level (enum)            - low, medium, high             │           │
│  │ risk_reasons (jsonb)         - Array of reasons              │           │
│  │ heuristics (jsonb)           - Detailed analysis             │           │
│  │ status (enum)                - pending, approved, rejected   │           │
│  │ user_approved (boolean)      - User decision                 │           │
│  │ user_feedback (text)         - Optional feedback             │           │
│  │ analyzed_at (timestamp)      - Analysis time                 │           │
│  │ created_at (timestamp)       - Record creation               │           │
│  │ updated_at (timestamp)       - Last update                   │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                               │
│  INDICES:                                                                     │
│  - user_id_idx (btree)                                                        │
│  - signature_idx (btree)                                                      │
│  - risk_level_idx (btree)                                                     │
│  - analyzed_at_idx (btree)                                                    │
│                                                                               │
│  Query Examples:                                                              │
│  SELECT * FROM transactions WHERE user_id = '...' ORDER BY analyzed_at DESC; │
│  SELECT * FROM transactions WHERE risk_level = 'high';                       │
│  SELECT AVG(risk_score) FROM transactions WHERE user_id = '...';             │
└─────────────────────────────────────────────────────────────────────────────┘

                        ↑ Resposta sobe pela stack ↑

┌─────────────────────────────────────────────────────────────────────────────┐
│  🎛️ BACKGROUND SCRIPT recebe resposta da API                                 │
│                                                                               │
│  8. Decisão Final:                                                            │
│     ┌──────────────────────────────────────────────┐                        │
│     │ if (riskLevel === 'high') {                  │                        │
│     │   if (autoBlockHighRisk) {                   │                        │
│     │     blocked = true                           │                        │
│     │     approved = false                         │                        │
│     │   } else {                                   │                        │
│     │     // Abre popup para aprovação manual     │                        │
│     │     chrome.action.openPopup()               │                        │
│     │     await waitForUserApproval()             │                        │
│     │   }                                          │                        │
│     │ } else {                                     │                        │
│     │   approved = true // Low/Medium risk        │                        │
│     │ }                                            │                        │
│     └──────────────────────────────────────────────┘                        │
│                                                                               │
│  9. Retorna para content script                                              │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ↓ chrome.runtime.sendMessage response
┌─────────────────────────────────────────────────────────────────────────────┐
│  📄 CONTENT SCRIPT envia de volta para injected                              │
│                                                                               │
│  window.postMessage({                                                         │
│    type: 'VETRA_TRANSACTION_RESPONSE',                                       │
│    id: requestId,                                                             │
│    response: { blocked, approved, riskScore, riskLevel, reasons }            │
│  })                                                                           │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ↓ window.postMessage
┌─────────────────────────────────────────────────────────────────────────────┐
│  📜 INJECTED SCRIPT recebe resposta                                          │
│                                                                               │
│  10. Verifica response:                                                       │
│      ┌──────────────────────────────────────────┐                           │
│      │ if (response.blocked === true) {         │                           │
│      │   throw new Error('Transaction blocked') │                           │
│      │   ❌ BLOQUEIA - carteira não abre       │                           │
│      │ }                                        │                           │
│      │                                          │                           │
│      │ if (response.approved === true) {        │                           │
│      │   return original.apply(target, args)   │                           │
│      │   ✅ PERMITE - carteira abre            │                           │
│      │ }                                        │                           │
│      └──────────────────────────────────────────┘                           │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ↓ Se aprovado
┌─────────────────────────────────────────────────────────────────────────────┐
│  💼 CARTEIRA (Phantom/Solflare) abre popup de confirmação                    │
│                                                                               │
│  Usuário vê:                                                                  │
│  - Transaction details (from, to, amount)                                     │
│  - Botões: Approve / Reject                                                   │
│  - Simulação de transação                                                     │
│                                                                               │
│  Usuário decide:                                                              │
│  ├─ Aprova → Transação enviada à blockchain ✅                                │
│  └─ Rejeita → Transação cancelada ❌                                          │
└─────────────────────────────────────────────────────────────────────────────┘

                         🎉 FIM DO FLUXO! 🎉
```

---

## 🔑 Pontos-Chave do Fluxo:

### **1. Interceptação Acontece ANTES da Carteira**
- Vetra intercepta **ANTES** do popup da carteira aparecer
- Analisa o risco **ANTES** do usuário ver qualquer coisa
- Pode **BLOQUEAR** antes mesmo da carteira abrir

### **2. Comunicação Entre Contextos**
```
Page Context (window.solana)
      ↕ window.postMessage
Content Script
      ↕ chrome.runtime.sendMessage
Background Script
      ↕ HTTP/HTTPS
Backend API
      ↕ PostgreSQL
Database
```

### **3. Salvamento no Banco**
- **Só salva se usuário autenticado** (tem token JWT)
- **Salva SEMPRE** que há análise (independente de aprovação)
- **Status inicial**: `pending`
- **Pode ser atualizado** depois (approved/rejected)

### **4. Cache em Redis**
- **Cache de análises**: 1 hora
- **Key**: `analysis:{signature}`
- **Evita análises duplicadas** (performance)

### **5. Multi-Agent System**
```
Tenta API Externa
   ↓ FALHA
Fallback para Heurísticas Básicas
   ↓ SEMPRE RETORNA
Análise Completa
```

---

## 📝 Exemplo de Dados Salvos no Banco:

```sql
INSERT INTO transactions VALUES (
  'uuid-123',                           -- id
  'user-uuid-456',                      -- user_id
  '5Kzx...',                           -- signature
  '5Kzx...',                           -- transaction_hash
  'swap',                              -- type
  '3JdF...WLM',                        -- from_address
  'DRay...XemT',                       -- to_address
  '0.1',                               -- amount
  'So11...112',                        -- token_address
  'SOL',                               -- token_symbol
  45,                                  -- risk_score
  'medium',                            -- risk_level
  '["High value transaction detected"]', -- risk_reasons (JSONB)
  '{"addressRisk": 10, ...}',          -- heuristics (JSONB)
  'pending',                           -- status
  NULL,                                -- user_approved
  NULL,                                -- user_feedback
  '2025-10-30 21:00:00',              -- analyzed_at
  '2025-10-30 21:00:00',              -- created_at
  '2025-10-30 21:00:00'               -- updated_at
);
```

---

## 🕒 Timeline Típica:

```
T+0ms:    User clica "Swap"
T+10ms:   Vetra intercepta
T+20ms:   Content script recebe
T+30ms:   Background inicia análise
T+50ms:   HTTP request para backend
T+200ms:  Backend analisa (MAS/Fallback)
T+250ms:  Salva no PostgreSQL
T+300ms:  Resposta volta para frontend
T+350ms:  Decision logic (block/approve)
T+400ms:  Resposta final para injected
T+450ms:  Carteira abre (se aprovado)
```

**Total: ~450ms de overhead** (imperceptível para o usuário)

---

## 🎯 Estados Possíveis:

### **Cenário 1: Low/Medium Risk + Usuário Autenticado**
```
Intercept → Analyze → Save DB → Approve → Wallet Opens → User Confirms → Blockchain
```

### **Cenário 2: High Risk + Auto-Block ON**
```
Intercept → Analyze → Save DB → BLOCK → ❌ END (Wallet never opens)
```

### **Cenário 3: High Risk + Auto-Block OFF**
```
Intercept → Analyze → Save DB → Show Vetra Popup → User Decides
                                                    ├─ Approve → Wallet Opens
                                                    └─ Reject → ❌ END
```

### **Cenário 4: Usuário NÃO Autenticado**
```
Intercept → Analyze → ⚠️ NO SAVE → Approve → Wallet Opens
```

---

## 🔍 Queries Úteis para Ver os Dados:

```sql
-- Ver últimas transações analisadas
SELECT 
  id,
  type,
  from_address,
  to_address,
  amount,
  risk_score,
  risk_level,
  status,
  analyzed_at
FROM transactions
ORDER BY analyzed_at DESC
LIMIT 10;

-- Ver transações de alto risco
SELECT * FROM transactions 
WHERE risk_level = 'high'
ORDER BY analyzed_at DESC;

-- Estatísticas do usuário
SELECT 
  COUNT(*) as total,
  AVG(risk_score) as avg_risk,
  COUNT(*) FILTER (WHERE risk_level = 'high') as high_risk_count
FROM transactions
WHERE user_id = 'user-uuid';
```

---

**Este é TODO o caminho!** 🎉

Da página web → Banco de dados → E de volta!

