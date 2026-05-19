# Bloom — iOS nativo

Migración de la app **Bloom** (hoy React Native / Expo) a iOS nativo con SwiftUI.

Este proyecto convive en la rama `feature/ios-native` junto al código React Native,
que permanece intacto en `main` hasta que la versión nativa alcance paridad.

## Stack

- **SwiftUI**, iOS 17+ (`@Observable`, `NavigationStack`, async/await)
- **Swift 6**, concurrencia estricta (`SWIFT_STRICT_CONCURRENCY = complete`)
- **Firebase iOS SDK** vía SPM — `FirebaseAuth` + `FirebaseFirestore`
  (mismo proyecto `bloom-57653`, sin migración de datos)
- **XcodeGen** — el `.xcodeproj` se genera desde `project.yml` y **no se versiona**

## Arquitectura

Patrón **MV (Model–View)** moderno, sin ViewModels:

- **Modelos** (`Models/`): structs `Codable` de dominio. Mapean documentos de
  Firestore vía `@DocumentID` + `Date` (Firestore convierte `Timestamp` ↔ `Date`).
- **Servicios** (`Services/`): clases `@Observable @MainActor` que encapsulan
  Firebase. Se crean una vez en `BloomApp` y se inyectan con `.environment(...)`.
  - `AuthService` — estado de sesión observable (sustituye al `AuthContext` de RN).
  - `FirestoreService` — CRUD sobre Firestore (sustituye a `src/lib/firestore.ts`).
- **Vistas** (`App/`, `Features/`): SwiftUI puro. Leen servicios con `@Environment`.
- **Design System** (`DesignSystem/`): tokens portados de `src/constants/theme.ts`
  (`Theme`) y `Font` (`Typography`). Fuentes DM Serif / DM Sans / Nunito en
  `Resources/Fonts/`, registradas vía `UIAppFonts`.

Los modelos con `@DocumentID` no son `Sendable` (el wrapper de Firebase no lo es);
se manejan siempre desde el main actor.

## Estructura

```
ios-native/
├── project.yml              # definición XcodeGen
├── Bloom/
│   ├── App/                 # BloomApp (@main), RootView, MainTabView
│   ├── DesignSystem/        # Theme, Typography, Color+Hex
│   ├── Models/              # Emotion, CheckinEntry, UserProfile
│   ├── Services/            # FirebaseBootstrap, AuthService, FirestoreService
│   ├── Features/            # una carpeta por feature (vistas placeholder)
│   └── Resources/           # Info.plist, entitlements, GoogleService-Info,
│                            # Assets.xcassets, Fonts/
```

## Puesta en marcha

```bash
brew install xcodegen          # si no lo tienes
cd ios-native
xcodegen generate              # genera Bloom.xcodeproj
open Bloom.xcodeproj           # Xcode resuelve los paquetes SPM al abrir
```

Build por línea de comandos:

```bash
xcodebuild -project Bloom.xcodeproj -scheme Bloom \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
```

## Estado actual

Scaffold + arquitectura. Compila y arranca con las 5 pestañas en placeholder.
Pendiente de portar feature a feature: Auth, Check-in, Calendario, Insights,
Notas, Habilidades, Jardín, Logros, Gratitud, Plan de seguridad, Premium,
Compartir cuenta, Onboarding, Widget, Notificaciones, Export PDF.
