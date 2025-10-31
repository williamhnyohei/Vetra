# 🚀 QUICKSTART - Vetra

Guia rápido para começar a usar o Vetra após o build.

---

## ⚡ INICIAR EM 3 PASSOS

### 1️⃣ **Carregar Extensão no Chrome** (2 minutos)

1. Abra o Chrome e vá para: `chrome://extensions/`
2. Ative o **"Modo do desenvolvedor"** (toggle no canto superior direito)
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta:
   ```
   C:\Users\william_yohei\Documents\Vetra\frontend\extension\dist
   ```
5. ✅ A extensão Vetra aparecerá na barra do Chrome!

---

### 2️⃣ **Configurar Sistema Python MAS** (5 minutos)

#### A. Obter Chave do Google Gemini
1. Acesse: https://makersuite.google.com/app/apikey
2. Crie uma chave API (gratuita para começar)
3. Copie a chave

#### B. Criar arquivo `.env`
```bash
cd C:\Users\william_yohei\Documents\Vetra\vetra_mas

# Criar .env (pode usar notepad)
notepad .env
```

Adicione no arquivo:
```env
GOOGLE_API_KEY=sua_chave_aqui
MULTI_AGENT_API_KEY=dev-key
DISABLE_AUTH=true
PORT=5000
HOST=0.0.0.0
```

#### C. Executar Servidor
```bash
cd C:\Users\william_yohei\Documents\Vetra\vetra_mas
python -m uvicorn vetra_service:app --reload --host 0.0.0.0 --port 5000
```

Você verá:
```
INFO:     Uvicorn running on http://0.0.0.0:5000
INFO:     Application startup complete.
```

✅ **Servidor rodando!** Deixe esse terminal aberto.

---

### 3️⃣ **Testar a Extensão** (3 minutos)

1. **Abrir popup da extensão**:
   - Clique no ícone do Vetra na barra do Chrome
   - Ou pressione: `Alt+Shift+V`

2. **Testar em um site Solana**:
   - Acesse: https://jup.ag (Jupiter DEX)
   - Conecte sua wallet
   - Tente fazer um swap
   - O Vetra irá interceptar e analisar a transação!

3. **Ver histórico**:
   - Abra o popup do Vetra
   - Navegue até "History"
   - Veja todas as transações analisadas

---

## 🧪 TESTAR API PYTHON (Opcional)

### Teste Manual via cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Análise de transação (exemplo)
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key" \
  -d '{
    "transaction": {
      "type": "transfer",
      "from_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "to_address": "4vMsoUT2BWatFweudnQM1xedRLfJgJ7hswhcpz4xgBTy",
      "amount": "1.5",
      "token_symbol": "SOL"
    }
  }'
```

Resposta esperada:
```json
{
  "risk_assessment": {
    "score": 45,
    "level": "medium",
    "confidence": 0.85
  },
  "agent_analysis": { ... },
  "recommendations": { ... }
}
```

---

## 📊 CONFIGURAÇÃO DO BACKEND (Railway)

O backend já está em produção, mas você precisa configurar a URL do Python MAS:

### No Railway Dashboard:
1. Acesse seu projeto no Railway
2. Vá em **"Variables"**
3. Adicione/atualize:
   ```
   MULTI_AGENT_API_URL=http://seu-python-mas-url/api/analyze
   MULTI_AGENT_API_KEY=dev-key
   ```

### Para Desenvolvimento Local:
Se quiser apontar o backend para seu Python local:
```
MULTI_AGENT_API_URL=http://localhost:5000/api/analyze
```

---

## 🔍 VERIFICAR SE ESTÁ TUDO OK

### ✅ Checklist:

- [ ] Extensão carregada no Chrome sem erros
- [ ] Servidor Python rodando em `http://localhost:5000`
- [ ] Health check retorna `{"status": "ok"}`
- [ ] Popup da extensão abre ao clicar no ícone
- [ ] Backend Railway está rodando

### Debugar Problemas:

#### Extensão não carrega:
```
1. Verificar console do Chrome (F12)
2. Verificar manifest.json está válido
3. Recarregar extensão em chrome://extensions/
```

#### Python MAS não inicia:
```
1. Verificar .env existe e tem GOOGLE_API_KEY
2. Verificar porta 5000 não está em uso
3. Ver logs de erro no terminal
```

#### Transações não são analisadas:
```
1. Verificar console do navegador (F12)
2. Verificar logs do Python (terminal do servidor)
3. Verificar extensão tem permissões corretas
```

---

## 🎯 PRÓXIMOS PASSOS

### Desenvolvimento:
1. **Implementar lógica real dos agentes** em `vetra_mas/agents/`
2. **Integrar APIs externas** (Jupiter, Raydium, etc)
3. **Adicionar testes** automatizados
4. **Deploy Python MAS** em produção (Railway/Cloud Run)

### Deploy Produção:
1. **Build Anchor programs**: `cd programs && anchor build`
2. **Deploy contratos**: `anchor deploy --provider.cluster mainnet-beta`
3. **Publicar extensão**: Chrome Web Store
4. **Configurar CI/CD**: GitHub Actions

---

## 📚 RECURSOS

- **Documentação completa**: `BUILD_SUMMARY.md`
- **Arquitetura**: `docs/ARCHITECTURE.md`
- **API Spec**: `backend/docs/MULTI_AGENT_API_SPEC.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING_TRANSACTIONS.md`

---

## 🆘 PROBLEMAS COMUNS

### Erro: "GOOGLE_API_KEY not found"
```bash
# Solução: Criar .env no vetra_mas/
echo "GOOGLE_API_KEY=sua_chave" > vetra_mas/.env
```

### Erro: "Port 5000 already in use"
```bash
# Solução: Usar outra porta
python -m uvicorn vetra_service:app --port 5001
```

### Extensão: "Failed to fetch"
```bash
# Solução: Verificar CORS e backend URL
# Ver console do navegador para detalhes
```

---

**🎉 Pronto! Vetra está funcionando localmente!**

Para produção, siga os passos em `BUILD_SUMMARY.md`.

