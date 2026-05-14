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
| Modelos core (Emotion, CheckinEntry, UserProfile) | 🚧 | Solo 3 de ~10 modelos (+ `CheckinDraft`) — ver "Modelos pendientes" |
| `AuthService` | ✅ | Email/password, social (Apple/Google), creación de perfil Firestore |
| `FirestoreService` | 🚧 | CRUD cifrado de check-ins y de registros emocionales (colección `registers`); resto de colecciones pendiente |
| Navegación raíz + TabView 5 pestañas | ✅ | `RootView` con auth guard, vistas placeholder |
| **Componentes UI base** | 🚧 | Hechos: `BloomButton`, `BloomTextField`, `AuthScaffold`, `ScreenWrapper`, `BloomCard`, `Badge`, `EmptyState`. Pendientes: LoadingSpinner, Skeleton, FadeIn, 2× AchievementToast |
| **Splash animado** | ⬜ | `src/components/ui/AnimatedSplash.tsx` (usado en `app/_layout.tsx`) |
| **Lenguaje con género** (cross-cutting) | ⬜ | `src/contexts/GenderContext.tsx`, usado en 8 pantallas; afecta a los textos. El registro ya guarda `genderForm` en el perfil; falta persistencia local |
| **Lógica de racha / streak** (cross-cutting) | 🚧 | `Utils/Streak.swift` portado y en uso en el home; falta integrarlo en jardín, insights y perfil cuando se porten |
| Cifrado de campos sensibles (CryptoJS → CryptoKit) | ✅ | `Services/BloomCrypto.swift` — AES-256-CBC + `EVP_BytesToKey`/MD5, compatible byte a byte con `src/lib/crypto.ts`. Round-trip de notas/eventos con la app RN |
| `Utils/BloomDate.swift` | ✅ | Portado de `src/utils/date.ts` (dateKey, time, displayDate, greeting) |
| `strings.ts` → catálogo de textos | 🚧 | `Strings.swift` con namespace `Auth`/`SocialAuth`/`App`. Se completa feature a feature. Estrategia definitiva (`String(localized:)` vs enum) ❓ |
| Notificaciones (recordatorios diarios) | ⬜ | RN: `src/lib/notifications.ts` |
| Export PDF | ⬜ | RN: `src/lib/export-pdf.ts`, `src/lib/export.ts` |
| Widget iOS | ⬜ | RN ya tiene uno vía `@bacons/apple-targets` + `widget-sync.ts` |

### Modelos pendientes de portar (se harán con cada feature)
`GratitudeEntry` · `Skill` · `Template` + `TemplateField` +
`RegisterEntry` · `PremiumStatus` · tipos de `SafetyPlan` · tipos de `Sharing`.
Hechos: `Emotion`, `CheckinEntry`, `UserProfile`, `EmotionalRegisterEntry`.

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

### Check-in diario — ✅
- [x] Home — saludo, racha y check-ins de hoy (`CheckInHomeView`)
- [x] Crear check-in (sheet modal) — emoción, intensidad, sueño, hambre, ciclo, eventos, notas
- [x] Ver check-in — detalle (`CheckInDetailView`)
- [x] Editar check-in — `CheckInFormView` con `entryToEdit`
- [x] Eliminar check-in — `confirmationDialog` desde el detalle
- [x] Componentes: `EmotionPicker`, `IntensitySelector`, `CycleTracker`, `EventInput`, `CheckinCard`
- Nativo: `Features/CheckIn/` + `Features/CheckIn/Components/`, `FirestoreService` (CRUD cifrado)
- RN: `app/checkin/`, `src/components/checkin/`, `app/(tabs)/index.tsx`
- **Pendiente del home RN** (llega con sus features): promo premium, CTA de registro
  emocional, gratitud, toasts de logros, diario flotante (agenda)
- **Compostar**: omitido en el detalle — depende de la economía del jardín (no portada).
  El detalle sí muestra `compostReflection` si ya existe

### Calendario emocional — ✅
- [x] Vista mensual con punto de la emoción predominante por día
- [x] Navegación de meses (anterior/siguiente)
- [x] Leyenda de emociones del mes
- [x] Detalle de día (`DayDetailView`) — lista de check-ins, banner de fecha,
  botón "Añadir registro" solo si es hoy
- [x] Componentes: `MonthNavigator`, `MonthGrid` (+ `DayCell`)
- [x] Util `FlowLayout` (Layout para `flexWrap`, reutilizable en badges/chips)
- Nativo: `Features/Calendar/` + `Features/Calendar/Components/`, `Utils/FlowLayout.swift`,
  `FirestoreService.checkins(byDateRange:to:userID:)`
- RN: `app/(tabs)/calendario.tsx`, `app/dia/[fecha].tsx`, `src/components/calendar/`
- **Pendiente del detalle de día RN** (llega con sus features): registros
  emocionales y gratitud del día. Nativo muestra solo check-ins por ahora

### Insights — ✅
- [x] Resumen emocional (check-ins, días activos, racha)
- [x] Actividad semanal (gráfico de barras de la semana en curso, lunes a domingo)
- [x] Emociones más frecuentes (top 5 con barra de porcentaje)
- [x] Medias de intensidad y calidad de sueño + banner de consejo
- [x] Correlaciones (≥ 7 registros): sueño, hambre, ciclo, día de la semana,
  tendencia semanal — `Correlations.swift` portado de `correlations.ts`
- Nativo: `Features/Insights/` (`InsightsView`, `Correlations`),
  `FirestoreService.allCheckins(userID:)`
- RN: `app/insights.tsx`, `src/lib/correlations.ts`
- **Divergencia de RN**: en RN las medias y correlaciones van detrás del muro
  de Premium; aquí se muestran siempre porque Premium no está portado (mismo
  criterio que la tienda del jardín). El botón "Volver" del RN se omite: en
  nativo Insights es una pestaña, no una pantalla apilada

### Notas y registros emocionales — ✅
- [x] Pestaña "Registros" — listado de registros emocionales (`NotesView`)
- [x] Registro emocional "Observar y describir" — crear/editar
  (`EmotionalRegisterFormView`, intensidad 1–10 con `Slider`)
- [x] Detalle del registro — campos rellenados, editar y eliminar
  (`EmotionalRegisterDetailView`)
- [x] Componente `EmotionalRegisterCard`
- [x] Modelo `EmotionalRegisterEntry` + `EmotionalRegisterDraft`; colección
  `users/{uid}/registers` con cifrado de los 10 campos de texto libre en
  `FirestoreService`
- Nativo: `Features/Notes/` (`NotesView`, `EmotionalRegisterFormView`,
  `EmotionalRegisterDetailView`, `Components/EmotionalRegisterCard`),
  `Models/EmotionalRegisterEntry.swift`, `Strings.EmotionalRegister`
- RN: `app/(tabs)/notas.tsx`, `app/registro-emocional/`,
  `src/components/checkin/EmotionalRegisterCard.tsx`
- **Divergencia de RN**: en RN los registros se crean desde un CTA del home y
  se listan mezclados con los check-ins en un buscador con filtros
  (`app/(tabs)/registros.tsx`). Aquí la pestaña es autónoma: lista solo
  registros emocionales y tiene su propio CTA. El buscador combinado llegará
  con la feature "Agenda y búsqueda". El interruptor "visible al compartir"
  se omite porque la feature de compartir no está portada (mismo criterio que
  Premium); el campo `sharedVisible` se conserva en `false` para el round-trip
  con la app RN

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

### Jardín de bienestar — ✅ (el más grande, portado por fases)
Motor de render decidido: **`SwiftUI Canvas` + `TimelineView(.animation)`** (no
SpriteKit). Mapea 1:1 con el Skia de RN. Se accede desde la **tarjeta de racha
del home** (`CheckInRoute.garden`), no es pestaña — igual que en RN.
- [x] **Fase 1 — Cimientos**: modelos (`GardenModels`, `GardenGrid`,
  `DecorationType`, `PlantMorphology`, `SeasonalTheme`, `GardenAchievement`,
  `GardenCosmetics`, `GardenEconomy`), iso math (`GardenIso`), persistencia
  (`GardenPersistence`, `UserDefaults`), `GardenStore` (`@Observable @MainActor`:
  carga de check-ins, auto-placement espiral, economía de semillas, compras,
  logros)
- [x] **Fase 2 — Escena estática**: `GardenScene` (Canvas: cielo, rejilla
  isométrica, plantas con 12 morfologías × 6 etapas, decoraciones como emoji),
  `GardenRenderer`, `GardenView` (cabecera + tarjeta de progreso + escena que
  llena la pantalla, jardín escalado y centrado sin scroll)
- [x] **Fase 3 — Animación**: `GardenScene` envuelve el `Canvas` en
  `TimelineView(.animation)` y pasa el tiempo absoluto al renderer. Vaivén de
  plantas (oscilación del tallo con fase por celda), atmósfera (sol pulsante /
  luna, estrellas titilantes de noche, nubes con desplazamiento continuo,
  mariposas de día, luciérnagas de noche) y partículas estacionales
  (pétalos/hojas/nieve). Cantidades escaladas con la racha, igual que en RN
- [x] **Fase 4 — Interacción**: toque sobre el `Canvas` → celda (invirtiendo la
  transformada de escala/centrado de `GardenScene`), modos Mirar y Regar con
  barra de modos y ayuda contextual, `PlantInfoView` (hoja nativa con detente),
  splash de agua (`drawWaterEffect`: gotas, anillos, salpicaduras) y anillo
  pulsante bajo las plantas regables. El modo Decorar y el long-press (que en
  RN solo quita decoraciones) van a Fase 5 con el picker
- [x] **Fase 5 — Economía + tienda**: `GardenShop` (hoja con `List` de
  secciones —una por categoría— y filas con descripción + botón de precio;
  saldo en el toolbar), `DecorationPicker` (hoja modal con `List` de dos
  secciones —gratuitas por racha / premium—; *elegir* es modal, *colocar* usa
  el jardín entero). Modo Decorar en la barra de modos con un chip que muestra
  el "pincel" activo y abre la paleta; botón de tienda en el toolbar. Quitar
  una decoración = tocarla en modo Decorar (sin long-press ni confirmación:
  acción reversible dentro de su modo). La tienda no se restringe a Premium
  (esa función no está portada)
- [x] **Fase 6 — Mascotas**: las 5 con su movimiento propio. `PetType`
  (`Models/PetType.swift`); el gato es gratis con racha ≥ 3 y las otras 4 se
  derivan de `purchasedIDs` (`GardenStore.activePets`). `GardenRenderer.drawPets`
  porta los 5 dibujos (gato, conejo, pájaro, mariposa dorada, erizo) con su
  recorrido y ritmo propios, en coordenadas de pantalla; se llaman desde
  `GardenScene` junto a los visitantes
- [x] **Fase 7 — Logros + celebraciones**: `AchievementToastView` (toast
  efímero que entra/sale desde arriba, con cola consumida desde
  `GardenStore.pendingAchievements`) y `StreakCelebrationView` (modal a pantalla
  completa con confeti, emoji rebotando y bono de semillas). Los hitos viven en
  `StreakMilestone` (3/7/14/21/30) y `GardenStore.pendingMilestone` decide cuál
  celebrar; `GardenView` los muestra como overlays
- [x] **Fase 8 — Cosméticos + pulido**: los 4 cosméticos ahora hacen algo
  visible (en RN estaban definidos pero sin usar). `sunsetSky` ya estaba;
  añadidos `stonePath` (tiñe la rejilla de gris piedra con guijarros en
  `drawTiles`), `flowerFence` (florecitas sobre los postes) y `firefliesAlways`
  (luciérnagas también de día en `drawCreatures`). Portada la **valla**
  (`drawFence`, postes en los bordes traseros con racha ≥ 3) que no existía.
  `GardenStatsView` (flores plantadas, emoción/planta dominante, vitalidad +
  barra) bajo la escena. Botón de **compartir** en el toolbar: rasteriza la
  escena con `ImageRenderer` y abre la hoja del sistema (`UIActivityViewController`)
- Nativo: `Features/Garden/` (`GardenView`, `GardenScene`, `GardenStore`,
  `GardenIso`, `GardenPersistence`, `Models/`, `Rendering/GardenRenderer`)
- RN: `app/jardin.tsx`, `src/components/garden/` (20+ archivos)
- **Pendiente conocido**: decoraciones se dibujan con su emoji (las formas Skia
  personalizadas de RN no se portaron); plantas en `growthStage` bajo se ven
  como brotes pequeños (fiel a los datos); efectos animados de decoración
  (fuente, farol, pozo…) de `GardenCanvas.tsx` no portados

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

- Estrategia de textos: `String(localized:)` vs enum de strings
- ~~Jardín: ¿SwiftUI Canvas, SpriteKit, o repensar los efectos de Skia?~~ →
  **resuelto**: `SwiftUI Canvas` + `TimelineView(.animation)`
- Bundle ID: hoy comparte `com.akemi01.bloom` con la app RN (mismo `GoogleService-Info`)
- `firestore.rules` / `firestore.indexes.json`: se reutilizan tal cual (mismo proyecto);
  revisar solo si una feature añade colecciones nuevas
