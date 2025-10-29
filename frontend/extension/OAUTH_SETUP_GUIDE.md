# 🔐 Guia de Configuração do OAuth2 para Vetra Extension

## ⚠️ Informações Necessárias

Antes de começar, você precisa:
- **Extension ID**: Copie de `chrome://extensions/` (exemplo: `ekhojjhjdpecbniikbgkfaghpaihbflm`)

---

## 📋 Passo 1: Acessar o Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Faça login com sua conta Google
3. Se não tiver um projeto, clique em **"Select a project"** → **"New Project"**
   - **Project name:** `Vetra Extension`
   - Clique em **"Create"**

---

## 📋 Passo 2: Configurar a Tela de Consentimento OAuth

1. No menu lateral, vá em: **APIs & Services** → **OAuth consent screen**
2. Escolha **"External"** (permite qualquer usuário Google) → **"Create"**
3. Preencha o formulário:

   **App information:**
   - **App name:** `Vetra`
   - **User support email:** seu email
   - **App logo:** (opcional, pode pular)

   **App domain:** (pode deixar em branco por enquanto)
   
   **Developer contact information:**
   - **Email addresses:** seu email

4. Clique em **"Save and Continue"**

5. **Scopes** (Escopos):
   - Clique em **"Add or Remove Scopes"**
   - Selecione:
     - `openid`
     - `email`
     - `profile`
   - Clique em **"Update"** → **"Save and Continue"**

6. **Test users** (opcional para desenvolvimento):
   - Adicione emails de teste se quiser
   - Clique em **"Save and Continue"**

7. **Summary:**
   - Revise as informações
   - Clique em **"Back to Dashboard"**

---

## 📋 Passo 3: Criar OAuth Client ID

1. No menu lateral, vá em: **APIs & Services** → **Credentials**
2. Clique em **"+ Create Credentials"** → **"OAuth client ID"**
3. Preencha:

   **Application type:** Selecione **"Chrome extension"** ou **"Web application"**
   
   ⚠️ **IMPORTANTE:** Se não houver "Chrome extension", use "Web application"

   **Name:** `Vetra Extension`

   **Authorized redirect URIs:**
   ```
   https://SEU_EXTENSION_ID.chromiumapp.org/
   ```
   
   **Exemplo (substitua SEU_EXTENSION_ID):**
   ```
   https://ekhojjhjdpecbniikbgkfaghpaihbflm.chromiumapp.org/
   ```

4. Clique em **"Create"**

5. **COPIE O CLIENT ID** que aparece
   - Formato: `XXXXX-YYYYY.apps.googleusercontent.com`
   - Exemplo: `123456789-abcdefgh12345678.apps.googleusercontent.com`

---

## 📋 Passo 4: Fornecer as Informações

Depois de completar os passos acima, forneça:

1. **Extension ID:** (de `chrome://extensions/`)
2. **OAuth Client ID:** (do Google Cloud Console)

---

## 🆘 Problemas Comuns

### Erro: "redirect_uri_mismatch"
- Verifique se o redirect URI está correto: `https://SEU_EXTENSION_ID.chromiumapp.org/`
- Certifique-se de incluir a barra `/` no final
- O Extension ID deve ser exatamente o mesmo de `chrome://extensions/`

### Erro: "access_denied"
- Verifique se os scopes estão corretos na tela de consentimento
- Certifique-se de que o app não está restrito a domínios específicos

### Erro: "invalid_client"
- O Client ID pode estar errado
- Verifique se copiou o Client ID completo

---

## ✅ Checklist

- [ ] Criei o projeto no Google Cloud Console
- [ ] Configurei a tela de consentimento OAuth
- [ ] Adicionei os scopes: openid, email, profile
- [ ] Criei o OAuth Client ID
- [ ] Adicionei o redirect URI: `https://EXTENSION_ID.chromiumapp.org/`
- [ ] Copiei o Client ID
- [ ] Copiei o Extension ID

---

## 📞 Próximos Passos

Depois de obter as informações, forneça:
- Extension ID
- OAuth Client ID

E eu vou atualizar automaticamente todos os arquivos necessários!

