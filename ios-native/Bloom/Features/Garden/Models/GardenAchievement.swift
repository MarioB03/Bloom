import Foundation

/// Un logro del jardín. Son independientes de los logros de app
/// (`src/lib/achievements.ts`, aún sin portar). Portado de
/// `gardenAchievements.ts`.
struct GardenAchievement: Sendable, Identifiable {
    let id: String
    let title: String
    let description: String
    let emoji: String

    /// Los 12 logros del jardín.
    static let all: [GardenAchievement] = [
        .init(id: "first_plant",    title: "¡Primera flor!",      description: "Plantaste tu primera flor en el jardín",   emoji: "🌱"),
        .init(id: "garden_watered", title: "¡Jardín regado!",     description: "Regaste todas las plantas del jardín",     emoji: "💧"),
        .init(id: "five_plants",    title: "Mini jardín",         description: "Tienes 5 plantas en tu jardín",            emoji: "🌿"),
        .init(id: "ten_plants",     title: "Jardín floreciente",  description: "10 plantas crecen en tu jardín",           emoji: "🌻"),
        .init(id: "first_deco",     title: "Decorador/a",         description: "Colocaste tu primera decoración",          emoji: "🎨"),
        .init(id: "five_decos",     title: "Paisajista",          description: "5 decoraciones adornan tu jardín",         emoji: "🏡"),
        .init(id: "full_bloom",     title: "Floración completa",  description: "Una planta alcanzó crecimiento máximo",    emoji: "🌺"),
        .init(id: "streak_7",       title: "Una semana",          description: "7 días consecutivos de registro",          emoji: "🔥"),
        .init(id: "streak_14",      title: "Dos semanas",         description: "14 días de racha",                         emoji: "⭐"),
        .init(id: "streak_30",      title: "¡Un mes!",            description: "30 días de racha — jardín dorado",         emoji: "👑"),
        .init(id: "night_garden",   title: "Jardín nocturno",     description: "Visitaste tu jardín de noche",             emoji: "🌙"),
        .init(id: "all_emotions",   title: "Arcoíris emocional",  description: "Has plantado flores de todas las emociones", emoji: "🌈"),
    ]

    /// Logro por su id, o `nil` si no existe.
    static func byID(_ id: String) -> GardenAchievement? {
        all.first { $0.id == id }
    }

    /// Evalúa el estado del jardín y devuelve los ids de logros recién
    /// desbloqueados (los que se cumplen y no estaban ya en `unlockedIDs`).
    static func newlyUnlocked(
        plants: [PlantPlacement],
        decorations: [DecorationPlacement],
        streak: Int,
        unlockedIDs: Set<String>,
        now: Date = Date()
    ) -> [String] {
        var result: [String] = []
        func check(_ id: String, _ condition: Bool) {
            if condition && !unlockedIDs.contains(id) { result.append(id) }
        }

        check("first_plant", plants.count >= 1)
        check("five_plants", plants.count >= 5)
        check("ten_plants", plants.count >= 10)
        check("first_deco", decorations.count >= 1)
        check("five_decos", decorations.count >= 5)
        check("full_bloom", plants.contains { $0.growthStage >= 5 })
        check("garden_watered", !plants.isEmpty && plants.allSatisfy(\.wateredToday))
        check("streak_7", streak >= 7)
        check("streak_14", streak >= 14)
        check("streak_30", streak >= 30)

        let hour = Calendar.current.component(.hour, from: now)
        check("night_garden", hour < 6 || hour >= 20)

        check("all_emotions", Set(plants.map(\.emotion)).count >= 12)

        return result
    }
}
