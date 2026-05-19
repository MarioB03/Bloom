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
/// Los títulos con flexión por género se exponen también como `genderedTitle`
/// (`GenderedText`); para renderizar el título correcto usar
/// `resolvedTitle(using:)`, que delega en `GenderService`. Los logros sin
/// flexión dejan `genderedTitle` en `nil` y devuelven `title` tal cual.
struct AppAchievement: Sendable, Identifiable {
    let id: String
    let title: String
    let genderedTitle: GenderedText?
    let description: String
    let emoji: String
    /// Valor de la métrica que lo desbloquea; alimenta la barra de progreso.
    let threshold: Int
    let category: AppAchievementCategory

    init(
        id: String,
        title: String,
        genderedTitle: GenderedText? = nil,
        description: String,
        emoji: String,
        threshold: Int,
        category: AppAchievementCategory
    ) {
        self.id = id
        self.title = title
        self.genderedTitle = genderedTitle
        self.description = description
        self.emoji = emoji
        self.threshold = threshold
        self.category = category
    }

    /// Devuelve el título flexionado a la forma elegida por el usuario si el
    /// logro tiene `genderedTitle`; si no, el título plano. `GenderService` está
    /// aislado al main actor, por eso este helper también lo está.
    @MainActor
    func resolvedTitle(using gender: GenderService) -> String {
        guard let genderedTitle else { return title }
        return gender.resolve(genderedTitle)
    }
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
