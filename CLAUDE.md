# CLAUDE.md

Guía para Claude Code al trabajar en este repositorio.

## Project Overview

**Bloom** — diario emocional y calendario de bienestar para iOS, escrito en SwiftUI nativo. UI en **español**. El usuario registra check-ins diarios (emoción, intensidad, sueño, hambre, ciclo, eventos, notas), gestiona un jardín virtual gamificado, escribe gratitud, sigue un plan de seguridad, ejecuta habilidades DBT y comparte cuenta en modo solo lectura.

Migración cerrada desde React Native (Expo SDK 54 + Firebase) a SwiftUI nativo iOS 17+. Ver `ios-native/MIGRATION.md` para el detalle del proceso y decisiones.

## Working Directory

Todo el código vive en **`ios-native/`**. El resto del repo (`hosting/`, `firestore.*`, `firebase.json`) es backend Firebase compartido / páginas HTML legales servidas por Hosting.

```bash
cd ios-native
```

## Development Commands

```bash
# Regenerar proyecto Xcode tras añadir/quitar archivos
xcodegen generate

# Build canónico (simulador iPhone con UDID fijo)
xcodebuild -project Bloom.xcodeproj -scheme Bloom \
  -destination 'platform=iOS Simulator,id=5C8D47D5-617B-4002-8DB5-B7ABD9A6C1EF' \
  -derivedDataPath /tmp/bloom-dd build

# Abrir en Xcode
open Bloom.xcodeproj
```

El proyecto `Bloom.xcodeproj` está gitignored — siempre se regenera con `xcodegen` desde `project.yml`. Después de añadir archivos nuevos en `Bloom/` o `BloomWidget/`, ejecutar `xcodegen generate` o el build fallará con "cannot find … in scope".

## Architecture

### Targets
- **`Bloom`** — app principal SwiftUI, iOS 17+, Swift 6 estricto.
- **`BloomWidget`** — app extension WidgetKit, lee snapshot desde App Group `group.com.akemi01.bloom.shared`.

### Capas (`Bloom/`)
- **`App/`** — `BloomApp`, `RootView`, `MainTabView`. Inyección de servicios via `@Environment`.
- **`Services/`** — `AuthService`, `FirestoreService`, `PremiumService`, `SharingService`, `GenderService`, `NotificationsService`, `ExportService`, `WidgetSyncService`, `BloomCrypto`.
- **`Features/<Feature>/`** — vistas + componentes específicos por feature (Auth, CheckIn, Calendar, Notes, Skills, Garden, Profile, Premium, Achievements, Gratitude, SafetyPlan, Sharing, Onboarding, Splash).
- **`Components/`** — primitivas reutilizables (`BloomButton`, `BloomTextField`, `BloomCard`, `Badge`, `EmptyState`, `ScreenWrapper`, `Skeleton`, `LoadingSpinner`, `FadeIn`).
- **`DesignSystem/`** — `Theme.swift` (paleta, spacing, radii, sombras), `Typography.swift`, `BloomIcon.swift`, `Color+Hex.swift`.
- **`Models/`** — modelos Codable (`CheckinEntry`, `Emotion`, `EmotionalRegisterEntry`, `GratitudeEntry`, `UserProfile`, `Skill`, `Premium`, `SafetyPlan`, `Sharing`, `AppAchievement`, `GenderedText`).
- **`Utils/`** — `BloomDate`, `Streak`, `FlowLayout`.
- **`Strings/Strings.swift`** — catálogo central de textos en español, agrupados por feature.
- **`Resources/`** — `Info.plist`, entitlements, `GoogleService-Info.plist`, `Assets.xcassets` (paleta, iconos botánicos SVG, AppIcon).

### State Management
- `@Observable @MainActor` para servicios singleton (Swift 6).
- `@Environment(Service.self)` para inyección.
- `@State` local por vista.
- Refetch al volver a foco: `.task` / `.onAppear` con guard contra recargas.

### Backend — Firebase (`bloom-57653`, sin cambios desde RN)
- **Auth**: email/password + Sign in with Apple + Google Sign-In.
- **Firestore**: `users/{uid}/{checkins|registers|gratitude|skillPractice|safetyPlan|viewers}`, `sharingCodes/{code}`, `viewerLinks/{viewerId}`, `premiumCodes/{code}`.
- **Cifrado cliente**: AES-256-CBC con `EVP_BytesToKey`/MD5 en `BloomCrypto` (round-trip compatible con la versión RN anterior usando `CryptoJS`).
- **App Group**: `group.com.akemi01.bloom.shared` para sincronizar el snapshot del widget.

### Premium
- StoreKit 2 nativo (la versión RN usaba RevenueCat; aquí vamos directos a App Store).
- Product IDs: `bloom_premium_annual` (con free trial 1 semana) y `bloom_premium_monthly`.
- Gift codes vía Firestore (`premiumCodes/{code}` + `users/{uid}.premium`).
- Sección admin (`auth.currentUserID == "IUrBhjLrTLZZkwuj8B8qSXRX7iH3"`) en `PremiumView` genera códigos.
- Toggle DEBUG en pestaña Tú para alternar premium en builds locales.

### Widget
- Target `BloomWidget` independiente, NO enlaza el módulo de la app (no acceso a Firebase desde la extension).
- `WidgetSyncService` escribe JSON en `UserDefaults(suiteName: "group.com.akemi01.bloom.shared")` tras cualquier cambio (check-in, jardín, login/logout).
- Provider del widget lee solo de ese App Group y dispara timelines cada 30 min como red de seguridad.

## Key Conventions

- **Todos los textos** en `Bloom/Strings/Strings.swift`, español. Agrupados en enums namespaced (`Strings.CheckIn`, `Strings.Premium`, etc.).
- **Lenguaje con género**: `GenderedText(f:, m:, n:)` resuelto via `GenderService.resolve(_:)`. El usuario elige la flexión en perfil.
- **Iconografía botánica**: 89 SVGs en `Assets.xcassets`. Acceso via `BloomIcon` enum + `BloomIconView`.
- **Fuentes**: DM Serif Display (display), DM Sans (cuerpo), Nunito (tags/badges).
- **Cifrado**: campos sensibles (notas, eventos, reflexión de compostaje, registros emocionales, gratitud, plan de seguridad) cifran via `BloomCrypto.encrypt/decrypt`. La clave viene de `Info.plist` (`EncryptionKey`).
- **Sincronización widget**: cualquier cambio que afecte racha / semillas / plantas / últimos check-ins debe llamar a `WidgetSyncService.update { … }` o `refresh(...)`.
- **Logros**: `AppAchievementCatalog` (19 logros). `AppAchievements.checkAndUnlock(userID:firestore:)` se llama fire-and-forget tras guardar datos; los toasts pendientes los recoge `CheckInHomeView` al volver a foco.
- **Sin comentarios obvios**: solo si el porqué es no-evidente.

## Distribución

- Bundle ID: `com.akemi01.bloom`. Team: `LLU2292H63`.
- TestFlight + App Store via Xcode Archive → ASC.
- Subscriptions vivas en ASC bajo el grupo "Bloom Premium" con los IDs nombrados arriba.
- Páginas legales (`hosting/politica-privacidad.html`, `reset-password.html`, `soporte.html`) servidas desde Firebase Hosting.

## Backend deploy

Reglas e indices de Firestore están versionados en raíz:

```bash
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only hosting
```
