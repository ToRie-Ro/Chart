# SabayChat

SabayChat is a native messaging application built for both iOS and Android, sharing one backend and a common Figma-driven design system.

## Overview

- iOS: Swift + SwiftUI
- Android: Kotlin + Jetpack Compose
- Backend: Node.js + TypeScript + REST + WebSockets
- Design: shared design tokens based on the SabayChat brand
- Brand: Made in Cambodia 🇰🇭

## Repository structure

```text
SabayChat/
├── ios/
│   └── SabayChat-iOS/
├── android/
│   └── SabayChat-Android/
├── backend/
├── design/
│   └── design-tokens/
├── docs/
├── .github/
│   └── workflows/
│       ├── ios-build.yml
│       └── android-build.yml
├── .gitignore
├── README.md
└── LICENSE
```

## Backend URL

For local development, use:

```text
http://localhost:4000
```

For Render production, use your Render service URL, for example:

```text
https://sabaychat-backend.onrender.com
```

Set the backend URL in environment variables:

```bash
API_BASE_URL=https://sabaychat-backend.onrender.com
APP_ENV=production
JWT_SECRET=your-secure-secret
```

## Free persistent account storage

Render's filesystem and process memory are not permanent, so the current demo accounts reset when the service restarts. Use a free Supabase PostgreSQL project for persistent users, passwords, conversations, and messages:

1. Create a project at https://supabase.com.
2. Open **Project Settings > Database** and copy the connection string.
3. Add it in Render as `DATABASE_URL`.
4. Keep `JWT_SECRET` as a long random secret and redeploy the backend.

Supabase stores the data; Render continues hosting the Node.js API. Do not put the database password in Git or in the mobile apps.

This repository uses Express, not Next.js. Do not add `page.tsx`, `next/headers`, or Next.js middleware. The backend Supabase client is in `backend/src/config/supabase.ts`, and the starter SQL schema is `backend/supabase-schema.sql`. Run that SQL in Supabase, then add these Render variables:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

The service-role key must only exist in Render environment variables. Never use it in iOS, Android, browser code, or Git.

## Product goals

- Shared backend and accounts across platforms
- Consistent dark/light UI across iOS and Android
- Native experiences with matching brand identity
- Production-ready architecture with modular separation
- Support for auth, messaging, groups, stories, calls, notifications, premium, and settings

## Local development

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### iOS

Open the Xcode project in `ios/SabayChat-iOS` and build with Xcode 15+ / iOS 17+.

### Android

Open the Android project in Android Studio and sync Gradle.

## Build and release

GitHub Actions workflows are included for automated Android APK/AAB and iOS IPA generation.

## Security

Never commit secrets, credentials, certificates, keystores, or payment keys. Store them in GitHub Actions Secrets or secure platform key stores.

## License

This project is scaffolded for development and production onboarding. Add your preferred license before distribution.

