# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bloom** — React Native emotional wellness journal / emotional calendar app built with Expo SDK 54 and Expo Router v6. Users record daily check-ins with emotions, sleep quality, hunger, menstrual cycle phase, events, and notes. All UI is in **Spanish**.

## Development Commands

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS
npm run android    # Run on Android
npm run web        # Run on web
```

**EAS Build:** `eas build --profile preview` (Android APK) or `eas build --profile production`

No test runner or linter is configured. Use `npx tsc --noEmit` for type checking.

Install dependencies with `npm install --legacy-peer-deps` (configured in .npmrc).

## Architecture

### Routing (Expo Router v6 — file-based)
- `app/` — Screen definitions. Root Stack → `(auth)` group (login/register/forgot-password) and `(tabs)` group (5 tabs: check-in home, calendario, insights, notas, habilidades)
- Auth guard lives in `app/(tabs)/_layout.tsx` — redirects to login if unauthenticated
- `checkin/nuevo` is a modal (`slide_from_bottom` presentation)
- Route names use Spanish: `calendario`, `registros`, `notas`, `habilidades`, `dia/[fecha]`

### Source Code (`src/` via `@/*` path alias)
- **`components/`** — Reusable UI (`ui/` for primitives, `checkin/` and `calendar/` for feature-specific)
- **`constants/`** — `theme.ts` (full design system), `emotions.ts` (12 emotions with emoji/color), `strings.ts` (all Spanish UI strings centralized)
- **`contexts/`** — `AuthContext` wraps Firebase Auth state via `onAuthStateChanged`
- **`lib/`** — Service layer: `firebase.ts` (init), `auth.ts`, `firestore.ts` (check-in CRUD), `notifications.ts`, `export.ts`
- **`types/`** — TypeScript types: `CheckinEntry`, `EmotionId` (12-member union), `UserProfile`, `Skill`, `Template`

### State Management
No global state library. Uses React Context (auth only), local `useState` per screen, and `useFocusEffect` for data refetching on navigation focus. AsyncStorage for onboarding flag and reminder settings.

### Backend — Firebase (`bloom-57653`)
- **Firebase Auth** — Email/password with AsyncStorage persistence
- **Cloud Firestore** — `users/{userId}/checkins/{checkinId}` (owner-only access), `skills/{skillId}` and `templates/{templateId}` (read-only for authenticated users)
- Environment variables: `EXPO_PUBLIC_FIREBASE_*` (see `.env.example`)
- Security rules in `firestore.rules`, composite indexes in `firestore.indexes.json`

### Design System
- **Theme:** Warm cream (#FAF6F0) background, terracotta primary, sage green secondary, golden amber accent
- **Fonts:** DM Serif Display (headers), DM Sans (body), Nunito (tags/badges)
- **Styling:** `StyleSheet.create` with tokens from `@/constants/theme` — no style libraries
- **Animation:** `react-native-reanimated` extensively — staggered FadeInDown entries, spring press effects
- **Haptics:** `expo-haptics` on all interactive elements

## Sharing / Account Linking

Users can share their check-in data (read-only) with one other person via a 6-char code.

- **Data model:** `sharingCodes/{code}` (ephemeral, 24h expiry) and `users/{ownerId}/viewers/{viewerId}` (persistent link with `status: active|revoked`)
- **Firestore functions:** `src/lib/firestore.ts` — `createSharingCode`, `redeemSharingCode`, `getMyViewer`, `getMySharedAccount`, `revokeAccess`
- **Context:** `SharingContext` at root layout provides `viewer`, `sharedAccount`, and `refresh()` globally
- **Security rules:** Viewer gets read-only access to `users/{ownerId}/checkins` via `exists()` + `get()` checks on the viewers subcollection
- **UI:** Sharing config in `app/perfil.tsx`, dedicated "Compartido" tab (`app/(tabs)/compartido.tsx`) with sub-sections (Hoy/Calendario/Resumen)
- **Read-only mode:** `app/checkin/[id].tsx` and `app/dia/[fecha].tsx` accept `?owner={uid}` query param — hides delete/add buttons when present
- **Tab visibility:** The "Compartido" tab only appears when `sharedAccount` is non-null (via `href: null`)

## Key Conventions

- All user-facing strings live in `src/constants/strings.ts` (Spanish)
- Emotions are defined in `src/constants/emotions.ts` — 12 emotions each with id, label, emoji, and color
- Screens call `lib/firestore.ts` functions directly for data access
- Botanical/garden metaphor throughout ("Tu jardín de bienestar", plant-growth streak emojis)
- `react-hook-form` and `zod` are installed but not yet used — forms currently use direct `useState`
- Habilidades (skills) section is placeholder/"coming soon"
