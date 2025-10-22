# 🚂 Deploy do Vetra Backend no Railway

Guia completo para fazer deploy do backend da Vetra na plataforma Railway.

---

## 📋 Pré-requisitos

- Conta no [Railway](https://railway.app/)
- Conta no GitHub (para conectar o repositório)
- Git instalado localmente

---

## 🚀 Deploy Rápido (5 minutos)

### 1. Preparar o Repositório

```bash
# Certifique-se de que está na branch main
git checkout main

# Commit todas as mudanças
git add .
git commit -m "chore: prepare for Railway deployment"
git push origin main
```

### 2. Criar Novo Projeto no Railway

1. Acesse [railway.app](https://railway.app/)
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Autorize o Railway a acessar seu GitHub
5. Selecione o repositório **Vetra**

### 3. Configurar o Serviço Backend

#### Opção A: Deploy Direto (Recomendado)

1. Railway detectará automaticamente Node.js
2. Vá em **Settings → Environment**
3. Defina **Root Directory** como: `backend`
4. Salve as mudanças

#### Opção B: Deploy com Docker

1. Railway detectará o Dockerfile
2. Certifique-se de que está usando `Dockerfile` na raiz do backend
3. Railway fará build automaticamente

### 4. Adicionar PostgreSQL

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database → PostgreSQL"**
3. Railway criará automaticamente e injetará a variável `DATABASE_URL`

### 5. Adicionar Redis

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database → Redis"**
3. Railway criará automaticamente e injetará a variável `REDIS_URL`

### 6. Configurar Variáveis de Ambiente

Vá em **Backend Service → Variables** e adicione:

```bash
# Essenciais
NODE_ENV=production
PORT=3000
API_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# JWT (gere secrets seguros)
JWT_SECRET=seu-secret-super-seguro-aqui
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=seu-refresh-secret
JWT_REFRESH_EXPIRE=30d

# Google OAuth
GOOGLE_CLIENT_ID=seu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GOOGLE_CALLBACK_URL=${{RAILWAY_PUBLIC_DOMAIN}}/api/auth/google/callback

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta

# CORS (substitua com seu extension ID)
CORS_ORIGIN=chrome-extension://seu-extension-id,http://localhost:5173

# Logs
LOG_LEVEL=info

# Feature Flags
ENABLE_WEBSOCKET=true
ENABLE_SWAGGER_DOCS=true
```

**Nota:** `DATABASE_URL` e `REDIS_URL` são injetadas automaticamente pelo Railway!

### 7. Configurar Domínio Público

1. Vá em **Backend Service → Settings**
2. Em **Networking → Public Networking**, clique **"Generate Domain"**
3. Railway gerará um domínio: `seu-app.up.railway.app`
4. Atualize `GOOGLE_CALLBACK_URL` com este domínio

### 8. Deploy!

1. Railway iniciará o deploy automaticamente
2. Acompanhe os logs em **Build Logs** e **Deploy Logs**
3. Aguarde até ver: ✅ **"Deployment successful"**

---

## ✅ Verificação

Após o deploy, teste:

```bash
# Health check
curl https://seu-app.up.railway.app/api/health

# Deve retornar:
{
  "status": "ok",
  "timestamp": "2025-10-22T...",
  "uptime": 123.45,
  "database": "connected",
  "redis": "connected"
}
```

### Acessar Documentação API

🔗 https://seu-app.up.railway.app/api/docs

---

## 🔧 Configurações Avançadas

### Migrations Automáticas

O comando de start já executa migrations:
```json
"start": "npm run db:migrate && npm start"
```

Se preferir executar manualmente:

```bash
# No Railway CLI
railway run npm run db:migrate
```

### Custom Start Command

Se precisar customizar, vá em **Settings → Deploy**:

```bash
npm run db:migrate && npm run db:seed && npm start
```

### Habilitar WebSocket

Railway suporta WebSocket por padrão. Certifique-se de:

```bash
ENABLE_WEBSOCKET=true
```

### Configurar Health Checks

Railway já usa o endpoint `/api/health`. Configurado em `railway.json`:

```json
{
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100
  }
}
```

---

## 🗄️ Gerenciamento de Banco de Dados

### Conectar ao PostgreSQL via CLI

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Conectar ao projeto
railway link

# Acessar PostgreSQL
railway connect postgres
```

### Executar Migrations

```bash
# Via Railway CLI
railway run npm run db:migrate

# Rollback
railway run npm run db:rollback

# Seeds
railway run npm run db:seed
```

### Backup do Banco

Railway faz backup automático. Para backup manual:

```bash
# Exportar DATABASE_URL
railway variables

# Usar pg_dump localmente
pg_dump $DATABASE_URL > backup.sql
```

---

## 📊 Monitoramento

### Logs em Tempo Real

```bash
railway logs
```

Ou acesse via Dashboard Railway → **Deployments → View Logs**

### Métricas

Railway fornece:
- CPU Usage
- Memory Usage
- Network Traffic
- Request Count

Acesse: **Service → Metrics**

### Alertas

Configure em **Settings → Observability**

---

## 🔄 CI/CD Automático

Railway faz deploy automático quando você faz push:

```bash
# Qualquer push no main dispara deploy
git push origin main
```

### Deploy de Branch Específica

1. Vá em **Settings → Source**
2. Mude **Branch** de `main` para sua branch
3. Railway fará deploy da branch escolhida

### Preview Deployments

Para testar antes do production:

1. Crie um Pull Request no GitHub
2. Railway criará automaticamente um **Preview Environment**
3. Cada PR terá sua própria URL temporária

---

## 🛡️ Segurança

### Variáveis Secretas

✅ **BOM:** Usar Railway Variables (criptografadas)  
❌ **RUIM:** Commitar secrets no código

### Gerar Secrets Seguros

```bash
# JWT Secret (64 caracteres)
openssl rand -base64 64

# Session Secret
openssl rand -hex 32
```

### SSL/TLS

✅ Railway fornece SSL automático para todos os domínios `*.up.railway.app`

### Firewall

Railway protege automaticamente contra:
- DDoS attacks
- SQL injection (use prepared statements)
- XSS (já configurado no helmet.js)

---

## 💰 Custos

Railway oferece:

- **Hobby Plan:** $5/mês + uso
- **Pro Plan:** $20/mês + uso

**Estimativa para Vetra:**
- Backend (Node.js): ~$5-10/mês
- PostgreSQL: ~$2-5/mês
- Redis: ~$2-5/mês

**Total:** ~$10-20/mês

### Otimização de Custos

1. Use **sleep mode** para ambientes de dev
2. Defina **auto-scaling limits**
3. Monitore uso via Dashboard

---

## 🐛 Troubleshooting

### Erro: "Build Failed"

```bash
# Verificar logs
railway logs --build

# Comum: dependências faltando
# Solução: Certificar que package.json está correto
```

### Erro: "Database Connection Failed"

```bash
# Verificar se PostgreSQL está rodando
railway status

# Verificar DATABASE_URL
railway variables | grep DATABASE_URL

# Solução: Reiniciar o serviço PostgreSQL
```

### Erro: "Migration Failed"

```bash
# Executar migrations manualmente
railway run npm run db:migrate

# Se falhar, rollback e tentar novamente
railway run npm run db:rollback
railway run npm run db:migrate
```

### Erro: "Port Already in Use"

Railway define a porta via `PORT` environment variable. Certifique-se de usar:

```javascript
const PORT = process.env.PORT || 3000;
```

### Logs não aparecem

```bash
# Verificar se winston está configurado para stdout
LOG_LEVEL=debug railway logs
```

---

## 🔗 Links Úteis

- [Railway Docs](https://docs.railway.app/)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [Railway Templates](https://railway.app/templates)
- [Railway Status](https://status.railway.app/)
- [Railway Discord](https://discord.gg/railway)

---

## 📞 Suporte

### Railway Support

- Discord: https://discord.gg/railway
- Email: team@railway.app

### Vetra Team

- GitHub Issues: https://github.com/vetra/vetra/issues
- Email: support@vetra.com

---

## ✅ Checklist Final

Antes de considerar o deploy completo:

- [ ] PostgreSQL criado e conectado
- [ ] Redis criado e conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Migrations executadas com sucesso
- [ ] Health check retorna 200 OK
- [ ] Swagger docs acessível
- [ ] CORS configurado para extension
- [ ] Google OAuth configurado
- [ ] Logs estão aparecendo corretamente
- [ ] WebSocket funcionando (se habilitado)
- [ ] Domínio público gerado
- [ ] Extension atualizada com novo API_URL

---

**🎉 Parabéns! Seu backend Vetra está no ar!**

Próximo passo: Atualizar frontend extension com a nova `API_URL` do Railway.

```typescript
// frontend/extension/.env
VITE_API_URL=https://seu-app.up.railway.app/api
VITE_WS_URL=wss://seu-app.up.railway.app
```

