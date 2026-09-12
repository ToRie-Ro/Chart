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

For Render, add `JWT_SECRET` under **Dashboard > your service > Environment**. Generate it locally with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` and paste the result into Render, or recreate/sync the service from [render.yaml](./render.yaml), which requests a generated secret. Do not put the generated value in GitHub. A deploy will intentionally stop if production starts without this variable.

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

If the original schema was already run, run `backend/supabase-migration-002-conversation-ids.sql` after the main schema. This keeps the existing `conv_1` and `conv_2` app IDs compatible with saved messages. The `conversations` and `conversation_participants` tables are required for the chat list; creating only `device_sessions` is not enough. Mobile clients send messages to the API with their login JWT; messages are stored in Supabase and loaded again when the chat opens.

### Email verification login

Registration and password login send a six-digit code by email before creating a device session. In Render, add all of these environment variables and redeploy:

```text
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-login-email
SMTP_PASSWORD=your-brevo-smtp-key
EMAIL_FROM=SabayChat <no-reply@your-verified-domain.com>
```

The sender address or domain must be verified in Brevo. `SMTP_PASSWORD` is the Brevo SMTP key, not the Brevo account password. If these variables are missing, login intentionally returns `Email delivery is not configured.` Registration does not require SMTP, but it does require that the Supabase schema or migration above has created `device_sessions` with the `refresh_token_hash` column.

After running the SQL, the API uses Supabase for registration and login. Access tokens are short-lived (15 minutes). Store the returned refresh token only in platform secure storage and rotate it through `POST /api/auth/refresh`; never put either token in logs or URLs. Test the protected profile endpoint with the access token returned by login:

```text
GET https://chart-ztyk.onrender.com/api/me
Authorization: Bearer <login-token>
```

The backend validates every protected access token against its active device session. `POST /api/auth/logout` revokes the current device, and `POST /api/me/devices/logout-all` revokes every device. WebSocket clients must use `wss://` and are authorized against conversation membership before messages are stored or delivered.

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

Open the Xcode project in `ios/SabayChat-iOS` and build with the Xcode release that provides the iOS 26 SDK. The deployment target is iOS 26.0, so the app also runs on later compatible iOS releases such as iOS 27.

### Android

Open the Android project in Android Studio and sync Gradle.

## Build and release

GitHub Actions workflows are included for automated Android APK/AAB and iOS IPA generation.

### iOS IPA test build

The iOS project now includes the SabayChart app icon in `ios/SabayChat-iOS/Assets.xcassets` and uses the `com.sabaychart.ios` bundle identifier. On a Mac with Xcode 26 installed:

1. Open `ios/SabayChat-iOS/SabayChat-iOS.xcodeproj`.
2. Select the `SabayChat-iOS` scheme and a connected iPhone or a generic iOS device.
3. Set your Apple Developer Team under **Signing & Capabilities** and keep automatic signing enabled for the first test.
4. Use **Product > Archive**, then **Distribute App > Ad Hoc** for an installable test IPA.
5. For App Store publication, choose **App Store Connect** instead of Ad Hoc and complete TestFlight review.

The repository cannot produce a signed IPA on Windows because Xcode, the iOS SDK, and Apple code-signing tools only run on macOS. The final archive size must be checked from the Release archive; native SwiftUI code and the single optimized 1024px icon are intentionally lightweight.

## Security

Never commit secrets, credentials, certificates, keystores, or payment keys. Store them in GitHub Actions Secrets or secure platform key stores.

## License

This project is scaffolded for development and production onboarding. Add your preferred license before distribution.
