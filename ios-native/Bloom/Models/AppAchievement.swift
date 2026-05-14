import Foundation

/// Categoría de un logro de app, según la métrica que lo desbloquea.
/// Portado de `AppAchievement['category']` en `src/lib/achievements.ts`.
enum AppAchievementCategory: String, Sendable {
    case checkins, streaks, gratitude, emotions, compost, skills
}

/// Un logro de app: mide el progreso global en Bloom (check-ins, rachas,
/// gratitud, emociones, compostaje y habilidades). Es independiente de los
/// logros del jardín (`GardenAchievement`), que premian el estado del jardín.
/// Catálogo estático en `AppAchievementCatalog`.
/// Portado de `AppAchievement` en `src/lib/achievements.ts`.
///
/// Divergencia de RN: algunos títulos tienen forma según género en la app RN
/// (`{ f, m, n }`); aquí se usa la forma neutra hasta que se porte el lenguaje
/// con género.
struct AppAchievement: Sendable, Identifiable {
    let id: String
    let title: String
    let description: String
    let emoji: String
    /// Valor de la métrica que lo desbloquea; alimenta la barra de progreso.
    let threshold: Int
    let category: AppAchievementCategory
}

/// Métricas agregadas del usuario que alimentan la comprobación de logros.
/// Portado de `AchievementData` en `src/lib/achievements.ts`.
struct AppAchievementData: Sendable {
    var totalCheckins: Int
    var streak: Int
    var gratitudeCount: Int
    var compostCount: Int
    var uniqueEmotions: Int
    var practiceCount: Int
    var uniqueCategories: Int
}
