# 🔧 Troubleshooting: Transações Não Salvando no Banco

## 🐛 Problema

A Vetra intercepta a transação, mas ela não aparece na tabela `transactions` do Railway.

---

## 🔍 Diagnóstico

### **Passo 1: Verificar Console do Frontend**

Abra DevTools (F12) e procure por:

```javascript
✅ Analysis complete: { success: false, error: 'Transaction analysis failed' }
```

Se você vê `success: false`, o backend está **FALHANDO** na análise!

---

### **Passo 2: Verificar Logs do Railway**

1. Vá para Railway → Seu projeto → **"Deployments"**
2. Clique no deployment ativo
3. Vá para **"Logs"**
4. Procure por:

```
❌ Transaction analysis error
Error stack: ...
Error details: { message: '...', ... }
```

**Este log te dirá o erro EXATO!**

---

## 🔧 Soluções Comuns

### **Erro 1: user_id NOT NULL constraint**

**Sintoma**: Logs mostram:
```
error: null value in column "user_id" violates not-null constraint
```

**Solução**: Rodar migration 007

No Railway PostgreSQL console:
```sql
ALTER TABLE transactions ALTER COLUMN user_id DROP NOT NULL;
```

Ou rode o script: `backend/migrations/manual_allow_null_user_id.sql`

---

### **Erro 2: multiAgentRiskAnalyzer não encontrado**

**Sintoma**: Logs mostram:
```
Cannot find module '../services/multiAgentRiskAnalyzer'
```

**Solução**: Verificar se arquivo existe no deploy
```bash
# No Railway, ver arquivos deployados
ls -la backend/src/services/
```

---

### **Erro 3: Multi-Agent API timeout**

**Sintoma**: Logs mostram:
```
Multi-Agent API call failed: timeout
Falling back to basic risk analysis
```

**Solução**: Configurar variável de ambiente
```env
USE_MULTI_AGENT_SYSTEM=false
```

Ou ignorar (fallback funciona, mas é básico)

---

### **Erro 4: Database connection error**

**Sintoma**: Logs mostram:
```
Error: connect ECONNREFUSED
Connection terminated unexpectedly
```

**Solução**: Verificar DATABASE_URL no Railway
```env
DATABASE_URL=postgresql://...
```

---

## 🧪 Teste Manual da API

### **1. Testar endpoint diretamente**

```bash
curl -X POST https://vetra-production.up.railway.app/api/transactions/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "transactionData": {
      "type": "transfer",
      "from": "test_from_address",
      "to": "test_to_address",
      "amount": "0.1",
      "token": "SOL"
    }
  }'
```

**Esperado**:
```json
{
  "success": true,
  "analysis": { ... },
  "transaction": { "id": "uuid...", ... }
}
```

**Se falhar**, você verá o erro exato!

---

### **2. Verificar se salvou no banco**

```sql
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 1;
```

Se apareceu → Backend está funcionando!
Se vazio → Problema na rota de análise

---

## 🔬 Debug Passo a Passo

### **1. Verificar Multi-Agent System**

```bash
curl https://vetra-production.up.railway.app/api/mas/status
```

Deve retornar:
```json
{
  "success": true,
  "mas": {
    "status": "MOCK",
    "agents": { ... }
  }
}
```

### **2. Verificar se migrations rodaram**

No Railway PostgreSQL:
```sql
-- Ver migrations aplicadas
SELECT * FROM knex_migrations ORDER BY id DESC;

-- Deve incluir:
-- 007_allow_null_user_id_in_transactions.js
```

### **3. Verificar estrutura da tabela**

```sql
-- Ver colunas da tabela transactions
\d transactions

-- Verificar se user_id permite NULL
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
  AND column_name = 'user_id';

-- Deve retornar: is_nullable = 'YES'
```

---

## 🚑 Solução Emergencial

Se nada funcionar, rode este SQL no Railway para salvar manualmente uma transação de teste:

```sql
INSERT INTO transactions (
  user_id,
  signature,
  transaction_hash,
  type,
  from_address,
  to_address,
  amount,
  risk_score,
  risk_level,
  risk_reasons,
  status
) VALUES (
  NULL,  -- Guest sem user_id
  'test_sig_' || NOW()::text,
  'test_hash_' || NOW()::text,
  'transfer',
  'from_address_123',
  'to_address_456',
  0.1,
  50,
  'medium',
  '["Test transaction"]'::jsonb,
  'pending'
);

-- Ver se foi criado
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 1;
```

Se isso funcionar → Problema está na rota de análise
Se falhar → Problema no schema do banco

---

## 📋 Checklist de Debug:

- [ ] Verificou logs do Railway?
- [ ] Migration 007 foi aplicada?
- [ ] Testou endpoint `/api/transactions/analyze` diretamente?
- [ ] user_id permite NULL na tabela?
- [ ] multiAgentRiskAnalyzer existe no deploy?
- [ ] DATABASE_URL está correto?

---

## 🎯 Próximo Passo AGORA:

**Vá para Railway Logs** e me mande o erro exato que aparece quando você faz o swap!

Procure por:
```
❌ Transaction analysis error
```

Me diga o que está escrito depois! Isso vai me dizer exatamente qual é o problema. 🔍

