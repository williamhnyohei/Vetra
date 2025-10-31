# 🌐 CONFIGURAÇÃO DEVNET - Vetra

Guia completo para configurar o Vetra para usar a Solana Devnet com RPC customizado.

---

## 🔗 **SUAS URLs DE RPC DEVNET**

```
RPC Principal: https://supertea-solanan-66b1.devnet.rpcpool.com
RPC com API Key: https://supertea-solanan-66b1.devnet.rpcpool.com/d914275f-7a7d-491c-9f0e-61cb6466f39a
```

**Recomendação**: Use a URL **com API Key** (segunda URL) para melhor performance e rate limits mais altos.

---

## 🎯 **CONFIGURAÇÃO POR COMPONENTE**

### 1️⃣ **Backend Node.js** (Railway)

#### A. Adicionar Variáveis de Ambiente no Railway

1. Acesse seu projeto no Railway Dashboard
2. Vá para **"Variables"** ou **"Environment Variables"**
3. Adicione estas variáveis:

```env
# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://supertea-solanan-66b1.devnet.rpcpool.com/d914275f-7a7d-491c-9f0e-61cb6466f39a
SOLANA_CLUSTER=devnet

# Programa Anchor (preencher após deploy)
ATTESTATION_PROGRAM_ID=
```

4. Clique em **"Deploy"** para aplicar as mudanças

#### B. Para Desenvolvimento Local (`backend/.env`)

Se for rodar backend localmente (opcional):

```bash
cd backend
notepad .env  # ou use seu editor preferido
```

Adicione:
```env
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Solana Devnet
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://supertea-solanan-66b1.devnet.rpcpool.com/d914275f-7a7d-491c-9f0e-61cb6466f39a
SOLANA_CLUSTER=devnet

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# JWT
JWT_SECRET=...

# Multi-Agent System
MULTI_AGENT_API_URL=http://localhost:5000/api/analyze
MULTI_AGENT_API_KEY=dev-key
```

---

### 2️⃣ **Extensão Chrome (Frontend)**

A extensão usa variáveis de ambiente do Vite para configurar a RPC URL.

#### **Passo 1: Criar arquivo `.env.development`**

```bash
cd frontend/extension
notepad .env.development
```

**Cole este conteúdo**:

```env
# Solana Devnet Configuration
VITE_SOLANA_RPC_URL=https://supertea-solanan-66b1.devnet.rpcpool.com/d914275f-7a7d-491c-9f0e-61cb6466f39a
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_CLUSTER=devnet

# Backend API (ajuste para sua URL do Railway)
VITE_API_URL=https://seu-backend-railway.up.railway.app

# Attestation Program ID (preencher após deploy no devnet)
VITE_ATTESTATION_PROGRAM_ID=
```

#### **Passo 2: Rebuild da Extensão**

Após criar o `.env.development`, reconstrua a extensão:

```bash
cd frontend/extension
pnpm build
```

#### **Passo 3: Recarregar no Chrome**

1. Vá para `chrome://extensions/`
2. Clique no botão de **recarregar** (🔄) na extensão Vetra
3. ✅ Pronto! A extensão agora usa a Devnet!

---

### 3️⃣ **Sistema Python MAS**

O Python MAS não precisa conhecer a rede Solana (ele apenas analisa dados).

**Configuração atual já funciona!** ✅

Mas se quiser adicionar contexto de rede, edite `vetra_mas/.env`:

```env
# Google Gemini
GOOGLE_API_KEY=sua_chave_aqui

# Multi-Agent API
MULTI_AGENT_API_KEY=dev-key
DISABLE_AUTH=true

# Solana (opcional - só para contexto)
SOLANA_NETWORK=devnet
```

---

### 4️⃣ **Programas Anchor (Solana)**

Para fazer o deploy dos programas Anchor no Devnet:

#### **Passo 1: Configurar Solana CLI**

```bash
# Configurar para Devnet
solana config set --url https://supertea-solanan-66b1.devnet.rpcpool.com/d914275f-7a7d-491c-9f0e-61cb6466f39a

# Verificar configuração
solana config get
```

Deve mostrar:
```
RPC URL: https://supertea-solanan-66b1.devnet.rpcpool.com/...
WebSocket URL: (derivado do RPC)
Keypair Path: ~/.config/solana/id.json
Commitment: confirmed
```

#### **Passo 2: Obter SOL de Devnet**

```bash
# Airdrop de 2 SOL (pode fazer várias vezes)
solana airdrop 2

# Verificar saldo
solana balance
```

#### **Passo 3: Build e Deploy**

```bash
cd programs

# Build
anchor build

# Deploy no Devnet
anchor deploy

# Copiar o Program ID que aparecer!
# Exemplo: 8Xz...abc (endereço do seu programa)
```

#### **Passo 4: Atualizar Program ID**

Após o deploy, você receberá um **Program ID**. Adicione ele em:

1. **Backend Railway**:
   ```env
   ATTESTATION_PROGRAM_ID=8Xz...abc
   ```

2. **Extensão** (`.env.development`):
   ```env
   VITE_ATTESTATION_PROGRAM_ID=8Xz...abc
   ```

3. **Rebuild a extensão**:
   ```bash
   cd frontend/extension
   pnpm build
   ```

---

## 🧪 **TESTAR CONFIGURAÇÃO**

### **Teste 1: Backend pode conectar na Devnet**

```bash
# No terminal onde o backend está rodando, os logs devem mostrar:
# "Connected to Solana Devnet"
# "RPC: https://supertea-solanan-66b1..."
```

### **Teste 2: Extensão conecta na Devnet**

1. Abrir popup da extensão
2. Abrir console do navegador (F12)
3. Procurar por: `"Connecting to Solana: devnet"`
4. Verificar: `"RPC: https://supertea-solanan-66b1..."`

### **Teste 3: Testar transação na Devnet**

1. Configurar carteira Phantom/Solflare para **Devnet**
2. Obter SOL de devnet (faucet)
3. Tentar uma transação em https://solscan.io (devnet)
4. Vetra deve interceptar e analisar

---

## 📊 **VERIFICAÇÃO RÁPIDA**

Use esta checklist para garantir que tudo está configurado:

- [ ] **Backend Railway**: Variáveis `SOLANA_NETWORK=devnet` e `SOLANA_RPC_URL` adicionadas
- [ ] **Extensão**: Arquivo `.env.development` criado com RPC URL
- [ ] **Extensão**: Rebuild executado (`pnpm build`)
- [ ] **Extensão**: Recarregada no Chrome
- [ ] **Solana CLI**: Configurado para devnet (`solana config set --url ...`)
- [ ] **Carteira**: Configurada para Devnet (Phantom/Solflare)
- [ ] **SOL Devnet**: Obtido via airdrop (`solana airdrop 2`)

---

## 🔍 **DEBUGGING**

### Problema: Extensão ainda usa Mainnet

**Solução**:
```bash
# 1. Verificar se .env.development existe
cd frontend/extension
dir .env.development

# 2. Rebuild
pnpm build

# 3. Recarregar extensão no Chrome
# chrome://extensions/ -> botão refresh
```

### Problema: Backend não conecta na Devnet

**Solução**:
```bash
# 1. Verificar variáveis no Railway
railway variables

# 2. Ver logs
railway logs

# 3. Forçar redeploy
railway up
```

### Problema: Anchor deploy falha

**Solução**:
```bash
# 1. Verificar configuração Solana
solana config get

# 2. Verificar saldo
solana balance  # Precisa > 2 SOL

# 3. Verificar se está na devnet
solana cluster-version

# 4. Se falhar, usar devnet padrão:
solana config set --url devnet
```

---

## 💡 **DICAS**

### **Performance**

Sua RPC customizada do RPCPool é **muito mais rápida** que a devnet pública:
- ✅ Rate limits mais altos
- ✅ Menor latência
- ✅ Mais estável

### **Custos**

Devnet é **100% gratuita**:
- ✅ SOL de devnet não tem valor real
- ✅ Pode fazer airdrop ilimitado
- ✅ Deploy de programas é grátis

### **Desenvolvimento**

Para desenvolvimento, use sempre Devnet:
1. Teste todas as features
2. Deploy programas
3. Teste integração completa
4. Só depois vá para Mainnet

---

## 🚀 **PRÓXIMOS PASSOS**

### **Agora**:
1. ✅ Configurar backend (Railway)
2. ✅ Configurar extensão (`.env.development`)
3. ✅ Rebuild e testar

### **Depois**:
1. Deploy Anchor programs no Devnet
2. Testar transações reais
3. Validar análise de risco funciona

### **Produção** (futuro):
1. Trocar para Mainnet
2. Usar `.env.production` na extensão
3. Deploy programas no Mainnet

---

## 📚 **RECURSOS**

- **Solana Devnet Faucet**: https://faucet.solana.com
- **Solscan Devnet**: https://solscan.io/?cluster=devnet
- **Solana Explorer Devnet**: https://explorer.solana.com/?cluster=devnet
- **RPCPool Docs**: https://www.rpcpool.com/docs

---

## 📞 **SUPORTE**

Se tiver problemas:
1. Verificar logs do backend: `railway logs`
2. Verificar console da extensão: F12 no Chrome
3. Verificar configuração Solana: `solana config get`
4. Verificar saldo: `solana balance`

---

**✨ Configuração Devnet Completa! ✨**

Seu sistema Vetra agora está configurado para usar a Solana Devnet!
