🇺🇸 [English Version](README.md) | 🇧🇷 Português

# Tem em Casa

> App mobile de controle de estoque doméstico com compartilhamento familiar em tempo real.

![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)
![C#](https://img.shields.io/badge/C%23-12-239120?logo=csharp&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Capacitor](https://img.shields.io/badge/Capacitor-6-119EFF?logo=capacitor&logoColor=white)
![Android](https://img.shields.io/badge/Android-APK%2FAAB-3DDC84?logo=android&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20FCM-FFCA28?logo=firebase&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Licença](https://img.shields.io/badge/Licen%C3%A7a-MIT-22c55e)
![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento%20Ativo-f97316)

O Tem em Casa permite que famílias gerenciem a despensa e o estoque doméstico em um único lugar. Os membros de um grupo familiar veem as alterações do estoque em tempo real, recebem alertas de estoque baixo e itens próximos do vencimento, e compartilham a lista de compras via WhatsApp — tudo a partir de um app Android nativo construído com React + Capacitor.

---

## Funcionalidades

- **Grupos familiares** — convide membros com código + PIN; todos veem o mesmo estoque
- **CRUD completo de produtos** — nome, quantidade, unidade, mínimo, validade, categoria
- **Alertas de estoque baixo e vencimento** — notificações automáticas quando itens acabam ou estão vencendo
- **Lista de compras automática** — itens abaixo do mínimo aparecem automaticamente
- **Leitor de código de barras** — escaneia produtos pela câmera do dispositivo
- **Notificações push** — Firebase Cloud Messaging (FCM), funciona com o app fechado
- **Sincronização em tempo real** — sync automático a cada 60 s + puxar para atualizar
- **Compartilhamento via WhatsApp** — compartilhe a lista de compras com um toque
- **Histórico de atividades** — registro de todas as ações do grupo
- **Banner offline** — avisa os usuários quando não há conexão

---

## Stack Tecnológica

| Camada | Tecnologia | Finalidade |
|--------|-----------|------------|
| API | ASP.NET Core 8 (C#) | API REST, autenticação JWT |
| Banco | PostgreSQL 16 | Armazenamento persistente |
| ORM | Entity Framework Core 8 | Acesso ao banco de dados |
| Auth | Firebase Authentication | E-mail/senha + recuperação de senha |
| Push | Firebase Cloud Messaging (FCM) | Notificações push |
| Frontend | React 18 + Vite | Componentes de UI |
| Mobile | Capacitor 6 | Wrapper Android nativo (câmera, notificações) |
| Deploy (API) | Render (Docker) | Hospedagem do backend |
| Deploy (DB) | Neon (PostgreSQL serverless) | Banco de dados gerenciado |
| Monitoramento | UptimeRobot | Mantém a instância gratuita do Render ativa |

---

## Estrutura do Projeto

```
dispensa/
├── backend/
│   ├── DispensaApi/            # ASP.NET Core 8 API, controllers, EF Core
│   ├── DispensaApi.Tests/      # Testes de integração e unitários
│   │   ├── Infrastructure/
│   │   └── Tests/
│   ├── Dockerfile
│   └── docker-compose.yml
└── frontend/
    └── src/
        ├── App.jsx
        ├── components/         # Componentes de UI reutilizáveis
        ├── hooks/              # Custom React hooks
        ├── services/           # Cliente API, Firebase, FCM
        ├── store/              # Estado global
        ├── styles/
        └── utils/
```

---

## Pré-requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)
- Um projeto no [Firebase](https://console.firebase.google.com) (plano gratuito é suficiente)
- [Android Studio](https://developer.android.com/studio) (para gerar o APK Android)

---

## Fase 1 — Rodar o Backend Localmente

```bash
cd backend

# 1. Copiar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais (veja a seção de Variáveis de Ambiente abaixo)

# 2. Subir o banco de dados PostgreSQL
docker-compose up -d db

# 3. Rodar migrations e iniciar a API
cd DispensaApi
dotnet run
# Swagger disponível em: http://localhost:5000/swagger
```

---

## Fase 2 — Configurar o Firebase (faça antes do frontend)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Criar projeto → **Tem em Casa**
3. Authentication → Método de login → E-mail/senha → Habilitar
4. Project Settings → Geral → Adicionar app Android
   - Package name: `com.querencialabs.temencasa`
   - Baixar `google-services.json`
5. Project Settings → Contas de serviço → Gerar nova chave privada
   - Salvar como `serviceAccountKey.json`
   - Copiar o conteúdo para `FIREBASE_SERVICE_ACCOUNT_KEY` no `.env` do backend
6. Cloud Messaging → Habilitar

---

## Fase 3 — Frontend

```bash
cd frontend

# 1. Copiar variáveis de ambiente
cp .env.example .env
# Preencher com os valores do Firebase Console e URL do backend

# 2. Instalar dependências
npm install

# 3. Rodar em modo desenvolvimento
npm run dev
```

---

## Fase 4 — Build Android (APK / AAB)

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
npx cap sync android
```

### Build de debug (teste local)

```bash
cd frontend/android
./gradlew assembleDebug
# APK gerado em: app/build/outputs/apk/debug/app-debug.apk

# Instalar via ADB
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Build de release (Play Store)

No Android Studio:
1. `Build → Generate Signed Bundle/APK`
2. Selecionar `Android App Bundle (AAB)`
3. Criar ou selecionar seu keystore (guarde o arquivo `.jks` com segurança!)
4. Gerar o AAB assinado

---

## Variáveis de Ambiente

### backend/.env

| Variável | Descrição |
|----------|-----------|
| `DB_PASSWORD` | Senha do PostgreSQL |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase (ex: `temencasa-xxxxx`) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Conteúdo completo do JSON da service account |
| `JWT_SECRET` | String aleatória, mínimo 32 caracteres |
| `Jwt__Issuer` | `dispensa-api` |
| `Jwt__Audience` | `dispensa-app` |
| `FRONTEND_URL` | URL do frontend (para CORS) |

### frontend/.env

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL do backend (ex: `http://localhost:5000`) |
| `VITE_FIREBASE_API_KEY` | API key do Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain do Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ID do projeto Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID do FCM |
| `VITE_FIREBASE_APP_ID` | App ID do Firebase |
| `VITE_FIREBASE_VAPID_KEY` | Chave VAPID do FCM (para web push) |

---

## Rodando os Testes

```bash
cd backend
dotnet test DispensaApi.Tests/DispensaApi.Tests.csproj
```

---

## Deploy (Render + Neon)

### Banco de dados — Neon (PostgreSQL serverless gratuito)

1. Acesse [neon.tech](https://neon.tech) → Create project → **tem-em-casa**
2. Copie a **connection string direta** (sem `-pooler`) → use como `DATABASE_URL`

### Backend — Render

1. Acesse [render.com](https://render.com) → New Web Service → Deploy from GitHub
2. Selecione a pasta `backend`, runtime: **Docker**
3. Configure as variáveis de ambiente:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | Connection string do Neon |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | JSON da service account (base64) |
| `JWT_SECRET` | String aleatória, mínimo 32 caracteres |
| `Jwt__Issuer` | `dispensa-api` |
| `Jwt__Audience` | `dispensa-app` |
| `FrontendUrl` | URL do frontend (ou em branco para apenas mobile) |

4. Copie a URL pública gerada → coloque em `VITE_API_URL` no `frontend/.env.production`

### Manter ativo — UptimeRobot

- Crie um monitor HTTP(s) apontando para `https://<sua-url>.onrender.com/health`
- Intervalo: 5 minutos (evita o sleep do plano gratuito do Render)
- O endpoint `/health` responde tanto GET quanto HEAD

---

## Fase 5 — Publicar na Play Store

1. Crie conta em [play.google.com/console](https://play.google.com/console) (US$ 25 — taxa única)
2. Criar → Novo app → "Tem em Casa" → Categoria: Casa e moradia
3. Configure a ficha: descrição, screenshots, feature graphic
4. Política de privacidade (obrigatória) — publique a URL em `querencialabs.com/privacidade`
5. Faça upload do AAB assinado
6. Envie para revisão interna → depois produção (3–7 dias)

---

## Checklist de Publicação

- [ ] Login com e-mail/senha funcionando no device físico
- [ ] Recuperação de senha por e-mail funcionando
- [ ] Criar e entrar em grupo familiar
- [ ] CRUD completo de produtos funcionando
- [ ] Alertas de estoque baixo e vencimento exibidos corretamente
- [ ] Lista de compras gerada automaticamente
- [ ] Compartilhamento via WhatsApp funcionando
- [ ] Notificações push chegando (app fechado)
- [ ] Leitor de código de barras funcionando
- [ ] Sincronização automática entre membros
- [ ] Puxar para atualizar funcionando
- [ ] Editar nome do perfil funcionando
- [ ] Splash screen e ícone configurados
- [ ] AAB assinado gerado
- [ ] Política de privacidade publicada
- [ ] Ficha completa na Play Store

---

## Roadmap

- [ ] Suporte a iOS (Capacitor + App Store)
- [ ] Busca de produto por código de barras via Open Food Facts API
- [ ] Lista de compras com quantidades e check-off
- [ ] Itens recorrentes (reabastecimento automático)
- [ ] Histórico de gastos e relatórios mensais
- [ ] Modo escuro

---

## Licença

MIT © [codewiththiago](https://github.com/codewiththiago)
