# Tem em Casa

Controle de estoque doméstico com compartilhamento familiar em tempo real.

---

## Estrutura

```
dispensa/
├── backend/          ← C# .NET 8 + PostgreSQL
└── frontend/         ← React 18 + Vite + Capacitor 6
```

---

## ▶️ Fase 1 — Rodar o Backend Localmente

### Pré-requisitos
- .NET 8 SDK
- Docker Desktop

```bash
cd backend

# 1. Copiar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 2. Subir o banco de dados PostgreSQL
docker-compose up -d db

# 3. Rodar as migrations e a API
cd DispensaApi
dotnet run
# Acesse: http://localhost:5000/swagger
```

---

## ▶️ Fase 2 — Firebase (faça antes do frontend)

1. Acesse https://console.firebase.google.com
2. Criar projeto → **Tem em Casa**
3. Authentication → Google → Habilitar
4. Project Settings → General → Adicionar app Android
   - Package: `com.querencialabs.temencasa`
   - Baixar `google-services.json`
5. Project Settings → Service Accounts → Gerar chave privada
   - Salvar como `serviceAccountKey.json`
   - Copiar o conteúdo para `FIREBASE_SERVICE_ACCOUNT_KEY` no `.env` do backend
6. Cloud Messaging → Habilitar

---

## ▶️ Fase 3 — Frontend

```bash
cd frontend

# 1. Copiar variáveis de ambiente
cp .env.example .env
# Preencher com valores do Firebase Console + URL do backend

# 2. Instalar dependências
npm install

# 3. Rodar em dev
npm run dev
```

---

## ▶️ Fase 4 — Build Android (APK/AAB)

```bash
cd frontend

# 1. Build do frontend
npm run build

# 2. Inicializar Capacitor (só na primeira vez)
npx cap init "Tem em Casa" com.querencialabs.temencasa --web-dir dist

# 3. Adicionar plataforma Android (só na primeira vez)
npx cap add android

# 4. Copiar google-services.json para o Android
cp /caminho/para/google-services.json android/app/google-services.json

# 5. Sincronizar e abrir no Android Studio
npm run cap:android
```

### No Android Studio:
1. `Build → Generate Signed Bundle/APK`
2. Escolher `Android App Bundle (AAB)`
3. Criar keystore (guarde o arquivo .jks com segurança!)
4. Gerar o AAB assinado

---

## ▶️ Fase 5 — Deploy Backend (Render + Neon)

### Banco de dados — Neon (PostgreSQL gratuito)
1. Acesse https://neon.tech → Create project → **tem-em-casa**
2. Copiar a **connection string direta** (sem `-pooler`) → `DATABASE_URL`

### Backend — Render
1. Acesse https://render.com → New Web Service → Deploy from GitHub
2. Selecionar a pasta `backend`, runtime: Docker
3. Variáveis de ambiente:
   - `DATABASE_URL` — connection string do Neon
   - `FIREBASE_PROJECT_ID` — ID do projeto Firebase
   - `FIREBASE_SERVICE_ACCOUNT_KEY` — JSON da service account em base64
   - `JWT_SECRET` — string aleatória longa (mínimo 32 chars)
   - `Jwt__Issuer=dispensa-api`
   - `Jwt__Audience=dispensa-app`
   - `FrontendUrl` — URL do frontend (ou deixar em branco para só mobile)
4. URL pública gerada → colocar em `VITE_API_URL` no `.env.production` do frontend

### Manter ativo — UptimeRobot
- Monitor HTTP(s) em `https://<sua-url>.onrender.com/api/auth/health`
- Intervalo: 5 minutos (evita o sleep do plano free)

---

## ▶️ Fase 6 — Publicar na Play Store

1. Criar conta em https://play.google.com/console (US$ 25 — única vez)
2. Criar → Novo app → "Tem em Casa" → Categoria: Casa e moradia
3. Configurar ficha: descrição, screenshots, feature graphic
4. Política de privacidade (obrigatória) — criar página no GitHub Pages ou Notion
5. Upload do AAB assinado
6. Submeter para revisão interna → depois produção (3–7 dias)

---

## ✅ Checklist de Publicação

- [ ] Login com e-mail/senha funcionando no device físico
- [ ] Criar e entrar em grupo familiar
- [ ] CRUD de produtos completo
- [ ] Alertas exibidos corretamente
- [ ] Lista de compras gerada
- [ ] WhatsApp funcionando
- [ ] Notificações push chegando (app fechado)
- [ ] Leitor de código de barras
- [ ] Sincronização automática entre membros
- [ ] Splash screen e ícone configurados
- [ ] AAB assinado gerado
- [ ] Política de privacidade publicada
- [ ] Ficha completa na Play Store

---

## 🔑 Variáveis de Ambiente

### backend/.env
```
DB_PASSWORD=senha_segura
FIREBASE_PROJECT_ID=temencasa-xxxxx
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
JWT_SECRET=chave_longa_aqui_32_chars_minimo
FRONTEND_URL=https://app.temencasa.com
```

### frontend/.env
```
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=xxxxx
VITE_FIREBASE_AUTH_DOMAIN=temencasa-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=temencasa-xxxxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxx
VITE_FIREBASE_APP_ID=xxxxx
VITE_FIREBASE_VAPID_KEY=xxxxx
```
