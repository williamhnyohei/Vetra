# Guia de Interceptação de Transações Solana

## 🛡️ Como Funciona

A extensão Vetra intercepta **automaticamente** todas as transações Solana na **Mainnet** antes que sejam assinadas ou enviadas.

### Fluxo de Interceptação

```
Website/dApp → window.solana → Vetra Injected Script → Content Script → Background Script → API Backend
                                      ↓                                      ↓
                                 [Intercepta]                          [Analisa Risco]
                                      ↓                                      ↓
                                 [Serializa TX]                        [Retorna Score]
                                      ↓                                      ↓
                                 [Envia para análise] ← ← ← ← ← ←   [Abre popup se alto risco]
```

## 🎯 Métodos Interceptados

A extensão intercepta os seguintes métodos do `window.solana`:

1. **`signTransaction`** - Assinar uma transação
2. **`signAllTransactions`** - Assinar múltiplas transações
3. **`signAndSendTransaction`** - Assinar e enviar transação
4. **`sendTransaction`** - Enviar transação
5. **`request`** - Requisições genéricas do Wallet Adapter

## 🧪 Como Testar

### 1. Instalar a Extensão

1. Abra `chrome://extensions/`
2. Ative o "Modo do desenvolvedor"
3. Clique em "Carregar sem compactação"
4. Selecione a pasta `frontend/extension/dist`

### 2. Testar em um dApp Solana

Visite qualquer dApp Solana na mainnet, por exemplo:

- **Jupiter** - https://jup.ag (DEX)
- **Magic Eden** - https://magiceden.io (NFT Marketplace)
- **Raydium** - https://raydium.io (DeFi)
- **Phantom Demo** - https://phantom.app/learn/developers/sandbox

### 3. Realizar uma Transação

1. Conecte sua carteira (Phantom, Solflare, etc.)
2. Tente realizar qualquer ação que requer assinatura:
   - Swap de tokens
   - Compra de NFT
   - Stake/Unstake
   - Transfer

### 4. Verificar Interceptação

Abra o **DevTools** (`F12`) e vá para a aba **Console**. Você verá:

```
🟣 Vetra injected script loaded
🌐 Network: Solana Mainnet
✅ window.solana wrapped successfully!
🛡️ Vetra protection active on Solana Mainnet

🎯 INTERCEPTED signTransaction!!!
📤 Sending transaction for analysis...
📥 Transaction analysis response: {...}
⚠️ Risk Score: 45/100
📊 Risk Level: medium
```

### 5. Verificar no Backend

As transações interceptadas são enviadas para análise e salvas no banco de dados se você estiver autenticado.

Você pode ver no **Railway PostgreSQL**:
```sql
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;
```

## 📊 Informações Capturadas

Para cada transação interceptada, capturamos:

- **Método** - Qual função foi chamada (signTransaction, etc.)
- **URL** - De qual site a transação foi iniciada
- **Timestamp** - Quando a transação foi interceptada
- **Transaction Data**:
  - Instructions (instruções da transação)
  - Recent Blockhash
  - Fee Payer
  - Signatures
  - Amount e Token (se aplicável)

## 🚨 Alertas de Alto Risco

Quando uma transação é classificada como **ALTO RISCO**:

1. ✅ A transação é **analisada**
2. ⚠️ O **popup** da extensão abre **automaticamente**
3. 🔍 O usuário vê os **detalhes do risco**
4. 🛡️ O usuário pode **aprovar ou rejeitar**

## 🔧 Configurações

Os usuários podem ajustar:

- **Risk Threshold** - Limiar de risco para alertas
- **Auto Block High Risk** - Bloquear automaticamente transações de alto risco
- **Transaction Memory** - Lembrar decisões anteriores

## 📝 Logs e Debug

### Console do Injected Script

```javascript
// Para ver se a interceptação está ativa
console.log(window.solana);
// Deve mostrar um Proxy, não o objeto original
```

### Console do Background Script

```javascript
// Para ver análises em tempo real
chrome.runtime.getBackgroundPage().console
```

## 🎨 Estados Visuais

- **Verde** 🟢 - Baixo risco, transação segura
- **Amarelo** 🟡 - Médio risco, cuidado necessário
- **Vermelho** 🔴 - Alto risco, perigo!

## 🔒 Segurança

- ✅ Todas as transações são analisadas **antes** de serem assinadas
- ✅ Nenhuma chave privada é acessada ou armazenada
- ✅ O usuário sempre tem controle final
- ✅ A extensão nunca bloqueia sem permissão do usuário

## 🌐 Compatibilidade

A extensão funciona com:

- ✅ Phantom Wallet
- ✅ Solflare
- ✅ Backpack
- ✅ Qualquer wallet que implemente o padrão `window.solana`

## 📚 Arquivos Principais

- `src/injected/index.ts` - Intercepta `window.solana`
- `src/content/index.ts` - Ponte entre página e extensão
- `src/background/index.ts` - Processa análises
- `src/lib/solana/transaction-parser.ts` - Parse de transações

## 🐛 Troubleshooting

**Problema**: Transações não estão sendo interceptadas

**Soluções**:
1. Recarregue a extensão em `chrome://extensions/`
2. Recarregue a página do dApp
3. Verifique se há erros no console
4. Certifique-se de que o dApp usa `window.solana`

**Problema**: Popup não abre automaticamente

**Solução**:
- O Chrome pode bloquear popups automáticos
- Clique manualmente no ícone da extensão

## 🚀 Próximos Passos

- [ ] Adicionar UI de aprovação inline na página
- [ ] Suporte para transações multi-sig
- [ ] Histórico de transações rejeitadas
- [ ] Whitelist de sites confiáveis
- [ ] Blacklist de endereços maliciosos

## 📞 Suporte

Se encontrar problemas, abra uma issue no GitHub com:
- Logs do console
- URL do dApp
- Screenshot do erro
- Versão da extensão

