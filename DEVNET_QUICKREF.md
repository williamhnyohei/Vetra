# ⚡ DEVNET - Referência Rápida

Comandos essenciais para configurar e usar Devnet no Vetra.

---

## 🔧 **CONFIGURAÇÃO INICIAL** (Fazer uma vez)

### 1. Extensão Chrome
```bash
cd frontend/extension

# Criar .env.development
echo VITE_SOLANA_RPC_URL=https://supertea-solanan-66b1.devnet.rpcpool.com/d914275f-7a7d-491c-9f0e-61cb6466f39a > .env.development
echo VITE_SOLANA_NETWORK=devnet >> .env.development
echo VITE_SOLANA_CLUSTER=devnet >> .env.development

# Build
pnpm build

# Recarregar no Chrome: chrome://extensions/
```

### 2. Backend Railway
```bash
# No Railway Dashboard, adicionar variáveis:
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://supertea-solanan-66b1.devnet.rpcpool.com/d914275f-7a7d-491c-9f0e-61cb6466f39a
SOLANA_CLUSTER=devnet
```

### 3. Solana CLI
```bash
# Configurar para Devnet
solana config set --url https://supertea-solanan-66b1.devnet.rpcpool.com/d914275f-7a7d-491c-9f0e-61cb6466f39a

# Obter SOL
solana airdrop 2
```

---

## 📦 **DEPLOY ANCHOR PROGRAMS**

```bash
cd programs

# Build
anchor build

# Deploy
anchor deploy

# Anotar o Program ID!
# Exemplo: 8Xz9UqHgJPQvYZmV7K3nXjL5...
```

### Adicionar Program ID:
```bash
# Railway: ATTESTATION_PROGRAM_ID=8Xz...
# Extensão: VITE_ATTESTATION_PROGRAM_ID=8Xz...
```

---

## 🔄 **WORKFLOW DIÁRIO**

### Rebuild Extensão após mudanças:
```bash
cd frontend/extension
pnpm build
# Recarregar no Chrome
```

### Ver logs Backend:
```bash
railway logs -f
```

### Verificar saldo Devnet:
```bash
solana balance
```

### Airdrop mais SOL:
```bash
solana airdrop 2
```

---

## 🧪 **TESTES**

### Testar RPC:
```bash
curl https://supertea-solanan-66b1.devnet.rpcpool.com/d914275f-7a7d-491c-9f0e-61cb6466f39a \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

### Ver transação na Devnet:
```
https://solscan.io/?cluster=devnet
https://explorer.solana.com/?cluster=devnet
```

---

## 🐛 **TROUBLESHOOTING**

### Extensão não usa Devnet:
```bash
cd frontend/extension
cat .env.development  # Verificar conteúdo
pnpm build            # Rebuild
# Chrome: Recarregar extensão
```

### Solana CLI usa rede errada:
```bash
solana config get  # Ver configuração atual
solana config set --url https://supertea-solanan-66b1.devnet.rpcpool.com/d914275f-7a7d-491c-9f0e-61cb6466f39a
```

### Sem SOL na Devnet:
```bash
solana airdrop 2  # Pode fazer várias vezes
```

---

## 📋 **CHECKLIST**

- [ ] `.env.development` criado na extensão
- [ ] Extensão rebuildada e recarregada
- [ ] Backend Railway com variáveis de devnet
- [ ] Solana CLI configurado para devnet
- [ ] SOL de devnet na carteira
- [ ] Carteira (Phantom/Solflare) em modo Devnet

---

## 🔗 **SUAS URLs**

```
RPC Devnet (com API Key):
https://supertea-solanan-66b1.devnet.rpcpool.com/d914275f-7a7d-491c-9f0e-61cb6466f39a

Solscan Devnet:
https://solscan.io/?cluster=devnet

Explorer Devnet:
https://explorer.solana.com/?cluster=devnet
```

---

**Para guia completo, ver**: `DEVNET_SETUP.md`

