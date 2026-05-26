🇧🇷 [Versão em Português](README.pt-BR.md) | 🇺🇸 English

# Tem em Casa

> Mobile app for household inventory management with real-time family sharing.

![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)
![C#](https://img.shields.io/badge/C%23-12-239120?logo=csharp&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Capacitor](https://img.shields.io/badge/Capacitor-6-119EFF?logo=capacitor&logoColor=white)
![Android](https://img.shields.io/badge/Android-APK%2FAAB-3DDC84?logo=android&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20FCM-FFCA28?logo=firebase&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e)
![Status](https://img.shields.io/badge/Status-Active%20Development-f97316)

Tem em Casa lets families manage their pantry and household stock in one place. Members of a family group see inventory changes in real time, get alerts for low stock and expiring items, and share shopping lists via WhatsApp — all from a native Android app built with React + Capacitor.

---

## Features

- **Family groups** — invite members with a code + PIN; everyone sees the same inventory
- **Full product CRUD** — name, quantity, unit, minimum threshold, expiry date, category
- **Low stock & expiry alerts** — automatic notifications when items run low or are about to expire
- **Auto-generated shopping list** — items below minimum threshold appear automatically
- **Barcode scanner** — scan products with the device camera
- **Push notifications** — Firebase Cloud Messaging (FCM), works with the app closed
- **Real-time sync** — automatic sync every 60 s + pull-to-refresh
- **WhatsApp sharing** — share the shopping list with a single tap
- **Activity history** — log of all group actions
- **Offline banner** — notifies users when there is no connection

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| API | ASP.NET Core 8 (C#) | REST API, JWT auth |
| Database | PostgreSQL 16 | Persistent storage |
| ORM | Entity Framework Core 8 | Database access |
| Auth | Firebase Authentication | Email/password + password recovery |
| Push | Firebase Cloud Messaging (FCM) | Push notifications |
| Frontend | React 18 + Vite | UI components |
| Mobile | Capacitor 6 | Native Android wrapper (camera, notifications) |
| Deploy (API) | Render (Docker) | Hosting |
| Deploy (DB) | Neon (serverless PostgreSQL) | Managed database |
| Monitoring | UptimeRobot | Keeps the free Render instance alive |

---

## Project Structure

```
dispensa/
├── backend/
│   ├── DispensaApi/            # ASP.NET Core 8 API, controllers, EF Core
│   ├── DispensaApi.Tests/      # Integration & unit tests
│   │   ├── Infrastructure/
│   │   └── Tests/
│   ├── Dockerfile
│   └── docker-compose.yml
└── frontend/
    └── src/
        ├── App.jsx
        ├── components/         # Reusable UI components
        ├── hooks/              # Custom React hooks
        ├── services/           # API client, Firebase, FCM
        ├── store/              # Global state
        ├── styles/
        └── utils/
```

---

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)
- A [Firebase](https://console.firebase.google.com) project (free tier is sufficient)
- [Android Studio](https://developer.android.com/studio) (for building the Android APK)

---

## Phase 1 — Run the Backend Locally

```bash
cd backend

# 1. Copy environment variables
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section below)

# 2. Start PostgreSQL
docker-compose up -d db

# 3. Apply migrations and start the API
cd DispensaApi
dotnet run
# Swagger available at: http://localhost:5000/swagger
```

---

## Phase 2 — Firebase Setup (required before the frontend)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create project → **Tem em Casa**
3. Authentication → Sign-in method → Email/Password → Enable
4. Project Settings → General → Add Android app
   - Package name: `com.querencialabs.temencasa`
   - Download `google-services.json`
5. Project Settings → Service Accounts → Generate new private key
   - Save as `serviceAccountKey.json`
   - Copy its contents into `FIREBASE_SERVICE_ACCOUNT_KEY` in the backend `.env`
6. Cloud Messaging → Enable

---

## Phase 3 — Frontend

```bash
cd frontend

# 1. Copy environment variables
cp .env.example .env
# Fill in your Firebase Console values and backend URL

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

---

## Phase 4 — Android Build (APK / AAB)

```bash
cd frontend

# 1. Build the web app
npm run build

# 2. Initialize Capacitor (first time only)
npx cap init "Tem em Casa" com.querencialabs.temencasa --web-dir dist

# 3. Add Android platform (first time only)
npx cap add android

# 4. Copy google-services.json to Android
cp /path/to/google-services.json android/app/google-services.json

# 5. Sync and open in Android Studio
npx cap sync android
```

### Debug build (local testing)

```bash
cd frontend/android
./gradlew assembleDebug
# APK output: app/build/outputs/apk/debug/app-debug.apk

# Install via ADB
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Release build (Play Store)

In Android Studio:
1. `Build → Generate Signed Bundle/APK`
2. Select `Android App Bundle (AAB)`
3. Create or select your keystore (keep the `.jks` file safe!)
4. Generate the signed AAB

---

## Environment Variables

### backend/.env

| Variable | Description |
|----------|-------------|
| `DB_PASSWORD` | PostgreSQL password |
| `FIREBASE_PROJECT_ID` | Firebase project ID (e.g. `temencasa-xxxxx`) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Full JSON content of the service account key |
| `JWT_SECRET` | Random string, minimum 32 characters |
| `Jwt__Issuer` | `dispensa-api` |
| `Jwt__Audience` | `dispensa-app` |
| `FRONTEND_URL` | Frontend URL (for CORS) |

### frontend/.env

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (e.g. `http://localhost:5000`) |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_VAPID_KEY` | FCM VAPID key (for web push) |

---

## Running Tests

```bash
cd backend
dotnet test DispensaApi.Tests/DispensaApi.Tests.csproj
```

---

## Deploy (Render + Neon)

### Database — Neon (free serverless PostgreSQL)

1. Go to [neon.tech](https://neon.tech) → Create project → **tem-em-casa**
2. Copy the **direct connection string** (without `-pooler`) → use as `DATABASE_URL`

### Backend — Render

1. Go to [render.com](https://render.com) → New Web Service → Deploy from GitHub
2. Select the `backend` folder, runtime: **Docker**
3. Set environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon connection string |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Service account JSON (base64 encoded) |
| `JWT_SECRET` | Random string, minimum 32 characters |
| `Jwt__Issuer` | `dispensa-api` |
| `Jwt__Audience` | `dispensa-app` |
| `FrontendUrl` | Frontend URL (or leave blank for mobile-only) |

4. Copy the generated public URL → set as `VITE_API_URL` in `frontend/.env.production`

### Keeping the service alive — UptimeRobot

- Create an HTTP(s) monitor pointing to `https://<your-url>.onrender.com/health`
- Interval: 5 minutes (prevents Render free tier from sleeping)
- The `/health` endpoint responds to both GET and HEAD

---

## Phase 5 — Publish to Play Store

1. Create a developer account at [play.google.com/console](https://play.google.com/console) (US$ 25, one-time fee)
2. Create → New app → "Tem em Casa" → Category: Home & Auto
3. Fill in store listing: description, screenshots, feature graphic
4. Privacy policy (required) — publish URL at `querencialabs.com/privacidade`
5. Upload the signed AAB
6. Submit for internal review → then production (3–7 days)

---

## Publication Checklist

- [ ] Email/password login working on a physical device
- [ ] Password recovery email working
- [ ] Create and join a family group
- [ ] Full product CRUD working
- [ ] Low stock and expiry alerts displayed correctly
- [ ] Shopping list generated automatically
- [ ] WhatsApp sharing working
- [ ] Push notifications arriving (app closed)
- [ ] Barcode scanner working
- [ ] Automatic sync between members
- [ ] Pull-to-refresh working
- [ ] Edit profile name working
- [ ] Splash screen and icon configured
- [ ] Signed AAB generated
- [ ] Privacy policy published
- [ ] Play Store listing complete

---

## Roadmap

- [ ] iOS support (Capacitor + App Store)
- [ ] Product search by barcode via Open Food Facts API
- [ ] Shopping list with quantities and check-off
- [ ] Recurring items (auto-restocked)
- [ ] Expense history and monthly reports
- [ ] Dark mode

---

## License

MIT © [codewiththiago](https://github.com/codewiththiago)
