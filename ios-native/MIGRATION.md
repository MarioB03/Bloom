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
| Modelos core | ✅ | `Emotion`, `CheckinEntry`, `UserProfile`, `EmotionalRegisterEntry`, `GratitudeEntry`, `AppAchievement`, `Premium`, `SafetyPlan`, `Sharing`, `Skill`, `GenderedText`. Solo `Template` + `TemplateField` + `RegisterEntry` quedan fuera (feature pospuesta, ver "Plantillas y registros dinámicos") |
| `AuthService` | ✅ | Email/password, social (Apple/Google), creación de perfil Firestore |
| `FirestoreService` | ✅ | CRUD de todas las colecciones en uso: check-ins, registros emocionales (`registers`), gratitud, prácticas de habilidades, plan de seguridad, sharing (códigos + viewers + viewerLinks), Premium (status + canje + admin), preferencia de género, `deleteAllUserData`. Cifrado AES-256-CBC en notas/eventos/registros/gratitud/plan |
| Navegación raíz + TabView 5 pestañas | ✅ | `RootView` con auth guard, vistas placeholder |
| **Componentes UI base** | ✅ | `BloomButton`, `BloomTextField`, `AuthScaffold`, `ScreenWrapper`, `BloomCard`, `Badge`, `EmptyState`, `LoadingSpinner`, `Skeleton` (Box/Card/Stats/Registros/Profile/HomeRecords/Agenda), `FadeIn`, `AchievementToastView` (compartido jardín + app). Skeletons cableados en home (`SkeletonHomeRecords`), Registros (`SkeletonCard ×3`) y perfil (`SkeletonProfile`) |
| **Splash animado** | ✅ | `Features/Splash/AnimatedSplashView.swift` — flor que crece (tallo, hoja, 5 pétalos, centro) y lockup "Bloom · Tu jardín de bienestar". Overlay sobre `RootView` con `minDisplay` de 1.6 s antes de salir. Reemplaza al antiguo `LoadingScreen` |
| **Lenguaje con género** (cross-cutting) | ✅ | `Services/GenderService.swift` + `Models/GenderedText.swift`. Persistencia local (`UserDefaults @ bloom.genderForm`) + sync con `users/{uid}.preferences.genderForm`. Selector en `ProfileView`. `gender.resolve(GenderedText)` reemplaza al `g()` de RN |
| **Lógica de racha / streak** (cross-cutting) | ✅ | `Utils/Streak.swift` en uso en home, jardín, insights, perfil, logros y widget |
| Cifrado de campos sensibles (CryptoJS → CryptoKit) | ✅ | `Services/BloomCrypto.swift` — AES-256-CBC + `EVP_BytesToKey`/MD5, compatible byte a byte con `src/lib/crypto.ts`. Round-trip de notas/eventos con la app RN |
| `Utils/BloomDate.swift` | ✅ | Portado de `src/utils/date.ts` (dateKey, time, displayDate, greeting) |
| `strings.ts` → catálogo de textos | 🚧 | `Strings.swift` con namespace `Auth`/`SocialAuth`/`App`. Se completa feature a feature. Estrategia definitiva (`String(localized:)` vs enum) ❓ |
| Notificaciones (recordatorios diarios) | ✅ | `Services/NotificationsService.swift` con `UNCalendarNotificationTrigger` repetitivo. Toggle + edición de hora en la pestaña Tú. 4 mensajes aleatorios igual que RN. RN: `src/lib/notifications.ts` |
| Export PDF | ✅ | `Services/ExportService.swift` — porta el HTML del RN 1:1 y lo rasteriza con `UIPrintPageRenderer` + `UIMarkupTextPrintFormatter` (A4, margen 40pt). Entrada en Ajustes (Tu) detrás del muro Premium |
| Widget iOS | ✅ | Target `BloomWidget` (app extension), App Group `group.com.akemi01.bloom.shared`, `WidgetSyncService` escribe el snapshot tras cambios en check-ins/jardín |

### Modelos pendientes de portar
Solo `Template` + `TemplateField` + `RegisterEntry` (feature pospuesta, ver
"Plantillas y registros dinámicos"). El resto están portados.

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
- **Pendiente del home RN** (llega con sus features): promo premium, toasts de
  logros. El CTA de gratitud y el mini-libro flotante del diario ya están (ver
  Diario de gratitud y Agenda); el CTA de registro emocional se sustituye por
  el CTA propio de la pestaña Registros
- **Compostar**: editor inline en el detalle (botón 🍃 en la toolbar) con
  mínimo de 30 caracteres, alerta de éxito y badge "Compostado" en la
  reflexión guardada. Acredita 8 🌰 al saldo del jardín
  (`GardenEconomy.creditSeeds(_:)`, persistencia en `UserDefaults` + sync del
  widget) y dispara la comprobación de logros (`app_first_compost`,
  `app_5_composts`). Reflexión cifrada en Firestore vía
  `FirestoreService.compostCheckin(checkinID:userID:reflection:)`. Bloqueado
  en modo solo-lectura (`ownerID != nil`)

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
- [x] Medias de intensidad y calidad de sueño + banner de consejo (Premium)
- [x] Correlaciones (≥ 7 registros): sueño, hambre, ciclo, día de la semana,
  tendencia semanal — `Correlations.swift` portado de `correlations.ts` (Premium)
- [x] Gating Premium: candado tappable que abre `PremiumView` como hoja modal
  cuando el usuario no tiene Premium activo (mismo criterio que RN)
- Nativo: `Features/Insights/` (`InsightsView`, `Correlations`),
  `FirestoreService.allCheckins(userID:)`
- RN: `app/insights.tsx`, `src/lib/correlations.ts`
- **Divergencia de RN**: el botón "Volver" del RN se omite porque desde la
  Fase de Perfil Insights se accede via NavigationStack y la barra de
  navegación ya provee el botón de retroceso. Los stats básicos (totales,
  actividad semanal y top de emociones) siguen siendo gratuitos

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
- **Divergencia de RN**: el CTA de crear registro vive en la propia pestaña
  "Registros" (no en el home). El interruptor "visible al compartir" se omite
  porque la feature de compartir no está portada (mismo criterio que Premium);
  el campo `sharedVisible` se conserva en `false` para el round-trip con la app
  RN. El listado combinado con búsqueda y filtros se porta en "Agenda y
  búsqueda" (ver abajo) — es la misma pestaña

### Plantillas y registros dinámicos — ⏭️ pospuesta (sin UI en RN)
La app RN **nunca implementó esta feature**: solo existe `src/types/template.ts`
con los modelos (`Template` + `TemplateField` + `RegisterEntry`) y la regla
read-only `match /templates/{templateId}` en `firestore.rules`. Ninguna pantalla
usa esos tipos y la string `registers.noTemplates` ("Próximamente habrá
plantillas disponibles") está muerta. No hay UI que portar → se pospone; cuando
se aborde será desarrollo nuevo, no migración.

### Agenda y búsqueda — ✅
- [x] Diario combinado en la pestaña "Registros" (`NotesView`): check-ins,
  registros emocionales y entradas de gratitud, agrupados por día
- [x] Búsqueda por texto libre sobre las tres clases de entrada
- [x] Segmentos por tipo (Todos / Check-ins / Registros / Gratitud)
- [x] Filtros por emoción (`EmotionChipsRow`) y por rango de fechas
  (`DateFilterField`, con el `DatePicker` gráfico del sistema)
- [x] Tarjeta de gratitud para el listado (`Components/GratitudeCard`)
- [x] Mini-libro flotante en el home + animación de "libro que se abre"
  (`MiniDiaryBook`, `DiaryBookView`): el contenido del diario vive en
  `DiaryView`, reutilizado tal cual por la pestaña y por la animación
- Nativo: `Features/Notes/NotesView.swift` (tipos `AgendaItem` /
  `AgendaSegment` / `AgendaDestination`, `NotesView` y `DiaryView`),
  `Features/Notes/DiaryBookView.swift`, `Features/Notes/BookCoverView.swift`,
  `Features/Notes/Components/` (`GratitudeCard`, `AgendaFilters`),
  `Strings.Agenda`. CTA del mini-libro en `CheckInHomeView`
- RN: `app/agenda.tsx`, `app/(tabs)/registros.tsx`, `src/components/search/`,
  `app/(tabs)/index.tsx` (mini-libro)
- **Divergencia de RN**: se unifican `registros.tsx` (pestaña) y `agenda.tsx`
  (pantalla apilada) en una sola vista, accesible tanto desde la pestaña
  "Registros" como desde el mini-libro del home. La animación del "libro que
  se abre" se recrea con SwiftUI (`rotation3DEffect` sobre el lomo a partir de
  un único `progress` 0→1): el libro se desplaza y crece desde el marco real
  del mini-libro (medido con `GeometryReader` en coordenadas `.global`) y
  vuelve ahí al cerrarse. Las tarjetas de gratitud muestran sus
  motivos en línea y no navegan (editar la gratitud de hoy se hace desde el
  CTA del home; el modo solo-lectura de días pasados de RN no se porta). El
  `DatePickerField` hecho a mano de RN se sustituye por el `DatePicker` nativo

### Habilidades — ✅
- [x] Listado por categorías + filtro por emoción + habilidades sugeridas
- [x] Detalle de habilidad: héroe, pasos (artículo) o previsualización
  (ejercicio), consejos y botón de acción
- [x] Ejercicios paso a paso: indicador de pasos, timer con barra de progreso,
  círculo de respiración animado (`BreathingCircle`) y pantalla de "completado"
- [x] Detalle de categoría con filtro por tipo (todas / ejercicios / artículos)
- [x] Historial de práctica con tarjetas de resumen, agrupado por día
- Nativo: `Models/Skill.swift` (modelos + `SkillPractice`),
  `Features/Skills/SkillCatalog.swift` (las 18 habilidades + helpers),
  `Features/Skills/` (`SkillsView` con `SkillsDestination`,
  `SkillCategoryDetailView`, `SkillDetailView`, `PracticeHistoryView`),
  `Features/Skills/Components/` (`SkillCard`, `CategoryCard`, `SkillTypeBadge`,
  `StepIndicator`, `ExerciseTimer`, `BreathingCircle`, `PracticeHistoryCard`),
  CRUD de `skillPractice` en `FirestoreService`, `Strings.Skills` /
  `Strings.Breathing`
- RN: `app/(tabs)/habilidades.tsx`, `app/habilidad/`, `app/habilidades/`,
  `src/components/skills/`, `src/constants/skills.ts`
- **Divergencia de RN**: el catálogo de 18 habilidades es estático (no se lee
  de Firestore), igual que en RN. El `setInterval` del timer se recrea con un
  `Timer.publish`; el ciclo de `setTimeout` anidados del círculo de respiración
  se recrea con una tarea `async` que se cancela al pausar. En RN
  `createSkillPractice` y la pantalla de historial existen pero **no se conectan
  a ninguna UI** (el historial nunca recibe datos): en nativo sí se registra una
  `SkillPractice` al completar un ejercicio o marcar un artículo como practicado,
  y el historial es accesible desde un botón en la cabecera de la pestaña

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
  acción reversible dentro de su modo). La tienda solo permite comprar con
  Premium activo (mismo criterio que RN): sin él, el catálogo es navegable
  pero los botones de precio abren una alerta con CTA al paywall
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

### Logros de app — ✅
- [x] 19 logros de app (check-ins, rachas, gratitud, emociones, compostaje,
  habilidades) con catálogo, comprobación y persistencia en `UserDefaults`
- [x] Pantalla de logros: resumen + rejillas de logros de app y de jardín
- [x] Cola de toasts: se comprueba tras guardar y se muestra en el home
- Nativo: `Models/AppAchievement.swift`,
  `Features/Achievements/{AppAchievementCatalog,AppAchievementPersistence,AppAchievements,AchievementsView}.swift`,
  `Strings.Achievements`. `AchievementToastView` ahora es reutilizable
  (jardín + app)
- RN: `app/logros.tsx`, `src/lib/achievements.ts`
- **Punto de entrada**: en RN vive en la pestaña de perfil (aún no portada);
  aquí se accede desde el botón 🏆 de la cabecera del home
- **Divergencia de RN**: los títulos con flexión por género (5 logros:
  `app_100_checkins`, `app_first_gratitude`, `app_5_composts`,
  `app_15_practices`, `app_all_categories`) se resuelven via
  `GenderService.resolve(_:)` tanto en la pantalla de logros como en el toast
  del home. Los logros de compostaje ya se desbloquean en nativo desde que el
  detalle de check-in permite compostar (ver "Check-in diario")

### Diario de gratitud — ✅
- [x] Modelo `GratitudeEntry` + colección `users/{uid}/gratitude` con `items[]`
  cifrados en `FirestoreService` (`gratitude(byDate:)`, `allGratitude`,
  `createGratitude`, `updateGratitude`)
- [x] Editor de la gratitud de hoy — 3 motivos, crea o edita la entrada del día
  (`GratitudeView`, hoja modal)
- [x] CTA del diario de gratitud en el home (`CheckInHomeView`), con estado
  "Gratitud de hoy" cuando ya está registrada
- Nativo: `Features/Gratitude/GratitudeView.swift`,
  `Models/GratitudeEntry.swift`, `Strings.Gratitude`
- RN: `app/gratitud/nuevo.tsx`, colección `users/{uid}/gratitude`
- **Sin divergencia**: solo se edita la gratitud de **hoy**, igual que en RN
  (la app RN tampoco tiene ruta de detalle ni modo solo-lectura: solo
  `/gratitud/nuevo`). La comprobación de logros la dispara el home al
  recargarse tras guardar (ver "Logros de app")

### Plan de seguridad — ✅
- [x] Editor de plan: 5 secciones plegables (señales de alerta, estrategias de
  afrontamiento, contactos de confianza, pasos personales, líneas de crisis)
- [x] Contactos de confianza editables y llamables (con confirmación)
- [x] Líneas de crisis estáticas agrupadas por país, llamables
- [x] Guardado automático con rebote de 1,5 s (sin botón de guardar)
- Nativo: `Features/SafetyPlan/SafetyPlanView.swift`,
  `Features/SafetyPlan/CrisisHotlineCatalog.swift`,
  `Features/SafetyPlan/Components/{EditableListEditor,ContactListEditor,CrisisHotlineListView}.swift`,
  `Models/SafetyPlan.swift`, `Strings.SafetyPlan`, CRUD en `FirestoreService`
  (doc único `users/{uid}/safetyPlan/plan`, campos cifrados)
- RN: `app/plan-seguridad.tsx`, `src/components/safetyPlan/`, `src/constants/crisisHotlines.ts`
- **Punto de entrada**: en RN vive en la pestaña de perfil (aún no portada);
  aquí se accede desde un botón 🛡️ en la cabecera de la pestaña Habilidades
- **Divergencia de RN**: al salir de la pantalla se vuelca el guardado pendiente
  en lugar de descartarlo (RN hace `clearTimeout` en el desmontaje y pierde el
  último cambio si no han pasado los 1,5 s)

### Premium — 🚧
- [x] Paywall + canje de código de regalo → `Features/Premium/PremiumView.swift`
- [x] Servicio Premium (`Services/PremiumService.swift`) + modelos (`Models/Premium.swift`)
- [x] Métodos Firestore: `userPremiumStatus`, `redeemPremiumCode`
- **Divergencia clave**: pasarela de pago en **StoreKit 2 nativo**, no
  RevenueCat (la app RN usa `react-native-purchases`). Decisión del usuario:
  ir directo contra App Store.
- **Product IDs**: `bloom_premium_annual` y `bloom_premium_monthly` (con guion
  bajo, los IDs que ya existían en ASC desde la versión RN — no se pueden
  renombrar). Subscription group "Bloom Premium". Free trial 1 semana en el
  anual, sin trial en el mensual. Quedan en estado "Lista para enviar" hasta
  que se adjunten a una versión de la app y se envíen a revisión
- **Gift codes**: lógica idéntica a RN — `premiumCodes/{code}` +
  `users/{uid}.premium`. La suscripción tiene prioridad sobre el gift code
  como fuente que se muestra
- **Cableado**: `PremiumService` se crea en `BloomApp`, se inyecta vía
  `.environment`. `MainTabView` refresca el estado en `.task(id: userID)`.
  Entrada desde la pestaña Tú con badge "Premium" si activo
- [x] Toggle Premium para desarrollo: sección "Desarrollo" en la pestaña Tú,
  visible solo en builds `#if DEBUG`. Llama a
  `FirestoreService.setAdminPremium(userID:active:)` que escribe el mismo
  formato de gift code "ADMIN" + 365 días que `setAdminPremium` de RN, y
  refresca `PremiumService` al instante
- [x] Sección admin "Generar código Premium" en `PremiumView`. Gated por
  `adminUserID = "IUrBhjLrTLZZkwuj8B8qSXRX7iH3"` (mismo UID que RN). Crea un
  gift code de 365 días con caducidad de 30 días via
  `FirestoreService.createPremiumCode(adminUserID:)`, lo copia al portapapeles
  y lo muestra en una alerta. Listar códigos existentes no se porta (tampoco
  existe en RN). El toggle Premium DEBUG sigue en la pestaña Tú
- [x] Gating real de features:
  - Compartir cuenta (Sharing): generar/canjear código bloqueado tras alerta
  - Insights avanzados: candado tappable que abre el paywall como hoja modal
  - Tienda del jardín: catálogo navegable, compra bloqueada tras alerta con
    CTA al paywall
  - Export PDF: fila en Ajustes con badge Premium; alerta con CTA al paywall

### Compartir cuenta — ✅
- [x] Generar/canjear código de 6 chars → `SharingView.swift` + `FirestoreService.createSharingCode`/`redeemSharingCode`
- [x] Tab "Compartido" (Hoy/Calendario/Resumen) en modo solo-lectura → `SharedTabView.swift`, visible solo cuando `SharingService.sharedAccount != nil`
- [x] Revocar acceso → `FirestoreService.revokeAccess(ownerID:viewerID:)`, refleja en ambos lados (`viewers` + `viewerLinks`)
- [x] Modo solo lectura en detalles: `CheckInDetailView`, `DayDetailView` y `EmotionalRegisterDetailView` aceptan `ownerID:` opcional (oculta editar/eliminar, lee del dueño)
- RN: `app/(tabs)/compartido.tsx`, `app/compartido-view.tsx`, `src/contexts/SharingContext.tsx`, `app/perfil.tsx`
- **SharingService**: `@Observable`, expone `viewer` y `sharedAccount`. Se refresca al cambiar `auth.currentUserID` desde `MainTabView`
- **Gating Premium**: generar y canjear código están bloqueados detrás de Premium con alerta (mismo criterio que RN). Una vez vinculado, la pestaña Compartido es accesible aunque se pierda Premium
- **Registros emocionales filtrados**: `FirestoreService.emotionalRegisters(byDate:userID:sharedOnly:)` y `allEmotionalRegisters(userID:sharedOnly:)` filtran por `sharedVisible == true` para cumplir las reglas de Firestore (`registers/{id}` requiere ese filtro en lecturas de viewer)
- **Gratitud compartida**: RN tampoco abre la gratitud del dueño en modo
  solo-lectura (no hay ruta), así que aquí no hay nada que portar. Los
  mensajes con flexión por género (`revokeConfirmMessage`,
  `errorAlreadyLinked`) ya se resuelven con `GenderService.resolve(...)`

### Perfil y cuenta — 🚧
- [x] Pantalla de perfil / ajustes (pestaña `tu`) → `Features/Profile/ProfileView.swift`
- [x] Eliminar cuenta (`app/eliminar-cuenta.tsx`) → `Features/Profile/DeleteAccountView.swift`
- [x] Política de privacidad (`app/politica-privacidad.tsx`) → `Features/Profile/PrivacyPolicyView.swift`
- [x] Pantalla de compartir datos (`app/perfil.tsx` en RN — la URL es engañosa,
  es la pantalla de sharing) → `Features/Sharing/SharingView.swift`, accesible desde la pestaña "Tú"
- **Tabs**: pasa de 5 a 5 manteniendo el set canónico de RN. Se quita
  `InsightsView` como pestaña independiente y entra como acceso desde "Tú".
  Tabs finales: Hoy, Calendario, Registros, Habilidades, Tú
- **AuthService**: añade `currentAuthProvider`, `reauthenticate(password:)`,
  `reauthenticateWithApple`, `reauthenticateWithGoogle`, `deleteAccount`. La
  baja limpia las claves locales `bloom.*` de `UserDefaults` antes de
  `user.delete()`
- **FirestoreService**: añade `deleteAllUserData(userID:)` — borra
  subcolecciones (checkins, registers, gratitude, skillPractice, safetyPlan)
  + documento de perfil. Best-effort. No toca `sharingCodes`/`viewerLinks`
  todavía: cuando se borra una cuenta no se revoca el vínculo activo (queda
  como referencia muerta; el viewer ve "no autorizado" al intentar leer)
- **Sección Ajustes**: toggle del recordatorio diario con
  `NotificationsService` (pide permiso al activar, lo programa con
  `UNCalendarNotificationTrigger` repetitivo). Al tocar la fila con el
  recordatorio activo se abre una hoja con `DatePicker` para cambiar la hora.
  Si el permiso está denegado en Ajustes del sistema, el toggle revierte y se
  muestra una alerta con instrucciones
- **Exportar PDF**: fila en Ajustes con badge Premium. Si el usuario es
  Premium, genera el PDF (mismo HTML que la app RN) y lo abre con
  `UIActivityViewController`; si no, alerta con CTA al paywall. El servicio
  (`ExportService`) vive aparte para mantener la vista ligera
- **Entradas duplicadas**: Logros (🏆 home) y Plan de seguridad (🛡️
  Habilidades) siguen como cabeceras además de aparecer dentro de "Tú". Se
  podrán retirar cuando se decida la canónica

### Onboarding — ✅
- [x] Flujo de onboarding inicial (`app/onboarding.tsx`) → `Features/Onboarding/OnboardingView.swift`
- [x] ~~Walkthrough/coach marks sobre la UI~~ — **no se porta**: estaba
  desactivado en RN ("Walkthrough disabled for now" en `app/_layout.tsx`),
  nunca llegó a producción
- **Punto de entrada**: `RootView` muestra `OnboardingView` cuando hay sesión
  cerrada y `bloom.onboardingComplete` (`@AppStorage`) es `false`. En RN el
  login redirige a `/onboarding`; en nativo es el `RootView` quien decide,
  antes de `AuthView`
- **Carrusel**: `TabView` con `.page` style; 3 diapositivas con emoji
  flotante, degradado por slide, dots animados y botón Siguiente/Comenzar

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
