import Foundation

/// Catálogo de textos de la UI, todo en español.
/// Portado de `src/constants/strings.ts` de la app React Native.
///
/// Se irá completando feature a feature; por ahora cubre Auth.
/// La estrategia definitiva (`String(localized:)` vs enum) está por decidir.
enum Strings {

    enum App {
        static let name = "Bloom"
    }

    enum Auth {
        static let login = "Iniciar sesión"
        static let register = "Crear cuenta"
        static let forgotPassword = "Recuperar contraseña"
        static let email = "Correo electrónico"
        static let password = "Contraseña"
        static let confirmPassword = "Confirmar contraseña"
        static let displayName = "Nombre"
        static let loginButton = "Entrar"
        static let registerButton = "Registrarse"
        static let forgotPasswordButton = "Enviar enlace"
        static let noAccount = "¿No tienes cuenta?"
        static let hasAccount = "¿Ya tienes cuenta?"
        static let forgotPasswordLink = "¿Olvidaste tu contraseña?"
        static let backToLogin = "Volver al inicio"
        static let logout = "Cerrar sesión"
        static let genderLabel = "Forma de tratamiento"
        static let genderFeminine = "Femenino"
        static let genderMasculine = "Masculino"
        static let genderNeutral = "Neutro"
    }

    enum SocialAuth {
        static let divider = "o continuar con"
        static let apple = "Continuar con Apple"
        static let google = "Continuar con Google"
    }

    enum PrivacyPolicy {
        static let title = "Política de privacidad"
        static let link = "Política de privacidad"
    }

    enum Common {
        static let save = "Guardar"
        static let cancel = "Cancelar"
        static let delete = "Eliminar"
        static let edit = "Editar"
        static let back = "Volver"
        static let close = "Cerrar"
        static let done = "Listo"
        static let loading = "Cargando..."
        static let error = "Ha ocurrido un error"
        static let retry = "Reintentar"
    }

    enum Greeting {
        static let morning = "Buenos días"
        static let afternoon = "Buenas tardes"
        static let evening = "Buenas noches"
    }

    enum CheckIn {
        static let newCheckin = "Registro diario"
        static let newCheckinSubtitle = "¿Cómo te has sentido hoy?"
        static let todayRecords = "Registros de hoy"
        static let noRecordsToday = "Aún no has registrado nada hoy"
        static let sectionDaily = "Registros diarios"

        static let formTitle = "¿Cómo te sientes?"
        static let formSubtitle = "Un momento para ti"
        static let editTitle = "Editar registro"
        static let detailTitle = "Detalle"

        static let emotion = "¿Cuál es tu emoción predominante?"
        static let intensity = "Intensidad"
        static let sleep = "¿Cómo has dormido?"
        static let hunger = "Nivel de hambre"
        static let cycle = "Fase del ciclo"
        static let physicalState = "Estado físico"

        static let events = "Eventos importantes"
        static let event = "Evento"
        static let eventTitle = "Título del evento"
        static let eventDescription = "Descripción"
        static let addEvent = "Añadir otro evento"

        static let notes = "Notas adicionales"
        static let notesPlaceholder = "Escribe lo que quieras..."

        static let save = "Guardar registro"
        static let saveChanges = "Guardar cambios"
        static let selectEmotion = "Selecciona una emoción"
        static let saveError = "No se pudo guardar el registro"

        static let deleteTitle = "Eliminar registro"
        static let deleteMessage = "¿Seguro que quieres eliminar este registro?"
        static let notFound = "Registro no encontrado"

        /// Etiqueta de la intensidad emocional (1–5).
        static func intensityLabel(_ value: Int) -> String {
            ["Muy baja", "Baja", "Media", "Alta", "Muy alta"][safe: value - 1] ?? ""
        }

        /// Etiqueta de la calidad del sueño (1–5).
        static func sleepLabel(_ value: Int) -> String {
            ["Muy mal", "Mal", "Regular", "Bien", "Muy bien"][safe: value - 1] ?? ""
        }

        /// Etiqueta del nivel de hambre (1–5).
        static func hungerLabel(_ value: Int) -> String {
            ["Sin hambre", "Poco", "Normal", "Hambriento", "Mucha hambre"][safe: value - 1] ?? ""
        }

        /// Etiqueta de la fase del ciclo menstrual.
        static func cycleLabel(_ phase: CyclePhase) -> String {
            switch phase {
            case .menstruacion: "Menstruación"
            case .folicular: "Folicular"
            case .ovulacion: "Ovulación"
            case .lutea: "Lútea"
            case .noAplica: "No aplica"
            }
        }
    }

    enum Calendar {
        static let title = "Calendario"
        static let subtitle = "Tu mapa emocional mensual"
        static let legendTitle = "Emociones del mes"
        static let dayDetailTitle = "Detalle del día"
        static let addRecord = "Añadir registro"
        static let emptyDay = "Tu jardín está esperando\n¡Añade tu primer registro del día!"

        /// "1 registro" / "N registros".
        static func recordCount(_ count: Int) -> String {
            "\(count) \(count == 1 ? "registro" : "registros")"
        }
    }

    enum Garden {
        static let title = "Tu jardín"
        static let subtitle = "Cada registro florece aquí"
        static let emptyTitle = "Tu jardín está por brotar"
        static let emptyMessage = "Haz tu primer registro diario\npara plantar tu primera flor"
        static let seedsLabel = "Semillas"
        static let streakLabel = "Racha"
        static let levelLabel = "Nivel"

        /// "1 planta" / "N plantas".
        static func plantCount(_ count: Int) -> String {
            "\(count) \(count == 1 ? "planta" : "plantas")"
        }

        // Modos de interacción
        static let modeView = "Mirar"
        static let modeWater = "Regar"
        static let modeDecorate = "Decorar"
        static let modeViewHint = "Toca una planta para ver su detalle"
        static let modeWaterHint = "Toca una planta para regarla y acelerar su crecimiento"
        static let modeDecorateHint = "Elige una decoración y toca una celda. Toca una decoración para quitarla."

        // Decoración
        static let decorationsTitle = "Decoraciones"
        static let decoratePickPrompt = "Elige una decoración"
        static let decorationsStreakSection = "Se desbloquean con tu racha"
        static let decorationsPremiumSection = "Premium"
        static let decorationOwned = "Comprada"
        static let shopButton = "Tienda"

        /// Requisito de racha de una decoración aún bloqueada.
        static func decorationStreakNeeded(_ days: Int) -> String {
            "Racha de \(days) días"
        }

        // Detalle de planta
        static let plantPlanted = "Plantada"
        static let plantIntensity = "Intensidad"
        static let plantGrowth = "Crecimiento"
        static let plantWater = "Regar planta"
        static let plantWaterHint = "+1 nivel de crecimiento"
        static let plantWateredToday = "Regada hoy"

        /// Etiqueta de la etapa de crecimiento de una planta (0–5).
        static func growthLabel(_ stage: Int) -> String {
            ["Semilla", "Brote", "Creciendo", "Floreciendo", "Casi lista", "Flor completa"][safe: stage] ?? "Semilla"
        }

        // Celebración de hito de racha
        static let celebrationButton = "¡Genial!"

        /// Bono de semillas mostrado en la celebración de un hito.
        static func celebrationSeeds(_ count: Int) -> String {
            "+\(count) 🌱"
        }

        // Estadísticas del jardín
        static let flowersPlanted = "flores plantadas"
        static let vitalityFull = "¡Plena forma!"
        static let vitalityHealthy = "Muy sano"
        static let vitalityThirsty = "Necesita agua"
        static let vitalityDry = "Sediento"

        // Compartir
        static let shareButton = "Compartir jardín"
        static let shareError = "No se pudo compartir la imagen"
    }

    /// Compostaje de un check-in: el usuario escribe una reflexión sobre la
    /// emoción registrada y a cambio gana semillas para el jardín. Portado de
    /// `strings.compostar` en `src/constants/strings.ts`.
    enum Compostar {
        static let button = "Compostar"
        static let title = "Reflexiona y transforma"
        static let prompt = "¿Qué aprendiste de esta experiencia?"
        static let placeholder = "Escribe tu reflexión..."
        static let submit = "Compostar y ganar 8 🌰"
        static let success = "¡Reflexión guardada! +8 🌰"
        static let alreadyDone = "Compostado"
        static let reflectionLabel = "Tu reflexión"

        /// "Escribe al menos N caracteres", siendo N los que faltan.
        static func minCharsRemaining(_ remaining: Int) -> String {
            "Escribe al menos \(remaining) caracteres"
        }
    }

    enum Insights {
        static let title = "Insights"
        static let subtitle = "Tu resumen emocional"
        static let checkinsLabel = "Check-ins"
        static let activeDaysLabel = "Días activos"
        static let streakLabel = "Racha"
        static let weeklyActivity = "Actividad semanal"
        static let topEmotions = "Emociones más frecuentes"
        static let avgIntensity = "Intensidad media"
        static let avgSleep = "Calidad de sueño"
        static let correlations = "Correlaciones"
        static let sleepCorrelation = "Sueño y emociones"
        static let whenSleepBad = "Cuando duermes mal"
        static let whenSleepGood = "Cuando duermes bien"
        static let hungerCorrelation = "Hambre y emociones"
        static let whenHungry = "Con hambre alta"
        static let whenFed = "Sin hambre"
        static let cyclePatterns = "Ciclo y emociones"
        static let dayOfWeek = "Patrones por día"
        static let bestDay = "Mejor día"
        static let hardestDay = "Día más difícil"
        static let weeklyTrend = "Tendencia semanal"
        static let moreOf = "Más"
        static let lessOf = "Menos"
        static let vsLastWeek = "vs semana anterior"
        static let needMoreData = "Necesitas al menos 7 registros para ver correlaciones"
        static let emptyMessage = "Haz algunos check-ins para ver tus estadísticas"
        static let tipDefault = "Sigue registrando para descubrir patrones en tu bienestar."

        // Gating Premium
        static let premiumLockTitle = "Promedios e insights"
        static let premiumLockText = "Desbloquea intensidad media, calidad de sueño y consejos personalizados con Premium."
        static let premiumLockBadge = "Ver Premium"

        /// Consejo cuando hay una emoción dominante y el sueño es bajo.
        static func tipLowSleep(_ emotionLabel: String) -> String {
            "Tu emoción más frecuente es \(emotionLabel) y tu sueño es bajo. Intenta mejorar tu descanso."
        }

        /// Consejo cuando hay una emoción dominante.
        static func tipFrequentEmotion(_ emotionLabel: String) -> String {
            "Tu emoción más frecuente es \(emotionLabel). ¡Sigue registrando para descubrir más patrones!"
        }
    }

    enum EmotionalRegister {
        // Pestaña / listado
        static let listTitle = "Registros emocionales"
        static let listSubtitle = "Observa y describe lo que sientes"
        static let recentTitle = "Registros recientes"
        static let sectionEmotional = "Registros emocionales"
        static let newRegister = "Nuevo registro"
        static let newRegisterSubtitle = "Describe una emoción en detalle"
        static let empty = "Aún no has descrito ninguna emoción.\nObservar y describir lo que sientes ayuda a entenderlo."

        // Formulario
        static let formTitle = "Observar y describir"
        static let formSubtitle = "Observa lo que sientes sin juzgar"
        static let editTitle = "Editar registro"
        static let emotion = "Nombre de la emoción"
        static let emotionCustomPlaceholder = "O escribe el nombre de la emoción..."
        static let intensity = "Intensidad (1-10)"
        static let vulnerability = "Vulnerabilidad"
        static let vulnerabilityPlaceholder = "¿Qué factores te hacían vulnerable?"
        static let trigger = "Detonante"
        static let triggerPlaceholder = "¿Qué desencadenó la emoción?"
        static let interpretations = "Interpretaciones"
        static let interpretationsPlaceholder = "¿Qué pensamientos o interpretaciones tuviste?"
        static let internalSensations = "Sensaciones internas"
        static let internalSensationsPlaceholder = "¿Qué sentiste en tu cuerpo?"
        static let externalLanguage = "Lenguaje externo"
        static let externalLanguagePlaceholder = "¿Qué expresaste con tu cara, postura o voz?"
        static let impulses = "Impulsos"
        static let impulsesPlaceholder = "¿Qué tuviste ganas de hacer?"
        static let behavior = "Conducta"
        static let behaviorPlaceholder = "¿Qué hiciste realmente?"
        static let consequences = "Consecuencias"
        static let consequencesPlaceholder = "¿Qué consecuencias tuvo tu conducta?"
        static let emotionFunction = "Función de la emoción"
        static let emotionFunctionPlaceholder = "¿Para qué sirvió esta emoción?"
        static let save = "Guardar registro"
        static let saveChanges = "Guardar cambios"
        static let selectEmotion = "Selecciona o escribe una emoción"
        static let saveError = "No se pudo guardar el registro"

        // Detalle
        static let detailTitle = "Detalle"
        static let intensityShort = "Intensidad"
        static let deleteTitle = "Eliminar registro"
        static let deleteMessage = "¿Seguro que quieres eliminar este registro?"
        static let notFound = "Registro no encontrado"
        static let typeLabel = "Observar y describir"

        /// Intensidad mostrada como "7/10".
        static func intensityValue(_ value: Int) -> String { "\(value)/10" }
    }

    enum Gratitude {
        // CTA del home
        static let ctaTitle = "Diario de gratitud"
        static let ctaSubtitle = "Tres cosas buenas de hoy"
        static let ctaDone = "Gratitud de hoy"
        static let ctaDoneSubtitle = "Toca para ver o editar"

        // Editor
        static let title = "Diario de gratitud"
        static let editTitle = "Editar gratitud"
        static let subtitle = "Tres cosas buenas de hoy"
        static let prompt = "Escribe tres cosas por las que sientas gratitud hoy"
        static let emptyError = "Escribe al menos una cosa por la que sientas gratitud"
        static let saveError = "No se pudo guardar la gratitud"

        /// Placeholder del motivo de gratitud número `index + 1`.
        static func placeholder(_ index: Int) -> String {
            "\(index + 1). Agradezco..."
        }
    }

    enum Agenda {
        static let title = "Mi diario"
        static let subtitle = "Tu historia emocional"
        static let searchPlaceholder = "Buscar en tu diario..."
        static let empty = "Tu diario está vacío.\nComienza a registrar tu bienestar."
        static let noResults = "No se encontraron registros"
        static let noResultsHint = "Prueba con otros filtros o términos de búsqueda"
        static let gratitudeLabel = "Gratitud"

        // Segmentos
        static let segmentAll = "Todos"
        static let segmentCheckin = "Check-ins"
        static let segmentRegister = "Registros"
        static let segmentGratitude = "Gratitud"

        // Filtros
        static let emotionsLabel = "Filtrar por emociones"
        static let dateFrom = "Desde"
        static let dateTo = "Hasta"
        static let datePlaceholder = "Cualquiera"
        static let removeDate = "Quitar fecha"
        static let clearFilters = "Limpiar filtros"

        // Etiquetas de fecha de las secciones
        static let today = "Hoy"
        static let yesterday = "Ayer"

        /// "1 entrada" / "N entradas".
        static func entryCount(_ count: Int) -> String {
            "\(count) \(count == 1 ? "entrada" : "entradas")"
        }
    }

    enum Skills {
        // Pestaña / listado
        static let title = "Habilidades"
        static let subtitle = "Técnicas y ejercicios basados en DBT"
        static let filterByEmotion = "Filtrar por emoción"
        static let suggestedForYou = "Sugerido para ti"

        // Categoría
        static let allTypes = "Todas"
        static let exercises = "Ejercicios"
        static let articles = "Artículos"

        // Detalle de habilidad
        static let exercise = "Ejercicio"
        static let article = "Artículo"
        static let steps = "Pasos"
        static let tips = "Consejos"
        static let startExercise = "Comenzar ejercicio"
        static let practiceArticle = "He practicado esto"

        // Ejercicio en curso
        static let nextStep = "Siguiente"
        static let finish = "Finalizar"
        static let congratulations = "¡Bien hecho!"
        static let keepPracticing = "Cada vez que practiques, será más fácil"
        static let practiceAgain = "Practicar de nuevo"
        static let backToSkills = "Volver a habilidades"

        // Historial de práctica
        static let practiceHistory = "Historial"
        static let totalPractices = "Prácticas totales"
        static let uniqueSkills = "Habilidades diferentes"
        static let totalTime = "Tiempo total"
        static let minutes = "min"
        static let noPractices = "Aún no has practicado ninguna habilidad"
        static let noSkills = "Próximamente habrá habilidades disponibles"

        /// "Paso 2 de 6".
        static func stepOf(_ current: Int, _ total: Int) -> String {
            "Paso \(current) de \(total)"
        }

        /// "1 paso" / "N pasos" — subtítulo de la previsualización del ejercicio.
        static func stepCount(_ count: Int) -> String {
            "\(count) \(count == 1 ? "paso" : "pasos")"
        }
    }

    enum Breathing {
        static let inhale = "Inhala"
        static let hold = "Retén"
        static let exhale = "Exhala"
        static let breathe = "Respira"
    }

    enum Achievements {
        static let title = "Logros"
        static let subtitle = "Tu progreso en Bloom"
        static let sectionApp = "Logros de bienestar"
        static let sectionGarden = "Logros del jardín"

        // Check-ins
        static let firstCheckin = "Primer paso"
        static let firstCheckinDesc = "Haz tu primer registro"
        static let fiveCheckins = "Constancia"
        static let fiveCheckinsDesc = "Completa 5 registros"
        static let twentyFiveCheckins = "Hábito formado"
        static let twentyFiveCheckinsDesc = "Completa 25 registros"
        static let fiftyCheckins = "Medio centenar"
        static let fiftyCheckinsDesc = "Completa 50 registros"
        static let hundredCheckins = "Cien registros"
        static let hundredCheckinsGendered = GenderedText(f: "Centenaria", m: "Centenario", n: "Cien registros")
        static let hundredCheckinsDesc = "Completa 100 registros"

        // Rachas
        static let streak3 = "Tres al hilo"
        static let streak3Desc = "3 días consecutivos"
        static let streak7 = "Una semana"
        static let streak7Desc = "7 días consecutivos"
        static let streak14 = "Dos semanas"
        static let streak14Desc = "14 días consecutivos"
        static let streak30 = "Un mes"
        static let streak30Desc = "30 días consecutivos"
        static let streak60 = "Dos meses"
        static let streak60Desc = "60 días consecutivos"

        // Gratitud
        static let firstGratitude = "Gratitud"
        static let firstGratitudeGendered = GenderedText(f: "Agradecida", m: "Agradecido", n: "Gratitud")
        static let firstGratitudeDesc = "Escribe tu primera gratitud"
        static let sevenGratitudes = "Semana de gratitud"
        static let sevenGratitudesDesc = "Escribe 7 entradas de gratitud"

        // Emociones
        static let allEmotions = "Arcoíris emocional"
        static let allEmotionsDesc = "Usa las 12 emociones"

        // Compostaje
        static let firstCompost = "Primera reflexión"
        static let firstCompostDesc = "Composta tu primer registro"
        static let fiveComposts = "Transformación"
        static let fiveCompostsGendered = GenderedText(f: "Transformadora", m: "Transformador", n: "Transformación")
        static let fiveCompostsDesc = "Composta 5 registros"

        // Habilidades
        static let firstPractice = "Primera práctica"
        static let firstPracticeDesc = "Completa tu primer ejercicio"
        static let fivePractices = "Practicante"
        static let fivePracticesDesc = "Completa 5 ejercicios"
        static let fifteenPractices = "Gran habilidad"
        static let fifteenPracticesGendered = GenderedText(f: "Habilidosa", m: "Habilidoso", n: "Gran habilidad")
        static let fifteenPracticesDesc = "Completa 15 ejercicios"
        static let allCategories = "Exploración total"
        static let allCategoriesGendered = GenderedText(f: "Exploradora", m: "Explorador", n: "Exploración total")
        static let allCategoriesDesc = "Practica en las 5 categorías"

        /// "3 / 31" — logros desbloqueados sobre el total.
        static func summaryCount(unlocked: Int, total: Int) -> String {
            "\(unlocked) / \(total)"
        }
    }

    enum SafetyPlan {
        // Cabecera
        static let title = "Plan de seguridad"
        static let subtitle = "Tu red de apoyo personal"

        // Secciones
        static let warningSigns = "Señales de alerta"
        static let warningSignsDesc = "Pensamientos, emociones o situaciones que indican que necesitas apoyo"
        static let warningSignPlaceholder = "Ej: No puedo dejar de llorar..."

        static let copingStrategies = "Estrategias de afrontamiento"
        static let copingStrategiesDesc = "Cosas que puedes hacer por ti misma para sentirte mejor"
        static let copingStrategyPlaceholder = "Ej: Salir a caminar..."

        static let trustedContacts = "Contactos de confianza"
        static let trustedContactsDesc = "Personas a las que puedes llamar cuando necesites apoyo"
        static let contactNamePlaceholder = "Nombre"
        static let contactPhonePlaceholder = "Teléfono"

        static let personalSteps = "Mis pasos personales"
        static let personalStepsDesc = "Acciones concretas que puedes seguir en un momento difícil"
        static let personalStepPlaceholder = "Ej: Respirar 5 veces profundamente..."

        static let crisisHotlines = "Líneas de crisis"
        static let crisisHotlinesDesc = "Servicios profesionales disponibles 24/7"

        // Llamadas
        static let call = "Llamar"
        static let callConfirmTitle = "Llamar"

        static let disclaimer = "Este plan es una herramienta personal de apoyo. En caso de emergencia, llama al servicio de emergencias de tu país o acude al centro de salud más cercano."

        /// "¿Quieres llamar a {name}?"
        static func callConfirmMessage(_ name: String) -> String {
            "¿Quieres llamar a \(name)?"
        }
    }

    enum Onboarding {
        static let skip = "Omitir"
        static let next = "Siguiente"
        static let start = "Comenzar"

        static let slide1Title = "Bienvenida a Bloom"
        static let slide1Subtitle = "Tu jardín personal de bienestar emocional. Un espacio seguro para cultivar tu mundo interior."

        static let slide2Title = "Registra cómo te sientes"
        static let slide2Subtitle = "Haz check-ins diarios de tus emociones, sueño y energía. Observa tus patrones y crece con cada registro."

        static let slide3Title = "Observa tu crecimiento"
        static let slide3Subtitle = "Visualiza tu calendario emocional, descubre insights y aprende habilidades para tu bienestar."
    }

    enum Profile {
        static let tabTitle = "Tú"

        static let checkinsStat = "Check-ins"
        static let activeDaysStat = "Días activos"
        static let streakStat = "Racha"

        static let insightsDesc = "Tu resumen emocional"
        static let achievementsDesc = "Tu progreso y medallas"
        static let safetyPlanDesc = "Tu red de apoyo personal"

        static let settingsSection = "Ajustes"
        static let reminderTitle = "Recordatorio diario"
        static let reminderDisabled = "Desactivado"
        static let reminderPermissionTitle = "Notificaciones no permitidas"
        static let reminderPermissionMessage = "Para recibir el recordatorio diario, activa las notificaciones de Bloom en los Ajustes del sistema."

        // Exportar datos
        static let exportTitle = "Exportar datos"
        static let exportDesc = "Descarga un PDF con tu diario y tus estadísticas"
        static let exporting = "Generando PDF…"
        static let exportEmpty = "No hay check-ins para exportar"
        static let exportError = "No se pudo exportar el PDF"
        static let exportPremiumTitle = "Premium"
        static let exportPremiumMessage = "La exportación de datos es una función Premium. Canjea un código de regalo o suscríbete para activarla."
        static let exportPremiumGoToPremium = "Ver Premium"

        /// "Cada día a las 20:00"
        static func reminderTime(hour: Int, minute: Int) -> String {
            String(format: "Cada día a las %d:%02d", hour, minute)
        }

        static let accountSection = "Cuenta"
        static let aboutSection = "Acerca de"
        static let version = "Versión"
        static let versionNumber = "1.0.0"

        static let logout = "Cerrar sesión"
        static let loggingOut = "Cerrando sesión..."
        static let logoutConfirmMessage = GenderedText(
            f: "¿Estás segura de que quieres cerrar sesión?",
            m: "¿Estás seguro de que quieres cerrar sesión?",
            n: "¿Seguro/a de que quieres cerrar sesión?"
        )

        static let genderSection = "Forma de tratamiento"
        static let genderSheetTitle = "Elige cómo te tratamos"
        static let genderDesc = "Personaliza los mensajes con tu forma preferida"

        static let disclaimer = "Bloom es una herramienta de bienestar emocional y no pretende diagnosticar, tratar, curar ni prevenir ninguna enfermedad o trastorno mental. No sustituye el consejo, diagnóstico o tratamiento médico profesional. Si necesitas ayuda profesional, consulta a un especialista."
    }

    enum DeleteAccount {
        static let title = "Eliminar cuenta"
        static let warning = "Esta acción es permanente e irreversible. Se eliminarán todos tus datos."
        static let whatDeleted = "Se eliminará:"
        static let itemCheckins = "Todos tus check-ins y registros emocionales"
        static let itemGratitude = "Tu diario de gratitud"
        static let itemSkills = "Tu historial de habilidades"
        static let itemSafetyPlan = "Tu plan de seguridad"
        static let itemAccount = "Tu cuenta y perfil"

        static let reAuthTitle = "Verificar identidad"
        static let reAuthPassword = "Introduce tu contraseña para continuar"
        static let reAuthApple = "Verificar con Apple"
        static let reAuthGoogle = "Verificar con Google"
        static let verify = "Verificar"
        static let verified = "Identidad verificada"

        static let confirmButton = "Eliminar cuenta permanentemente"
        static let deleting = "Eliminando datos..."
        static let confirmTitle = "¿Eliminar cuenta?"
        static let confirmMessage = GenderedText(
            f: "¿Estás completamente segura? No hay vuelta atrás.",
            m: "¿Estás completamente seguro? No hay vuelta atrás.",
            n: "¿Completamente seguro/a? No hay vuelta atrás."
        )

        static let errorReAuth = "No se pudo verificar tu identidad"
        static let errorDelete = "Error al eliminar la cuenta. Inténtalo de nuevo."
        static let passwordPlaceholder = "Tu contraseña"
    }

    enum Premium {
        static let title = "Bloom Premium"
        static let heroEmoji = "✨"
        static let heroDesc = "Desbloquea todo el potencial de tu bienestar emocional"

        // Estado activo
        static let activeTitle = "Ya eres Premium"
        static let activeEmoji = "👑"
        static let activeDesc = "Tienes acceso a todas las funciones."
        static let managedByStore = "Tu suscripción se gestiona desde la App Store."

        // Planes
        static let monthlyLabel = "Mensual"
        static let annualLabel = "Anual"
        static let annualSave = "Ahorra 50%"
        static let popular = "Popular"
        static let perYear = "/año"
        static let perMonth = "/mes"
        static let noProductsAvailable = "Suscripciones no disponibles ahora mismo. Inténtalo más tarde."

        // Acciones de compra
        static let freeTrial = "Empieza con prueba gratis"
        static let subscribe = "Suscribirse"
        static let subscribing = "Procesando..."
        static let finePrint = "Renovación automática. Puedes cancelar en cualquier momento desde los Ajustes de tu Apple ID."

        static let restore = "Restaurar compra"
        static let restoring = "Restaurando..."
        static let restoreSuccess = "Compras restauradas"
        static let errorRestore = "No se pudo restaurar la compra"

        static let successTitle = "¡Bienvenido a Premium! ✨"
        static let successMessage = "Tu suscripción está activa."
        static let errorTitle = "Algo ha ido mal"
        static let errorPurchase = "No se pudo completar la compra"
        static let pendingPurchase = "Compra pendiente de confirmación"

        // Código de regalo
        static let giftLabel = "¿Tienes un código de regalo?"
        static let giftCodePlaceholder = "AB12CD"
        static let redeem = "Canjear"
        static let redeeming = "Canjeando..."
        static let successRedeemed = "¡Código canjeado!"
        static let successRedeemedMessage = "Ya tienes acceso a todas las funciones Premium."
        static let errorInvalidCode = "Código no válido"
        static let errorExpiredCode = "Este código ha caducado"
        static let errorAlreadyRedeemed = "Este código ya fue canjeado"

        // Features
        static let featureExport = "Exportar datos"
        static let featureExportDesc = "Descarga tus registros en PDF"
        static let featureShare = "Compartir"
        static let featureShareDesc = "Comparte tu bienestar con alguien de confianza"
        static let featureGarden = "Tienda del jardín"
        static let featureGardenDesc = "Compra mascotas, decoraciones y más"
        static let featureInsights = "Insights avanzados"
        static let featureInsightsDesc = "Promedios, calidad de sueño y consejos"

        // Entrada en perfil
        static let entryLabel = "Premium"
        static let entryDesc = "Desbloquea funciones avanzadas"
        static let activeBadge = "Premium"
    }

    enum Sharing {
        static let title = "Compartir"
        static let subtitle = "Comparte tu jardín emocional"
        static let entryLabel = "Compartir"
        static let entryDesc = "Invita a alguien a ver tu jardín"

        // Generar código
        static let generateSection = "🔗 Invitar a alguien"
        static let generateCode = "Generar código"
        static let codeExpiry = "Expira en 24 horas"
        static let codeExpired = "Código caducado"
        static let codeCopied = "Código copiado"

        // Canjear código
        static let enterSection = "🔑 Introducir código"
        static let enterCodePlaceholder = "AB12CD"
        static let enterCodeHint = "Pide el código a la persona que quiere compartir contigo"
        static let link = "Vincular"
        static let linking = "Vinculando..."

        // Mi viewer
        static let viewerSection = "👁️ Quién ve mi jardín"
        static let noViewer = "No has compartido con nadie"
        static let sharedWithSection = "🌿 Jardín compartido conmigo"
        static let noShared = "Nadie ha compartido contigo"
        static let revokeAccess = "Revocar acceso"
        static let revokeConfirmTitle = "Revocar acceso"
        static let revokeConfirmMessage = GenderedText(
            f: "¿Estás segura de que quieres quitar el acceso a esta persona?",
            m: "¿Estás seguro de que quieres quitar el acceso a esta persona?",
            n: "¿Seguro/a de que quieres quitar el acceso a esta persona?"
        )

        // Pestaña Compartido
        static let tabTitle = "Compartido"
        static let readOnly = "Solo lectura"
        static let viewingGarden = "Jardín de"
        static let todaySection = "Hoy"
        static let calendarSection = "Calendario"
        static let summarySection = "Resumen"
        static let emptyToday = "Sin registros hoy"
        static let totalCheckins = "Registros totales"
        static let uniqueDays = "Días activos"
        static let topEmotion = "Emoción principal"
        static let frequentEmotions = "Emociones frecuentes"
        static let noLink = "No tienes ningún jardín vinculado"
        static let noLinkHint = "Ve a tu perfil para vincular un código de invitación"

        // Errores
        static let errorInvalidCode = "El código no es válido"
        static let errorExpiredCode = "El código ha expirado"
        static let errorSelfLink = "No puedes vincularte contigo mismo"
        static let errorAlreadyLinked = GenderedText(
            f: "Ya estás vinculada con esta persona",
            m: "Ya estás vinculado con esta persona",
            n: "Ya tienes un vínculo con esta persona"
        )
        static let errorLinkRevoked = "El acceso fue revocado por el propietario"
        static let errorGeneric = "No se pudo completar la acción"
        static let successLinked = "Vinculación exitosa"

        // Gating Premium
        static let premiumAlertTitle = "Premium"
        static let premiumAlertMessage = "Compartir tu jardín es una función Premium. Canjea un código de regalo para activarla."
    }

    enum Shop {
        static let title = "Tienda"
        /// Emoji que acompaña al saldo de semillas en toda la UI del jardín.
        static let seedUnit = "🌱"
        static let confirmTitle = "Comprar"
        static let buyButton = "Comprar"
        static let insufficientTitle = "Semillas insuficientes"
        static let insufficientMessage = "Necesitas más semillas. Haz registros y riega tus plantas para ganar más."
        static let purchased = "Comprado"
        static let emptyCategory = "Nada por aquí todavía"

        // Gating Premium
        static let premiumBanner = "✨ Necesitas Premium para comprar"
        static let premiumAlertTitle = "Premium"
        static let premiumAlertMessage = "La tienda del jardín es una función Premium. Canjea un código de regalo o suscríbete para desbloquearla."
        static let premiumAlertGoToPremium = "Ver Premium"
    }
}

private extension Array {
    /// Acceso seguro por índice — devuelve `nil` si está fuera de rango.
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
