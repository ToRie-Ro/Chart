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

