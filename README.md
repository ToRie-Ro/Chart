# Bluewave Chat 🌊

> **“Connect. Chat. Be Closer.”**

A complete, production-ready full-stack real-time messaging website inspired by Telegram and Discord, designed with a dark navy & electric blue aesthetic, real-time messaging, authorized file attachments, and responsive mobile layout.

---

## 📸 Design & Implemented Pages

Bluewave Chat implements all 15 required core pages & features matching the reference design:

1. **Splash / Welcome Page** (`/`): High-converting hero showcase with branding and instant demo launcher.
2. **Login Page** (`/login`): Split-screen authentication with email, password show/hide, remember me, and demo login.
3. **Sign Up Page** (`/signup`): Full registration flow with name, email, password validation, and terms agreement.
4. **Email Verification Page** (`/verify`): Animated confirmation badge, clear instructions, and resend trigger.
5. **Forgot Password Page** (`/forgot-password`): Password reset request with Supabase Auth integration.
6. **Password Reset Page** (`/reset-password`): Secure recovery handler for setting a new password.
7. **Main Chat Dashboard** (`/app`): 3-column desktop layout with left navigation, message feed, and chat timeline.
8. **Private Chat Conversation**: Encrypted messaging with incoming/outgoing bubble themes, double checkmarks, and timestamps.
9. **Contacts and User Search** (`/contacts`): Live search of registered users and one-click chat initiation.
10. **User Profile View** (`/profile` & `/profile/:id`): Scenic cover banner, overlapping avatar, handle, bio, counters (Posts, Followers, Following), and media/files tabs.
11. **Edit Profile Modal**: Live profile updates (display name, avatar URL, status, and bio).
12. **Settings Page** (`/settings`): User summary card, account security, notifications, and privacy options.
13. **Notifications and Privacy Settings**: Push notification controls, read receipts, and online status toggles.
14. **Dark / Light Theme Toggle**: Persistent dark mode (default) and light mode themes.
15. **Responsive Mobile Navigation**: Adaptive bottom navigation bar and full-screen mobile chat views.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Date-fns |
| **Backend** | Node.js, Express, TypeScript, Helmet, CORS, Rate Limit, Zod |
| **Database & Auth** | Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS) |
| **Realtime** | Supabase Realtime WebSocket Channels |
| **Storage** | Supabase Storage (`avatars` & `chat-attachments` buckets) |
| **Hosting Platform** | **Render** (Web Service for Server + Static Site for Client) |

---

## 📁 Repository Structure

```text
bluewave-chat/
├── client/                     # Frontend Vite + React + TypeScript
│   ├── src/
│   │   ├── components/         # Navbar, ChatList, ChatArea, Modals, BrandLogo
│   │   ├── context/            # AuthContext (Supabase Auth), ThemeContext
│   │   ├── lib/                # API client, Supabase SDK, TypeScript types
│   │   ├── pages/              # 15 complete pages & views
│   │   ├── App.tsx             # Protected & Public routing
│   │   ├── main.tsx            # React root mount
│   │   └── index.css           # Tailwind directives & custom animations
│   ├── public/                 # Favicon & assets
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.example
├── server/                     # Backend Node.js + Express + TypeScript
│   ├── src/
│   │   ├── middleware/         # Auth verification, Rate limiters, Error handling
│   │   ├── routes/             # Users, Conversations, Messages, Health
│   │   ├── services/           # Supabase client & Admin SDK
│   │   ├── validators/         # Zod request validation schemas
│   │   └── index.ts            # Express server (binds 0.0.0.0, PORT)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── supabase/
│   ├── migrations/             # 20261009_initial_schema.sql (Tables, RLS, Realtime)
│   └── seed.sql                # Initial database documentation & seed helpers
├── render.yaml                 # Render Blueprint configuration for zero-friction deploy
├── .gitignore
└── README.md
```

---

## 🚀 Step-by-Step Local Setup

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24 LTS)
- **npm** v9+
- A free **Supabase** account ([supabase.com](https://supabase.com))

### 2. Database & Auth Setup (Supabase)
1. In the Supabase Dashboard, create a new project.
2. Navigate to **SQL Editor** in the left menu.
3. Open `supabase/migrations/20261009_initial_schema.sql`, copy all contents, paste into the SQL editor, and click **Run**.
   - This creates `profiles`, `conversations`, `conversation_members`, and `messages` tables.
   - Sets up automatic profile creation triggers on user signup.
   - Enforces strict Row Level Security (RLS) so only conversation members read and write messages.
   - Enables Supabase Realtime publication on the tables.
   - Creates the `avatars` and `chat-attachments` storage buckets with public read policies.
4. In **Project Settings** > **API**, copy:
   - `Project URL`
   - `anon public` key
   - `service_role` secret key

### 3. Server Configuration & Run
```bash
cd server
cp .env.example .env
```
Fill in `.env`:
```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-supabase-service-role-secret-key
```
Install dependencies and run:
```bash
npm install
npm run dev
```
Verify the server health at `http://localhost:4000/health`.

### 4. Client Configuration & Run
Open a second terminal:
```bash
cd client
cp .env.example .env
```
Fill in `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
VITE_API_BASE_URL=http://localhost:4000
```
Install dependencies and run:
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## ☁️ Render Deployment Guide

Bluewave Chat is pre-configured for **Render** using both the automated Blueprint (`render.yaml`) and manual dashboard setup.

### Option A: 1-Click Blueprint Deploy (Recommended)
1. Push your repository to GitHub (`https://github.com/ToRie-Ro/Chart.git`).
2. Go to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Connect your GitHub repository `ToRie-Ro/Chart`.
5. Render reads `render.yaml` and detects two services:
   - `bluewave-chat-server` (Web Service)
   - `bluewave-chat-client` (Static Site)
6. Enter the required environment variables prompted in the setup wizard:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_API_BASE_URL` (Set to your backend URL, e.g. `https://bluewave-chat-server.onrender.com`)
   - `FRONTEND_URL` (Set to your frontend URL, e.g. `https://bluewave-chat-client.onrender.com`)
7. Click **Apply**.

### Option B: Manual Render Dashboard Setup

#### 1. Backend Web Service:
- **Service Type:** Web Service
- **Environment:** Node.js
- **Root Directory:** `server`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`
- **Environment Variables:**
  - `NODE_ENV`: `production`
  - `PORT`: `4000` (Render will bind `process.env.PORT` automatically)
  - `FRONTEND_URL`: `https://bluewave-chat-client.onrender.com`
  - `SUPABASE_URL`: `https://your-project.supabase.co`
  - `SUPABASE_PUBLISHABLE_KEY`: `your-anon-key`
  - `SUPABASE_SECRET_KEY`: `your-service-role-key`

#### 2. Frontend Static Site:
- **Service Type:** Static Site
- **Root Directory:** `client`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Redirects / Rewrites:**
  - Source: `/*`
  - Destination: `/index.html`
  - Action: `Rewrite`
- **Environment Variables:**
  - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`: `your-anon-key`
  - `VITE_API_BASE_URL`: `https://bluewave-chat-server.onrender.com`

---

## 🔒 Security Architecture

1. **Token Verification**: Every protected backend endpoint verifies the client's Supabase JWT token via `supabase.auth.getUser()`. Never trusts client-supplied user IDs.
2. **Conversation Authorization**: Every message read, message send, or conversation access strictly verifies that the user is a member of `conversation_members`.
3. **Row Level Security (RLS)**: Enforced directly on PostgreSQL. Even direct database queries from clients cannot inspect other users' private messages.
4. **Soft Deletions**: Messages support soft deletion (`deleted_at`), ensuring conversation continuity and auditability.
5. **Rate Limiting**: `express-rate-limit` prevents spam on message creation and user search endpoints.
6. **Input Sanitization**: All endpoint inputs validated with strict `zod` schemas.

---

## 🧪 Testing Checklist

- [x] **Authentication**: Registration with email/password, session persistence across page refreshes, logout, and password reset flows.
- [x] **One-to-One Chat**: Starting a chat with another user, sending messages, and seeing real-time updates.
- [x] **Attachments**: Uploading and viewing authorized file attachments with download triggers.
- [x] **Search**: Instant querying of registered users by name or `@username`.
- [x] **Profiles & Settings**: Editing full name, avatar, status (online/away/busy/offline), and bio.
- [x] **Dark / Light Modes**: Smooth theme switching with persistent localStorage settings.
- [x] **Mobile Responsiveness**: Complete mobile navigation, back gestures, and adaptive message bubble widths.