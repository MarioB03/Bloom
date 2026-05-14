# Migración Bloom RN → iOS nativo — Tracker

Estado vivo de la migración. **Leer esto primero al retomar sesión.**
Contexto de arquitectura y stack: ver `README.md`.

**Leyenda:** ✅ portado y verificado · 🚧 en progreso · ⬜ pendiente · ❓ por decidir

> Verificación: la app **compila** (`BUILD SUCCEEDED`) y **arranca en
> simulador** sin crashear. La pantalla de login renderiza correctamente
> (fuentes, fondo, botones sociales).

---

## Infraestructura (base del scaffold)

| Pieza | Estado | Notas |
|---|---|---|
| Proyecto XcodeGen + SPM Firebase + GoogleSignIn | ✅ | `project.yml`, iOS 17+, Swift 6 estricto |
| Design System (Theme, Typography, fuentes) | ✅ | Portado de `src/constants/theme.ts` |
| Modelos core (Emotion, CheckinEntry, UserProfile) | 🚧 | Solo 3 de ~10 modelos — ver "Modelos pendientes" |
| `AuthService` | ✅ | Email/password, social (Apple/Google), creación de perfil Firestore |
| `FirestoreService` | 🚧 | Esqueleto; solo cubre check-ins |
| Navegación raíz + TabView 5 pestañas | ✅ | `RootView` con auth guard, vistas placeholder |
| **Componentes UI base** | 🚧 | Hechos: `BloomButton`, `BloomTextField`, `AuthScaffold` (modificadores `authFormCard`/`errorAlert`). Pendientes: Card, Badge, EmptyState, LoadingSpinner, Skeleton, FadeIn, ScreenWrapper, 2× AchievementToast |
| **Splash animado** | ⬜ | `src/components/ui/AnimatedSplash.tsx` (usado en `app/_layout.tsx`) |
| **Lenguaje con género** (cross-cutting) | ⬜ | `src/contexts/GenderContext.tsx`, usado en 8 pantallas; afecta a los textos. El registro ya guarda `genderForm` en el perfil; falta persistencia local |
| **Lógica de racha / streak** (cross-cutting) | ⬜ | `src/utils/streak.ts`, usado en home, jardín, insights, perfil |
| Cifrado de campos sensibles (CryptoJS → CryptoKit) | ⬜ | RN: `src/lib/crypto.ts`. Decidir esquema compatible ❓ |
| `strings.ts` → catálogo de textos | 🚧 | `Strings.swift` con namespace `Auth`/`SocialAuth`/`App`. Se completa feature a feature. Estrategia definitiva (`String(localized:)` vs enum) ❓ |
| Notificaciones (recordatorios diarios) | ⬜ | RN: `src/lib/notifications.ts` |
| Export PDF | ⬜ | RN: `src/lib/export-pdf.ts`, `src/lib/export.ts` |
| Widget iOS | ⬜ | RN ya tiene uno vía `@bacons/apple-targets` + `widget-sync.ts` |

### Modelos pendientes de portar (se harán con cada feature)
`EmotionalRegisterEntry` · `GratitudeEntry` · `Skill` · `Template` + `TemplateField` +
`RegisterEntry` · `PremiumStatus` · tipos de `SafetyPlan` · tipos de `Sharing`.
Hechos: `Emotion`, `CheckinEntry`, `UserProfile`.

---

## Features

### Auth — ✅
- [x] Login email/password
- [x] Registro (con selector de género)
- [x] Recuperar contraseña
- [x] Sign in with Apple
- [x] Google Sign-In
- Nativo: `Features/Auth/` (`AuthView` NavigationStack, `LoginView`,
  `RegisterView`, `ForgotPasswordView`, `SocialSignInButtons`, `AuthScaffold`),
  `Services/AuthService.swift`. No navega tras login: el listener de
  `AuthService` actualiza `RootView`.
- RN: `app/(auth)/`, `src/components/auth/SocialSignInButtons.tsx`, `src/lib/auth.ts`

### Check-in diario — ⬜ (siguiente)
- [ ] Home / "jardín de hoy" (`app/(tabs)/index.tsx`), incluye racha
- [ ] Crear check-in (modal) — emoción, intensidad, sueño, hambre, ciclo, eventos, notas
- [ ] Ver/editar check-in (`checkin/[id]`)
- [ ] Componentes: EmotionPicker, IntensitySlider, CycleTracker, EventInput, CheckinCard
- RN: `app/checkin/`, `src/components/checkin/`

### Calendario emocional — ⬜
- [ ] Vista mensual + navegación de meses
- [ ] Detalle de día (`dia/[fecha]`)
- RN: `app/(tabs)/calendario.tsx`, `app/dia/[fecha].tsx`, `src/components/calendar/`

### Insights — ⬜
- [ ] Pantalla de insights y correlaciones
- RN: `app/insights.tsx`, `src/lib/correlations.ts`

### Notas y registros emocionales — ⬜
- [ ] Lista de notas (`app/(tabs)/notas.tsx`)
- [ ] Registro emocional "Observar y Describir" — crear/editar (`registro-emocional/`)
- [ ] Componente `EmotionalRegisterCard`
- RN: `app/(tabs)/notas.tsx`, `app/registro-emocional/`

### Plantillas y registros dinámicos — ⬜
- [ ] Pestaña "Registros" (`app/(tabs)/registros.tsx`)
- [ ] Motor de formularios dinámicos: `Template` + `TemplateField` (tipos text/number/slider/select/multiselect/toggle/date) → `RegisterEntry`
- [ ] Colección `templates/` read-only en Firestore
- RN: `src/types/template.ts`

### Agenda y búsqueda — ⬜
- [ ] Pantalla Agenda (`app/agenda.tsx`)
- [ ] Filtros: `DatePickerField`, `EmotionChips`
- RN: `app/agenda.tsx`, `src/components/search/`

### Habilidades — ⬜
- [ ] Listado por categorías + detalle de habilidad
- [ ] Ejercicios: respiración (BreathingCircle), timers, indicador de pasos
- [ ] Historial de práctica
- RN: `app/(tabs)/habilidades.tsx`, `app/habilidad/`, `app/habilidades/`, `src/components/skills/`, `src/constants/skills.ts`

### Jardín de bienestar — ⬜ (el más grande)
- [ ] Canvas/escena del jardín, plantas, mascota
- [ ] Tienda, economía, cosméticos, decoraciones, estaciones
- [ ] Efectos visuales (Skia: pétalos, sparkles) — replantear con SwiftUI/Canvas/SpriteKit ❓
- [ ] 12 logros de jardín
- RN: `app/jardin.tsx`, `src/components/garden/` (20+ archivos)

### Logros de app — ⬜
- [ ] 15 logros + cola de toasts
- RN: `app/logros.tsx`, `src/lib/achievements.ts`

### Diario de gratitud — ⬜
- [ ] Crear/listar entradas (items cifrados)
- RN: `app/gratitud/nuevo.tsx`, colección `users/{uid}/gratitude`

### Plan de seguridad — ⬜
- [ ] Editor de plan + contactos + líneas de crisis
- RN: `app/plan-seguridad.tsx`, `src/components/safetyPlan/`, `src/constants/crisisHotlines.ts`

### Premium — ⬜
- [ ] Paywall + gestión de suscripción (RevenueCat SDK nativo)
- RN: `app/premium.tsx`, `src/contexts/PremiumContext.tsx`, `src/lib/purchases.ts`

### Compartir cuenta — ⬜
- [ ] Generar/canjear código de 6 chars
- [ ] Tab "Compartido" (Hoy/Calendario/Resumen) en modo solo-lectura
- [ ] Revocar acceso
- RN: `app/(tabs)/compartido.tsx`, `app/compartido-view.tsx`, `src/contexts/SharingContext.tsx`

### Perfil y cuenta — ⬜
- [ ] Pantalla de perfil / ajustes (`app/perfil.tsx`, tab `tu`)
- [ ] Eliminar cuenta (`app/eliminar-cuenta.tsx`)
- [ ] Política de privacidad (`app/politica-privacidad.tsx`)

### Onboarding — ⬜
- [ ] Flujo de onboarding inicial (`app/onboarding.tsx`)
- [ ] Walkthrough/coach marks sobre la UI
- RN: `src/contexts/WalkthroughContext.tsx`, `src/components/ui/WalkthroughOverlay.tsx`, `src/constants/walkthrough.ts`

---

## Orden de portado sugerido

1. **Componentes UI base** — bloquea todo lo demás
2. **Auth** — desbloquea probar todo lo demás autenticado
3. **Check-in diario** — núcleo del producto, valida la capa Firestore completa
4. **Calendario** — consume los check-ins
5. **Insights** + **Notas/registros** + **Plantillas dinámicas** + **Agenda/búsqueda**
6. **Habilidades**, **Gratitud**, **Plan de seguridad** — features autocontenidas
7. **Logros**, **Onboarding**, **Perfil/cuenta**
8. **Premium**, **Compartir cuenta** — integraciones externas
9. **Jardín** — el más complejo, dejar para cuando el resto sea estable
10. **Widget**, **Notificaciones**, **Export PDF** — capas transversales finales

## Decisiones pendientes (❓)

- Esquema de cifrado nativo compatible con los datos ya cifrados en Firestore
- Estrategia de textos: `String(localized:)` vs enum de strings
- Jardín: ¿SwiftUI Canvas, SpriteKit, o repensar los efectos de Skia?
- Bundle ID: hoy comparte `com.akemi01.bloom` con la app RN (mismo `GoogleService-Info`)
- `firestore.rules` / `firestore.indexes.json`: se reutilizan tal cual (mismo proyecto);
  revisar solo si una feature añade colecciones nuevas
