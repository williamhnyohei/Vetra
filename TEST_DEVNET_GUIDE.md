# 🧪 GUIA DE TESTE - DEVNET

Teste de interceptação do Vetra usando página HTML simples na Devnet.

---

## 🎯 **OBJETIVO**

Testar se o Vetra intercepta transações corretamente usando um HTML de teste controlado.

---

## 📋 **PRÉ-REQUISITOS**

1. ✅ Extensão Vetra instalada e recarregada
2. ✅ Phantom Wallet instalado
3. ✅ Phantom configurado para **Devnet** (importante!)
4. ✅ SOL na carteira Devnet (mínimo 0.1 SOL)

---

## 🔧 **SETUP RÁPIDO**

### **1. Configurar Phantom para Devnet**

1. Abrir Phantom Wallet
2. Clicar em **⚙️ Settings**
3. **Developer Settings** ou **Network**
4. Selecionar **Devnet**
5. ✅ Deve aparecer "Devnet" no topo

### **2. Obter SOL de Teste**

**Opção A: Via Faucet Web**
```
https://faucet.solana.com
```
Cole seu endereço e peça 1 SOL

**Opção B: Via CLI**
```bash
solana config set --url https://supertea-solanan-66b1.devnet.rpcpool.com/d914275f-7a7d-491c-9f0e-61cb6466f39a
solana airdrop 2
```

---

## 🧪 **EXECUTAR TESTE**

### **1. Abrir arquivo HTML**

**Opção A: Duplo clique**
```
test-devnet-transaction.html
```

**Opção B: Via navegador**
```
file:///C:/Users/william_yohei/Documents/Vetra/test-devnet-transaction.html
```

### **2. Abrir Console (F12)**

**IMPORTANTE:** Mantenha o console aberto para ver os logs do Vetra!

### **3. Clicar em "Conectar Phantom Wallet"**

**Logs esperados:**
```
🌐 Página carregada
✅ Phantom detectado!
🔌 Tentando conectar ao Phantom...
✅ Conectado ao Phantom!
🔑 Public Key: 7xKXtg...
💰 Saldo: 2.0000 SOL
```

### **4. Clicar em "Enviar Transação de Teste"**

**Logs esperados (SE VETRA FUNCIONAR):**
```
🚀 Iniciando transação de teste...
📤 Origem: 7xKXtg...
📥 Destino: 4vMsoU...
💰 Valor: 0.01 SOL
🔗 Obtendo blockhash da Devnet...
✅ Transação criada com sucesso
⚠️ CHAMANDO window.solana.signTransaction()...
🛡️ VETRA DEVE INTERCEPTAR AGORA!

↓↓↓ SE VETRA FUNCIONAR ↓↓↓

🔐 Vetra: Intercepting transaction signature request  ← ISTO!
```

**E o popup do Vetra deve abrir!** 🎉

---

## 🔍 **O QUE VERIFICAR NO CONSOLE**

### **Logs do Vetra (devem aparecer ANTES do teste):**

```
🟢 Vetra content script loaded at file:///...
✅ Injected via chrome.scripting
🟣 Vetra injected script loaded
✅ Vetra: Property setter installed for window.solana
✅ Vetra: Solana provider being set, wrapping now!
🟣 Vetra: Creating proxy wrapper for provider...
✅ Vetra: Provider successfully wrapped via setter!
```

### **Momento da Interceptação:**

Quando clicar em "Enviar Transação de Teste", DEVE aparecer:
```
🔐 Vetra: Intercepting transaction signature request
```

**Se NÃO aparecer:** Vetra não está interceptando (bug ainda existe)

---

## ✅ **CENÁRIOS POSSÍVEIS**

### **CENÁRIO 1: Sucesso Total** ✅

**Logs:**
```
🔐 Vetra: Intercepting transaction signature request
✅ Vetra: Received analysis response
✅ Vetra: Transaction approved, signing...
✅ Transação assinada!
```

**Comportamento:**
- Popup Vetra abre
- Mostra análise de risco
- Usuário decide aprovar/rejeitar
- Se aprovar: transação é assinada

**Resultado:** ✅ **VETRA FUNCIONANDO PERFEITAMENTE!**

---

### **CENÁRIO 2: Vetra Bloqueia** 🛡️

**Logs:**
```
🔐 Vetra: Intercepting transaction signature request
🚫 Vetra: Transaction blocked by user
❌ Erro: Transaction blocked by Vetra security analysis
🛡️ SUCESSO! Vetra bloqueou a transação!
```

**Comportamento:**
- Popup Vetra abre
- Mostra alto risco
- Usuário clica "Cancelar"
- Transação é bloqueada

**Resultado:** ✅ **VETRA FUNCIONANDO! (bloqueou como deveria)**

---

### **CENÁRIO 3: Vetra NÃO Intercepta** ❌

**Logs:**
```
⚠️ CHAMANDO window.solana.signTransaction()...
✅ Transação assinada!  ← Sem passar pelo Vetra!
```

**Comportamento:**
- Phantom abre direto
- Sem popup Vetra
- Transação assina sem análise

**Resultado:** ❌ **VETRA NÃO FUNCIONANDO (bug ainda existe)**

---

## 🐛 **DEBUGGING**

### **Se não funcionar, verificar:**

1. **Console mostra wrapping?**
   ```
   ✅ Vetra: Provider successfully wrapped via setter!
   ```
   - Se SIM: Wrapping OK, problema é no interceptor
   - Se NÃO: Wrapping falhou, problema no property setter

2. **Extensão recarregada?**
   ```
   chrome://extensions/ → 🔄 Reload
   ```

3. **Phantom em Devnet?**
   - Ver topo da carteira: deve dizer "Devnet"

4. **Verificar variável wrappada:**
   ```javascript
   // No console da página:
   console.log(window.solana);
   console.log(window.solana.signTransaction);
   ```

---

## 📊 **LOGS DO BACKEND**

Acesse Railway logs para ver se backend recebe a requisição:

**Deve aparecer:**
```
💾 Step 1: Saving transaction as INTERCEPTED
🤖 Step 2: Performing risk analysis...
💾 Step 3: Updating with analysis results
```

**Se NÃO aparecer:** Extensão não está enviando para backend

---

## 🎓 **DIFERENÇA vs RAYDIUM**

| HTML Teste | Raydium |
|-----------|---------|
| ✅ Simples | ❌ Complexo |
| ✅ Sem iframe | ❌ Pode ter iframe |
| ✅ Código visível | ❌ Minificado |
| ✅ Fácil debuggar | ❌ Difícil debuggar |
| ✅ Controle total | ❌ Sem controle |

Se funcionar no HTML mas não no Raydium = problema específico do Raydium

---

## 🚀 **COMEÇAR AGORA**

```bash
# 1. Abrir arquivo
start test-devnet-transaction.html

# 2. F12 (abrir console)

# 3. Conectar Phantom

# 4. Enviar transação

# 5. Ver se Vetra intercepta!
```

---

**🎯 TESTE E ME DIGA: Apareceu "🔐 Vetra: Intercepting transaction signature request"?** 🔥

