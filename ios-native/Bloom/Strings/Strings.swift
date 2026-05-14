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
        static let reflectionLabel = "Tu reflexión"

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

        /// Consejo cuando hay una emoción dominante y el sueño es bajo.
        static func tipLowSleep(_ emotionLabel: String) -> String {
            "Tu emoción más frecuente es \(emotionLabel) y tu sueño es bajo. Intenta mejorar tu descanso."
        }

        /// Consejo cuando hay una emoción dominante.
        static func tipFrequentEmotion(_ emotionLabel: String) -> String {
            "Tu emoción más frecuente es \(emotionLabel). ¡Sigue registrando para descubrir más patrones!"
        }
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
    }
}

private extension Array {
    /// Acceso seguro por índice — devuelve `nil` si está fuera de rango.
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
