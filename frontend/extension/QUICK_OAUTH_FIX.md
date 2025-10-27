# 🔧 Como Consertar o OAuth do Google (5 minutos)

## ❌ Erro Atual
```
bad client id: 228752268593-0oc5m1qg37k27t7veo6f4jjtjgg7qtpc.apps.googleusercontent.com
```

Este Client ID não existe ou não está configurado corretamente.

---

## ✅ Solução Rápida

### Passo 1: Obter seu Extension ID
1. Abra `chrome://extensions/`
2. Encontre **Vetra**
3. Copie o **ID** (exemplo: `ekhojjhjdpecbniikbgkfaghpaihbflm`)

### Passo 2: Criar OAuth Client ID no Google
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique em **"+ Create Credentials"** → **"OAuth client ID"**
3. Se pedir para configurar a tela de consentimento:
   - Clique em **"Configure Consent Screen"**
   - Escolha **"External"** → **"Create"**
   - Preencha:
     - **App name:** `Vetra`
     - **User support email:** seu email
     - **Developer contact:** seu email
   - Clique em **"Save and Continue"** (3 vezes)
   - Clique em **"Back to Dashboard"**

4. Volte para **Credentials** → **"+ Create Credentials"** → **"OAuth client ID"**
5. **Application type:** Escolha **"Web application"**
6. **Name:** `Vetra Extension`
7. **Authorized redirect URIs:** Adicione:
   ```
   https://SEU_EXTENSION_ID.chromiumapp.org/
   ```
   **Exemplo:**
   ```
   https://ekhojjhjdpecbniikbgkfaghpaihbflm.chromiumapp.org/
   ```
   ⚠️ **IMPORTANTE:** Substitua `SEU_EXTENSION_ID` pelo ID que você copiou no Passo 1!

8. Clique em **"Create"**
9. **Copie o Client ID** que aparece (formato: `XXXXX-YYYYY.apps.googleusercontent.com`)

### Passo 3: Atualizar a Extensão

Atualize o arquivo `frontend/extension/copy-icons.cjs` na linha 50:

```javascript
// ANTES:
"client_id": "228752268593-0oc5m1qg37k27t7veo6f4jjtjgg7qtpc.apps.googleusercontent.com",

// DEPOIS:
"client_id": "SEU_NOVO_CLIENT_ID.apps.googleusercontent.com",
```

Também atualize `frontend/extension/src/services/auth-service.ts` na linha 173:

```typescript
// ANTES:
const clientId = '228752268593-0oc5m1qg37k27t7veo6f4jjtjgg7qtpc.apps.googleusercontent.com';

// DEPOIS:
const clientId = 'SEU_NOVO_CLIENT_ID.apps.googleusercontent.com';
```

### Passo 4: Rebuild e Teste
```bash
cd frontend/extension
pnpm build
```

Depois:
1. Vá em `chrome://extensions/`
2. Clique em **🔄 Reload** na extensão Vetra
3. Abra a extensão
4. Clique em **"Sign in with Google"**
5. ✅ Deve funcionar!

---

## 📋 Checklist

- [ ] Copiei o Extension ID
- [ ] Criei o OAuth Client ID no Google Cloud Console
- [ ] Adicionei o redirect URI (https://EXTENSION_ID.chromiumapp.org/)
- [ ] Copiei o novo Client ID
- [ ] Atualizei `copy-icons.cjs`
- [ ] Atualizei `auth-service.ts`
- [ ] Rodei `pnpm build`
- [ ] Recarreguei a extensão
- [ ] Testei o login

---

## 🆘 Precisa de Ajuda?

Se você me passar o **Extension ID** e o **Client ID** que você criou, posso atualizar os arquivos automaticamente para você!

**Me envie:**
1. Extension ID (de `chrome://extensions/`)
2. Client ID (do Google Cloud Console)

