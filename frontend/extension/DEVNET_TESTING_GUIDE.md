# 🧪 Guia Completo: Testando Vetra no Solana Devnet

## 🎯 Por Que Testar em Devnet?

- ✅ **100% GRÁTIS** - SOL fake, sem gastar dinheiro real
- ✅ **SEM RISCOS** - Pode testar transações perigosas à vontade
- ✅ **ILIMITADO** - Pegue SOL grátis quantas vezes quiser
- ✅ **MESMA EXPERIÊNCIA** - Funciona exatamente como Mainnet

---

## 📋 Passo a Passo Completo

### **Passo 1: Configure sua Carteira para Devnet**

#### **Se você usa Phantom:**

1. Abra a extensão Phantom
2. Clique no **ícone de configurações** (⚙️) no canto superior direito
3. Role para baixo até **"Developer Settings"**
4. Ative **"Testnet Mode"**
5. No topo da Phantom, clique no dropdown de rede
6. Selecione **"Devnet"**
7. ✅ Pronto! Agora você está em Devnet

#### **Se você usa Solflare:**

1. Abra a extensão Solflare
2. Clique no **ícone de rede** no topo
3. Selecione **"Devnet"**
4. ✅ Pronto!

#### **Se você usa Backpack:**

1. Abra a extensão Backpack
2. Vá em **Settings** → **"Preferences"**
3. Em **"Developer"**, ative **"Developer Mode"**
4. Clique no dropdown de rede no topo
5. Selecione **"Devnet"**
6. ✅ Pronto!

---

### **Passo 2: Pegue SOL Grátis (Airdrop)**

Existem várias maneiras de conseguir SOL de teste:

#### **Opção 1: Faucet Oficial (Recomendado)**

1. Vá para: https://faucet.solana.com
2. Cole seu **endereço da carteira** (copie da Phantom/Solflare)
3. Selecione **"Devnet"**
4. Clique em **"Request Airdrop"** ou **"Confirm Airdrop"**
5. Aguarde alguns segundos
6. ✅ Você receberá **1-2 SOL** de teste

#### **Opção 2: QuickNode Faucet**

1. Vá para: https://faucet.quicknode.com/solana/devnet
2. Cole seu endereço
3. Complete o CAPTCHA
4. Clique em **"Request"**
5. ✅ Você receberá SOL

#### **Opção 3: Via Terminal (Para Desenvolvedores)**

```bash
solana airdrop 2 SEU_ENDERECO --url https://api.devnet.solana.com
```

#### **⚠️ Importante:**
- Você pode pedir airdrop **múltiplas vezes**
- Se der erro "rate limit", espere 1-2 minutos e tente novamente
- Cada airdrop te dá 1-5 SOL de teste

---

### **Passo 3: Acesse um dApp Devnet**

A maioria dos dApps tem uma versão Devnet. Aqui estão os melhores para testar:

#### **🥇 Jupiter (DEX) - RECOMENDADO**

- **URL**: https://jup.ag
- **Como usar**:
  1. Conecte sua carteira (já configurada para Devnet)
  2. Ela vai detectar automaticamente que você está em Devnet
  3. Configure um swap:
     - From: SOL
     - To: USDC-Dev ou qualquer outro token devnet
     - Amount: 0.1 SOL (de teste)
  4. Clique **"Swap"**
  5. ✅ **Vetra vai interceptar!**

#### **🥈 Raydium (Devnet)**

- **URL**: https://raydium.io/swap/?network=devnet
- Nota: Adicione `?network=devnet` na URL

#### **🥉 Orca (Devnet)**

- **URL**: https://www.orca.so (mude para devnet nas configurações)

---

### **Passo 4: Teste a Interceptação**

1. **Abra DevTools** (`F12` ou `Ctrl+Shift+I`)
2. Vá para a aba **Console**
3. Faça uma transação no dApp
4. Você verá:

```javascript
🟣 Vetra injected script loaded
🌐 Network: Solana Devnet (Testing Environment)
💡 Using fake SOL - test safely!
✅ window.solana wrapped successfully!
🛡️ Vetra protection active

🎯 INTERCEPTED signTransaction!!!
📤 Sending transaction for analysis...

🔍 Analyzing transaction on Solana Devnet (Testing)
🧪 Network: DEVNET
💡 Devnet detected - using test SOL (no real money)
📦 Transaction: {...}

⚠️ Risk Score: 45/100
📊 Risk Level: medium
```

---

## 🧪 Cenários de Teste

### **Teste 1: Transação Normal (Baixo Risco)**

1. Jupiter: Swap **0.1 SOL → USDC**
2. ✅ Deve passar direto (baixo risco)
3. Console mostra: `✅ LOW risk - allowing transaction`

### **Teste 2: Transação Suspeita (Alto Risco)**

Para simular alto risco, tente:

1. Swap de valor muito alto: **100 SOL → Token desconhecido**
2. Ou use um endereço suspeito como destinatário
3. ⚠️ Deve mostrar alerta de alto risco

### **Teste 3: Auto-Block Ativado**

1. Vá em **Vetra Settings**
2. Ative **"Auto Block High Risk"**
3. Tente fazer transação suspeita
4. 🚫 Deve ser **bloqueada automaticamente**
5. Console: `🚫 TRANSACTION BLOCKED BY VETRA`

### **Teste 4: Aprovação Manual**

1. Vá em **Vetra Settings**
2. **Desative** "Auto Block High Risk"
3. Tente fazer transação suspeita
4. 🔔 **Popup da Vetra abre**
5. Você vê a UI de aprovação
6. Escolha **Aprovar** ou **Rejeitar**

---

## 🎨 O Que Esperar

### **Console Logs:**

```
🧪 Network: DEVNET
💡 Devnet detected - using test SOL (no real money)
🔍 Analyzing transaction on Solana Devnet (Testing)
```

### **Se Alto Risco + Auto-Block:**

```
🚫 TRANSACTION BLOCKED BY VETRA
⚠️ Reason: High risk transaction blocked automatically (Risk: 85/100)
```

### **Se Alto Risco + Manual:**

- Popup abre com UI bonita
- Mostra risk score, reasons, recommendations
- Botões: 🚫 Reject ou ✅ Approve

---

## 🔄 Voltando para Mainnet

Quando terminar os testes:

1. Abra sua carteira (Phantom/Solflare)
2. Clique no **dropdown de rede**
3. Selecione **"Mainnet"**
4. ✅ Pronto! Voltou para produção

---

## 💡 Dicas Pro

### **Como Pegar Mais SOL de Teste:**

```bash
# Via terminal (se tiver solana CLI)
solana airdrop 2 --url devnet

# Ou use o faucet web várias vezes
```

### **Limpar Histórico de Teste:**

- Transações de Devnet ficam separadas no banco
- Não misturam com suas transações reais

### **Tokens de Teste:**

Em Devnet, todos os tokens são "de mentira":
- SOL → SOL de teste
- USDC → USDC-Dev
- Qualquer NFT → NFT de teste

---

## 🐛 Troubleshooting

### **"Airdrop falhou"**

**Solução:**
- Espere 1-2 minutos entre airdrops
- Tente outro faucet da lista
- Use o terminal se tiver Solana CLI

### **"Carteira não conecta"**

**Solução:**
- Recarregue a página do dApp
- Certifique-se de que está em Devnet na carteira
- Tente desconectar e reconectar

### **"Vetra não intercepta"**

**Solução:**
1. Recarregue a extensão em `chrome://extensions/`
2. Recarregue a página do dApp
3. Verifique o console (`F12`) por erros
4. Certifique-se de que a Vetra está instalada

### **"Transação não aparece na UI"**

**Solução:**
- Transações de Devnet são salvas separadamente
- Abra o console para ver logs detalhados
- Verifique se está autenticado na Vetra

---

## 🎯 Checklist de Teste Completo

- [ ] Configurei carteira para Devnet
- [ ] Peguei SOL de teste (airdrop)
- [ ] Testei swap normal (baixo risco)
- [ ] Testei transação suspeita (alto risco)
- [ ] Testei com Auto-Block ativado
- [ ] Testei com Aprovação Manual
- [ ] Vi os logs no console
- [ ] Vi a UI de aprovação funcionar
- [ ] Aprovei uma transação
- [ ] Rejeitei uma transação
- [ ] Voltei para Mainnet

---

## 🚀 Próximos Passos

Depois de testar em Devnet:

1. **Volte para Mainnet** na sua carteira
2. **Use com confiança** - você sabe que funciona!
3. **Compartilhe feedback** - nos diga o que achou

---

## 📞 Suporte

Problemas? Perguntas?

- 💬 Abra uma issue no GitHub
- 📧 Entre em contato com o suporte
- 🐛 Reporte bugs com screenshots e logs

---

## 🎉 Pronto!

Agora você pode testar **SEM MEDO** em Devnet!

**Lembre-se**: É tudo de mentira, então teste à vontade! 🧪✨

**Divirta-se testando!** 🚀

