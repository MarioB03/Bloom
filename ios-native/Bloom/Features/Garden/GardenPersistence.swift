import Foundation

/// Persistencia local del jardín en `UserDefaults`. Equivalente nativo de las
/// claves `@bloom_*` que la app RN guarda en `AsyncStorage`
/// (`gardenState.ts`, `gardenEconomy.ts`, `gardenAchievements.ts`,
/// `gardenCosmetics.ts`).
///
/// Las plantas no se persisten: se regeneran de los check-ins de Firestore.
/// Solo se guardan las decoraciones, las baldosas de camino, el saldo de
/// semillas, las compras, los logros, los cosméticos y los hitos celebrados.
enum GardenPersistence {

    private enum Key {
        static let layout = "bloom.garden.layout"
        static let seedBalance = "bloom.garden.seedBalance"
        static let purchases = "bloom.garden.purchases"
        static let achievements = "bloom.garden.achievements"
        static let cosmetics = "bloom.garden.cosmetics"
        static let celebratedMilestones = "bloom.garden.celebratedMilestones"
    }

    /// Lo que se guarda del layout: solo decoraciones y baldosas de camino.
    private struct PersistedLayout: Codable {
        var decorations: [DecorationPlacement]
        var pathTiles: [GridPosition]
    }

    // MARK: - Layout (decoraciones + camino)

    static func loadLayout() -> (decorations: [DecorationPlacement], pathTiles: [GridPosition]) {
        guard
            let data = UserDefaults.standard.data(forKey: Key.layout),
            let stored = try? JSONDecoder().decode(PersistedLayout.self, from: data)
        else {
            return ([], [])
        }
        return (stored.decorations, stored.pathTiles)
    }

    static func saveLayout(decorations: [DecorationPlacement], pathTiles: [GridPosition]) {
        let payload = PersistedLayout(decorations: decorations, pathTiles: pathTiles)
        guard let data = try? JSONEncoder().encode(payload) else { return }
        UserDefaults.standard.set(data, forKey: Key.layout)
    }

    // MARK: - Saldo de semillas

    static func loadSeedBalance() -> SeedBalance {
        guard
            let data = UserDefaults.standard.data(forKey: Key.seedBalance),
            let balance = try? JSONDecoder().decode(SeedBalance.self, from: data)
        else {
            return SeedBalance()
        }
        return balance
    }

    static func saveSeedBalance(_ balance: SeedBalance) {
        guard let data = try? JSONEncoder().encode(balance) else { return }
        UserDefaults.standard.set(data, forKey: Key.seedBalance)
    }

    // MARK: - Compras

    static func loadPurchases() -> [String] {
        UserDefaults.standard.stringArray(forKey: Key.purchases) ?? []
    }

    static func savePurchases(_ ids: [String]) {
        UserDefaults.standard.set(ids, forKey: Key.purchases)
    }

    // MARK: - Logros desbloqueados

    static func loadUnlockedAchievements() -> [String] {
        UserDefaults.standard.stringArray(forKey: Key.achievements) ?? []
    }

    static func saveUnlockedAchievements(_ ids: [String]) {
        UserDefaults.standard.set(ids, forKey: Key.achievements)
    }

    // MARK: - Cosméticos activos

    static func loadActiveCosmetics() -> [String] {
        UserDefaults.standard.stringArray(forKey: Key.cosmetics) ?? []
    }

    static func saveActiveCosmetics(_ ids: [String]) {
        UserDefaults.standard.set(ids, forKey: Key.cosmetics)
    }

    // MARK: - Hitos celebrados

    static func loadCelebratedMilestones() -> [Int] {
        (UserDefaults.standard.array(forKey: Key.celebratedMilestones) as? [Int]) ?? []
    }

    static func saveCelebratedMilestones(_ milestones: [Int]) {
        UserDefaults.standard.set(milestones, forKey: Key.celebratedMilestones)
    }
}
