# Bloom

Diario emocional y calendario de bienestar personal. Registra tus emociones, patrones de sueno, ciclo menstrual y eventos diarios para descubrir correlaciones y mejorar tu bienestar.

## Funcionalidades

- **Check-in diario** — Registra emociones (12 categorias), calidad de sueno, hambre, fase del ciclo menstrual, eventos y notas
- **Calendario emocional** — Visualiza tus registros con codigos de color por emocion dominante
- **Insights y correlaciones** — Analiza patrones entre emociones, sueno y otros factores
- **Jardin virtual** — Sistema de gamificacion con metafora botanica: gana semillas, planta flores y haz crecer tu jardin
- **Compartir datos** — Vincula tu cuenta con otra persona para compartir registros en modo solo lectura
- **Widget iOS** — Widget de pantalla de inicio con racha y estado del jardin (WidgetKit)
- **Cifrado de datos** — Encriptacion AES del lado del cliente para campos sensibles
- **Notificaciones** — Recordatorios configurables para check-ins diarios

## Stack

| Capa | Tecnologia |
|------|-----------|
| Framework | React Native + Expo SDK 54 |
| Navegacion | Expo Router v6 (file-based) |
| Backend | Firebase (Auth, Firestore, Cloud Messaging) |
| Animaciones | React Native Reanimated + React Native Skia |
| Widget iOS | WidgetKit via `@bacons/apple-targets` |
| Idioma UI | Espanol |

## Desarrollo

```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Iniciar servidor de desarrollo
npm start

# Ejecutar en plataforma especifica
npm run ios
npm run android
npm run web
```

### Variables de entorno

Copia `.env.example` a `.env` y configura las credenciales de Firebase:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_ENCRYPTION_KEY=
```

### Builds

```bash
# APK Android (preview)
eas build --profile preview --platform android

# IPA iOS (preview)
eas build --profile preview --platform ios

# Produccion
eas build --profile production
```

## Estructura del proyecto

```
app/                  # Pantallas (Expo Router file-based routing)
  (auth)/             # Login, registro, recuperar contrasena
  (tabs)/             # Tabs principales (check-in, calendario, insights, notas, habilidades)
  checkin/            # Modal de nuevo check-in y detalle
  dia/[fecha].tsx     # Vista de dia especifico
src/
  components/         # Componentes reutilizables (UI, calendar, checkin, garden)
  constants/          # Tema, emociones, strings (espanol)
  contexts/           # AuthContext, SharingContext, GardenContext
  lib/                # Firebase, auth, firestore, notificaciones, export
  types/              # TypeScript types
targets/
  widget/             # Widget iOS (WidgetKit) — inyectado via config plugin
plugins/
  withWidgetReload.js # Config plugin para recargar timelines del widget
```

## Licencia

Proyecto privado.
