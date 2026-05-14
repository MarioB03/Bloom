import Foundation

/// Saldo de semillas 🌱 del jardín — la moneda del juego.
/// Portado de `SeedBalance` en `gardenEconomy.ts`. Se persiste localmente.
struct SeedBalance: Codable, Sendable {
    /// Saldo disponible actual.
    var total = 0
    /// Total ganado a lo largo del tiempo.
    var earned = 0
    /// Total gastado a lo largo del tiempo.
    var spent = 0
    /// Fecha (`"YYYY-MM-DD"`) en que se cobró la recompensa diaria por última vez.
    var lastDailyReward = ""
    /// Umbrales de racha cuyo bono ya se cobró.
    var earnedStreakBonuses: [Int] = []
}

/// Categoría de un artículo de la tienda.
enum ShopCategory: String, Codable, Sendable, CaseIterable {
    case decorations
    case pets
    case cosmetics
    case terrain

    var label: String {
        switch self {
        case .decorations: "Decoraciones"
        case .pets: "Mascotas"
        case .cosmetics: "Cosméticos"
        case .terrain: "Terreno"
        }
    }
}

/// Un artículo comprable en la tienda del jardín.
struct ShopItem: Sendable, Identifiable {
    let id: String
    let name: String
    let emoji: String
    let category: ShopCategory
    /// Coste en semillas.
    let cost: Int
    let description: String
}

/// Resultado de cobrar la recompensa diaria por check-in.
struct DailyRewardResult: Sendable {
    /// Semillas totales otorgadas (base + bono de racha).
    let seeds: Int
    /// Texto del bono de racha, si lo hubo.
    let bonusReason: String?
    /// Semillas extra por bono de racha (0 si no hubo).
    let streakBonus: Int
}

/// Tarifas, catálogo y reglas de la economía del jardín.
/// Portado de `gardenEconomy.ts` (la parte de cálculo; la persistencia vive en
/// `GardenPersistence`).
enum GardenEconomy {

    // MARK: - Tarifas de ganancia

    static let dailyCheckin = 5
    static let waterPlant = 1
    static let waterAllBonus = 5
    static let achievementUnlocked = 15
    static let plantStage5 = 3
    static let compostReflection = 8

    /// Umbrales de racha y semillas que otorgan, en orden ascendente.
    static let streakBonusThresholds: [(streak: Int, seeds: Int)] = [
        (3, 10), (7, 25), (14, 50), (30, 100),
    ]

    // MARK: - Catálogo de la tienda

    /// Id del artículo de expansión de terreno. Comprarlo añade un nivel de
    /// rejilla permanente por encima del que otorga la racha.
    static let terrainExpansionID = "expand_level"

    static let catalog: [ShopItem] = [
        // Decoraciones premium
        .init(id: "arch",          name: "Arco de flores",   emoji: "🌸", category: .decorations, cost: 30, description: "Un arco cubierto de flores"),
        .init(id: "statue",        name: "Estatua",          emoji: "🗿", category: .decorations, cost: 50, description: "Una elegante estatua de piedra"),
        .init(id: "swing",         name: "Columpio",         emoji: "🎪", category: .decorations, cost: 40, description: "Un columpio de madera"),
        .init(id: "magic_lantern", name: "Farol mágico",     emoji: "✨", category: .decorations, cost: 35, description: "Un farol con luz encantada"),
        .init(id: "windmill",      name: "Molino",           emoji: "🏗️", category: .decorations, cost: 60, description: "Un molino con aspas que giran"),
        .init(id: "wishing_well",  name: "Pozo de deseos",   emoji: "🪨", category: .decorations, cost: 75, description: "Pide un deseo y lanza una moneda"),
        // Mascotas
        .init(id: "bunny",            name: "Conejo",          emoji: "🐰", category: .pets, cost: 30, description: "Un conejo que salta por el jardín"),
        .init(id: "bird",             name: "Pájaro",          emoji: "🐦", category: .pets, cost: 25, description: "Un pájaro que vuela entre las flores"),
        .init(id: "golden_butterfly", name: "Mariposa dorada", emoji: "🦋", category: .pets, cost: 50, description: "Una brillante mariposa dorada"),
        .init(id: "hedgehog",         name: "Erizo",           emoji: "🦔", category: .pets, cost: 40, description: "Un simpático erizo curioso"),
        // Cosméticos
        .init(id: "sunset_sky",       name: "Cielo atardecer",     emoji: "🌅", category: .cosmetics, cost: 20, description: "El cielo siempre luce un cálido atardecer"),
        .init(id: "flower_fence",     name: "Valla de flores",     emoji: "🌺", category: .cosmetics, cost: 25, description: "La valla se cubre de flores coloridas"),
        .init(id: "stone_path",       name: "Camino de piedra",    emoji: "🪨", category: .cosmetics, cost: 15, description: "Un bonito camino de piedra cruza el jardín"),
        .init(id: "fireflies_always", name: "Luciérnagas siempre", emoji: "💫", category: .cosmetics, cost: 30, description: "Luciérnagas visibles a cualquier hora"),
        // Expansión de terreno
        .init(id: "expand_level",     name: "Expandir terreno",    emoji: "🗺️", category: .terrain, cost: 40, description: "Desbloquea el siguiente nivel de terreno"),
    ]

    /// Artículo de la tienda por su id.
    static func item(id: String) -> ShopItem? {
        catalog.first { $0.id == id }
    }

    /// Artículos de una categoría.
    static func items(category: ShopCategory) -> [ShopItem] {
        catalog.filter { $0.category == category }
    }

    // MARK: - Cálculo de recompensas (puro)

    /// Aplica la recompensa diaria por check-in sobre un saldo. Devuelve el
    /// saldo actualizado y el detalle de la recompensa, o `nil` si ya se cobró
    /// hoy. No persiste nada — eso lo hace `GardenStore`.
    static func applyDailyReward(
        to balance: SeedBalance,
        streak: Int,
        today: String
    ) -> (balance: SeedBalance, result: DailyRewardResult)? {
        guard balance.lastDailyReward != today else { return nil }

        var updated = balance
        var streakBonus = 0
        var bonusReason: String?

        for threshold in streakBonusThresholds
        where streak >= threshold.streak && !updated.earnedStreakBonuses.contains(threshold.streak) {
            streakBonus += threshold.seeds
            updated.earnedStreakBonuses.append(threshold.streak)
            bonusReason = "Racha de \(threshold.streak) días"
        }

        let totalSeeds = dailyCheckin + streakBonus
        updated.total += totalSeeds
        updated.earned += totalSeeds
        updated.lastDailyReward = today

        return (updated, DailyRewardResult(seeds: totalSeeds, bonusReason: bonusReason, streakBonus: streakBonus))
    }

    /// Suma semillas a un saldo (ganancia genérica).
    static func adding(_ amount: Int, to balance: SeedBalance) -> SeedBalance {
        var updated = balance
        updated.total += amount
        updated.earned += amount
        return updated
    }

    /// Resta semillas de un saldo si hay fondos suficientes; `nil` si no.
    static func spending(_ amount: Int, from balance: SeedBalance) -> SeedBalance? {
        guard balance.total >= amount else { return nil }
        var updated = balance
        updated.total -= amount
        updated.spent += amount
        return updated
    }
}
