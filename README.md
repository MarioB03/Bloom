# Bloom

Diario emocional y calendario de bienestar para iOS. Registra cómo te sientes, descubre patrones, cuida un jardín virtual que crece con tu constancia.

App nativa SwiftUI (iOS 17+) sobre backend Firebase. Migrada desde una versión previa en React Native + Expo — ver `ios-native/MIGRATION.md` para el detalle.

## Funcionalidades

- **Check-in diario** — emoción (12 categorías), intensidad, sueño, hambre, fase del ciclo menstrual, eventos y notas cifradas
- **Compostaje** — reflexiona sobre un registro pasado y recibe semillas para el jardín
- **Calendario emocional** — vista mensual con la emoción predominante de cada día
- **Insights y correlaciones** — patrones entre sueño, hambre, ciclo y emociones
- **Jardín virtual** — sistema isométrico animado: gana semillas con la racha, compra plantas, decoraciones y mascotas
- **Diario de gratitud** — 3 motivos al día con racha propia
- **Habilidades DBT** — 18 ejercicios y artículos con timer, círculo de respiración y registro de práctica
- **Plan de seguridad** — autoeditable, con contactos de confianza y líneas de crisis llamables
- **Compartir cuenta** — código de 6 caracteres para vincular con otra persona en modo solo lectura
- **Widget de pantalla de inicio** — racha + semillas + estado del jardín, WidgetKit
- **Premium** — StoreKit 2 (anual con free trial · mensual) + códigos de regalo via Firestore
- **Cifrado cliente** — AES-256-CBC en notas, eventos, reflexiones, gratitud y plan de seguridad
- **Notificaciones** — recordatorio diario configurable
- **Lenguaje con género** — selección femenino/masculino/neutro
- **Exportar a PDF** (Premium)

## Stack

| Capa | Tecnología |
|------|-----------|
| UI | SwiftUI iOS 17+ con Swift 6 estricto |
| Navegación | `NavigationStack` + `TabView` (5 pestañas) |
| Estado | `@Observable @MainActor` services + `@Environment` |
| Backend | Firebase (Auth, Firestore) |
| Pagos | StoreKit 2 (sin RevenueCat) |
| Widget | WidgetKit + App Group + `SwiftUI Canvas` |
| Gráficos del jardín | `SwiftUI Canvas` + `TimelineView(.animation)` |
| Cifrado | CryptoKit (AES-256-CBC) |
| Generación del proyecto Xcode | XcodeGen (`project.yml`) |

## Desarrollo

Requisitos: macOS, Xcode 16+, [XcodeGen](https://github.com/yonaskolb/XcodeGen) (`brew install xcodegen`).

```bash
cd ios-native

# Generar el .xcodeproj (no está versionado)
xcodegen generate

# Abrir en Xcode
open Bloom.xcodeproj

# Build canónico desde línea de comandos
xcodebuild -project Bloom.xcodeproj -scheme Bloom \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  -derivedDataPath /tmp/bloom-dd build
```

Para iniciar sesión hace falta una cuenta Firebase del proyecto `bloom-57653` (ya hay credenciales sociales — Sign in with Apple, Google — y email/password).

## Estructura

```
ios-native/
  Bloom/                  Target principal (SwiftUI app)
    App/                  BloomApp, RootView, MainTabView
    Services/             AuthService, FirestoreService, PremiumService...
    Features/             Auth, CheckIn, Calendar, Notes, Skills, Garden,
                          Profile, Premium, Achievements, Gratitude,
                          SafetyPlan, Sharing, Onboarding, Splash
    Components/           Primitivas reutilizables (BloomButton, BloomCard…)
    DesignSystem/         Theme, Typography, BloomIcon
    Models/               Codables (CheckinEntry, GratitudeEntry, Premium…)
    Utils/                BloomDate, Streak, FlowLayout
    Strings/Strings.swift Catálogo de textos (ES)
    Resources/            Info.plist, entitlements, Assets, GoogleService-Info
  BloomWidget/            App extension WidgetKit
  Bloom.storekit          Config StoreKit local para testing del paywall
  project.yml             Configuración XcodeGen
  MIGRATION.md            Tracker de la migración RN → SwiftUI
hosting/                  HTML legales servidos por Firebase Hosting
firestore.rules           Reglas Firestore (compartidas con RN previa)
firestore.indexes.json    Índices compuestos
firebase.json             CLI config para deploy
```

## Backend / hosting

```bash
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only hosting
```

## Licencia

Proyecto privado.
