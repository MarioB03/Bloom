import Foundation

/// Catálogo estático de los logros de app y la lógica para evaluarlos.
/// Portado de `APP_ACHIEVEMENTS` + `checkAppAchievementsSync` +
/// `getAchievementProgress` en `src/lib/achievements.ts`.
enum AppAchievementCatalog {

    /// Los 19 logros de app, en el orden canónico de la pantalla de logros.
    static let all: [AppAchievement] = [
        // Check-ins
        AppAchievement(id: "app_first_checkin", title: Strings.Achievements.firstCheckin, description: Strings.Achievements.firstCheckinDesc, emoji: "🌱", threshold: 1, category: .checkins),
        AppAchievement(id: "app_5_checkins", title: Strings.Achievements.fiveCheckins, description: Strings.Achievements.fiveCheckinsDesc, emoji: "📝", threshold: 5, category: .checkins),
        AppAchievement(id: "app_25_checkins", title: Strings.Achievements.twentyFiveCheckins, description: Strings.Achievements.twentyFiveCheckinsDesc, emoji: "💪", threshold: 25, category: .checkins),
        AppAchievement(id: "app_50_checkins", title: Strings.Achievements.fiftyCheckins, description: Strings.Achievements.fiftyCheckinsDesc, emoji: "🏅", threshold: 50, category: .checkins),
        AppAchievement(id: "app_100_checkins", title: Strings.Achievements.hundredCheckins, description: Strings.Achievements.hundredCheckinsDesc, emoji: "💯", threshold: 100, category: .checkins),
        // Rachas
        AppAchievement(id: "app_streak_3", title: Strings.Achievements.streak3, description: Strings.Achievements.streak3Desc, emoji: "🔥", threshold: 3, category: .streaks),
        AppAchievement(id: "app_streak_7", title: Strings.Achievements.streak7, description: Strings.Achievements.streak7Desc, emoji: "⭐", threshold: 7, category: .streaks),
        AppAchievement(id: "app_streak_14", title: Strings.Achievements.streak14, description: Strings.Achievements.streak14Desc, emoji: "✨", threshold: 14, category: .streaks),
        AppAchievement(id: "app_streak_30", title: Strings.Achievements.streak30, description: Strings.Achievements.streak30Desc, emoji: "👑", threshold: 30, category: .streaks),
        AppAchievement(id: "app_streak_60", title: Strings.Achievements.streak60, description: Strings.Achievements.streak60Desc, emoji: "💎", threshold: 60, category: .streaks),
        // Gratitud
        AppAchievement(id: "app_first_gratitude", title: Strings.Achievements.firstGratitude, description: Strings.Achievements.firstGratitudeDesc, emoji: "🙏", threshold: 1, category: .gratitude),
        AppAchievement(id: "app_7_gratitudes", title: Strings.Achievements.sevenGratitudes, description: Strings.Achievements.sevenGratitudesDesc, emoji: "🌟", threshold: 7, category: .gratitude),
        // Emociones
        AppAchievement(id: "app_all_emotions", title: Strings.Achievements.allEmotions, description: Strings.Achievements.allEmotionsDesc, emoji: "🌈", threshold: 12, category: .emotions),
        // Compostaje
        AppAchievement(id: "app_first_compost", title: Strings.Achievements.firstCompost, description: Strings.Achievements.firstCompostDesc, emoji: "🌿", threshold: 1, category: .compost),
        AppAchievement(id: "app_5_composts", title: Strings.Achievements.fiveComposts, description: Strings.Achievements.fiveCompostsDesc, emoji: "🦋", threshold: 5, category: .compost),
        // Habilidades
        AppAchievement(id: "app_first_practice", title: Strings.Achievements.firstPractice, description: Strings.Achievements.firstPracticeDesc, emoji: "🧘", threshold: 1, category: .skills),
        AppAchievement(id: "app_5_practices", title: Strings.Achievements.fivePractices, description: Strings.Achievements.fivePracticesDesc, emoji: "💪", threshold: 5, category: .skills),
        AppAchievement(id: "app_15_practices", title: Strings.Achievements.fifteenPractices, description: Strings.Achievements.fifteenPracticesDesc, emoji: "🏆", threshold: 15, category: .skills),
        AppAchievement(id: "app_all_categories", title: Strings.Achievements.allCategories, description: Strings.Achievements.allCategoriesDesc, emoji: "🗺️", threshold: 5, category: .skills),
    ]

    /// Logro por su id, o `nil` si no existe.
    static func byID(_ id: String) -> AppAchievement? {
        all.first { $0.id == id }
    }

    /// Valor actual (sin tope) de la métrica que mide un logro.
    static func metric(for achievement: AppAchievement, data: AppAchievementData) -> Int {
        switch achievement.category {
        case .checkins: data.totalCheckins
        case .streaks: data.streak
        case .gratitude: data.gratitudeCount
        case .emotions: data.uniqueEmotions
        case .compost: data.compostCount
        case .skills:
            // El único logro de habilidades por categorías mide categorías
            // distintas; el resto miden prácticas totales.
            achievement.id == "app_all_categories" ? data.uniqueCategories : data.practiceCount
        }
    }

    /// Progreso de un logro topado a su umbral (para la barra de progreso).
    static func progress(for achievement: AppAchievement, data: AppAchievementData) -> Int {
        min(metric(for: achievement, data: data), achievement.threshold)
    }

    /// Ids de logros que se cumplen con `data` y no estaban en `unlockedIDs`.
    static func newlyUnlocked(data: AppAchievementData, unlockedIDs: Set<String>) -> [String] {
        all
            .filter { !unlockedIDs.contains($0.id) && metric(for: $0, data: data) >= $0.threshold }
            .map(\.id)
    }
}
