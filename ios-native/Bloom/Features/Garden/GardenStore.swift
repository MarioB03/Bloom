import SwiftUI

/// Estado y lógica del jardín de bienestar. Equivalente nativo del hook
/// `useGardenState` (`gardenState.ts`) más la orquestación de `app/jardin.tsx`:
/// carga de check-ins, colocación de plantas, economía de semillas, compras y
/// logros.
///
/// Las plantas se regeneran en cada carga a partir de los check-ins de
/// Firestore; las decoraciones, el saldo, las compras, los logros y los
/// cosméticos se persisten en `UserDefaults` vía `GardenPersistence`.
@Observable
@MainActor
final class GardenStore {

    /// Duración de la animación de riego sobre una celda. `nonisolated` para
    /// que el renderer (fuera de `MainActor`) pueda leerla.
    nonisolated static let waterEffectDuration: TimeInterval = 3.5

    // MARK: - Estado del jardín

    private(set) var layout = GardenLayout()
    var mode: InteractionMode = .view
    var selectedPlant: PlantPlacement?
    private(set) var loading = true
    private(set) var waterEffects: [WaterEffect] = []

    // MARK: - Progreso y economía

    private(set) var streak = 0
    private(set) var seedBalance = SeedBalance()
    private(set) var purchasedIDs: Set<String> = []
    private(set) var unlockedAchievementIDs: Set<String> = []
    private(set) var activeCosmeticIDs: [String] = []
    private(set) var celebratedMilestones: Set<Int> = []

    /// Logros recién desbloqueados pendientes de mostrar como toast.
    private(set) var pendingAchievements: [GardenAchievement] = []
    /// Recompensa diaria recién cobrada, pendiente de mostrar.
    private(set) var pendingDailyReward: DailyRewardResult?

    private var hasLoadedPersisted = false

    // MARK: - Derivados

    /// Lado de la rejilla activa según la racha.
    var gridSize: Int { GardenGrid.activeSize(streak: streak) }

    /// Nivel actual del jardín.
    var level: GardenLevel { GardenLevel.current(streak: streak) }

    /// Estación actual.
    var season: Season { Season.current() }

    /// Overrides visuales activos según los cosméticos comprados.
    var cosmetics: CosmeticOverrides { CosmeticOverrides.resolve(activeIDs: activeCosmeticIDs) }

    // MARK: - Carga

    /// Carga el estado persistido (una sola vez) y refresca las plantas desde
    /// los check-ins de los últimos 36 días. Cobra la recompensa diaria y
    /// comprueba logros.
    func load(firestore: FirestoreService, userID: String) async {
        if !hasLoadedPersisted {
            loadPersisted()
            hasLoadedPersisted = true
        }

        let now = Date()
        let start = Calendar.current.date(byAdding: .day, value: -36, to: now) ?? now
        do {
            let checkins = try await firestore.checkins(
                byDateRange: BloomDate.dateKey(start),
                to: BloomDate.dateKey(now),
                userID: userID
            )
            apply(checkins: checkins)
        } catch {
            // Se conserva el último estado conocido ante un fallo de red.
        }
        loading = false
    }

    private func loadPersisted() {
        let stored = GardenPersistence.loadLayout()
        layout.decorations = stored.decorations
        layout.pathTiles = stored.pathTiles
        seedBalance = GardenPersistence.loadSeedBalance()
        purchasedIDs = Set(GardenPersistence.loadPurchases())
        unlockedAchievementIDs = Set(GardenPersistence.loadUnlockedAchievements())
        activeCosmeticIDs = GardenPersistence.loadActiveCosmetics()
        celebratedMilestones = Set(GardenPersistence.loadCelebratedMilestones())
    }

    /// Recalcula la racha y las plantas a partir de los check-ins, conservando
    /// el estado de riego de la sesión, y aplica recompensa diaria y logros.
    private func apply(checkins: [CheckinEntry]) {
        streak = Streak.current(from: checkins.map(\.date))

        let placed = Self.autoPlacePlants(checkins: checkins, streak: streak)
        let wateredKeys = Set(layout.plants.filter(\.wateredToday).map { GridPosition(gx: $0.gx, gy: $0.gy) })
        layout.plants = placed.map { plant in
            guard wateredKeys.contains(GridPosition(gx: plant.gx, gy: plant.gy)) else { return plant }
            var watered = plant
            watered.wateredToday = true
            watered.growthStage = min(5, plant.growthStage + 1)
            return watered
        }

        awardDailyReward()
        checkAchievements()
    }

    // MARK: - Interacción

    /// Procesa un toque sobre una celda según el modo activo: en `view` abre el
    /// detalle de la planta, en `water` la riega. Las celdas sin planta se
    /// ignoran. Equivalente a `handleTapCell` de `app/jardin.tsx`.
    func handleCellTap(gx: Int, gy: Int) {
        guard let plant = layout.plants.first(where: { $0.gx == gx && $0.gy == gy }) else { return }
        switch mode {
        case .view:
            selectedPlant = plant
        case .water:
            waterPlant(gx: gx, gy: gy)
        case .move, .decorate:
            break
        }
    }

    /// Coloca una decoración en una celda vacía y la persiste.
    func addDecoration(gx: Int, gy: Int, type: DecorationType) {
        guard !isOccupied(gx: gx, gy: gy) else { return }
        layout.decorations.append(DecorationPlacement(gx: gx, gy: gy, type: type))
        persistLayout()
        checkAchievements()
    }

    /// Quita la decoración de una celda y persiste el cambio.
    func removeDecoration(gx: Int, gy: Int) {
        layout.decorations.removeAll { $0.gx == gx && $0.gy == gy }
        persistLayout()
    }

    /// Mueve una planta a otra celda si el destino está libre.
    func movePlant(from: GridPosition, to: GridPosition) {
        guard
            let index = layout.plants.firstIndex(where: { $0.gx == from.gx && $0.gy == from.gy }),
            !isOccupied(gx: to.gx, gy: to.gy)
        else { return }
        layout.plants[index].gx = to.gx
        layout.plants[index].gy = to.gy
    }

    /// Riega una planta: sube una etapa de crecimiento, lanza la animación de
    /// agua y otorga semillas (más un bono si quedan todas regadas).
    func waterPlant(gx: Int, gy: Int) {
        guard
            let index = layout.plants.firstIndex(where: { $0.gx == gx && $0.gy == gy }),
            !layout.plants[index].wateredToday
        else { return }

        layout.plants[index].wateredToday = true
        layout.plants[index].growthStage = min(5, layout.plants[index].growthStage + 1)

        let effect = WaterEffect(gx: gx, gy: gy, startTime: Date())
        waterEffects.append(effect)
        Task {
            try? await Task.sleep(for: .seconds(Self.waterEffectDuration))
            waterEffects.removeAll { $0.id == effect.id }
        }

        var earned = GardenEconomy.waterPlant
        if layout.plants.allSatisfy(\.wateredToday) {
            earned += GardenEconomy.waterAllBonus
        }
        addSeeds(earned)
        checkAchievements()
    }

    // MARK: - Economía

    /// Compra un artículo de la tienda. Devuelve `true` si se completó.
    @discardableResult
    func purchase(itemID: String) -> Bool {
        guard
            let item = GardenEconomy.item(id: itemID),
            !purchasedIDs.contains(itemID),
            let updated = GardenEconomy.spending(item.cost, from: seedBalance)
        else { return false }

        seedBalance = updated
        purchasedIDs.insert(itemID)
        GardenPersistence.saveSeedBalance(seedBalance)
        GardenPersistence.savePurchases(Array(purchasedIDs))

        if item.category == .cosmetics {
            activeCosmeticIDs.append(itemID)
            GardenPersistence.saveActiveCosmetics(activeCosmeticIDs)
        }
        return true
    }

    /// Suma semillas al saldo y lo persiste.
    func addSeeds(_ amount: Int) {
        guard amount > 0 else { return }
        seedBalance = GardenEconomy.adding(amount, to: seedBalance)
        GardenPersistence.saveSeedBalance(seedBalance)
    }

    private func awardDailyReward() {
        let today = BloomDate.dateKey(Date())
        guard let outcome = GardenEconomy.applyDailyReward(to: seedBalance, streak: streak, today: today) else {
            return
        }
        seedBalance = outcome.balance
        pendingDailyReward = outcome.result
        GardenPersistence.saveSeedBalance(seedBalance)
    }

    /// Marca consumida la recompensa diaria pendiente (tras mostrarla).
    func consumeDailyReward() {
        pendingDailyReward = nil
    }

    // MARK: - Logros

    private func checkAchievements() {
        let newIDs = GardenAchievement.newlyUnlocked(
            plants: layout.plants,
            decorations: layout.decorations,
            streak: streak,
            unlockedIDs: unlockedAchievementIDs
        )
        guard !newIDs.isEmpty else { return }

        for id in newIDs {
            unlockedAchievementIDs.insert(id)
            if let achievement = GardenAchievement.byID(id) {
                pendingAchievements.append(achievement)
            }
        }
        addSeeds(GardenEconomy.achievementUnlocked * newIDs.count)
        GardenPersistence.saveUnlockedAchievements(Array(unlockedAchievementIDs))
    }

    /// Saca el siguiente logro de la cola de toasts, o `nil` si está vacía.
    func consumeNextAchievement() -> GardenAchievement? {
        pendingAchievements.isEmpty ? nil : pendingAchievements.removeFirst()
    }

    /// Marca un hito de racha como ya celebrado para no repetir la animación.
    func celebrateMilestone(_ milestone: Int) {
        guard !celebratedMilestones.contains(milestone) else { return }
        celebratedMilestones.insert(milestone)
        GardenPersistence.saveCelebratedMilestones(Array(celebratedMilestones))
    }

    // MARK: - Helpers privados

    private func isOccupied(gx: Int, gy: Int) -> Bool {
        layout.plants.contains { $0.gx == gx && $0.gy == gy }
            || layout.decorations.contains { $0.gx == gx && $0.gy == gy }
    }

    private func persistLayout() {
        GardenPersistence.saveLayout(decorations: layout.decorations, pathTiles: layout.pathTiles)
    }

    // MARK: - Colocación automática de plantas

    /// Coloca las plantas de los días de racha en espiral desde el centro de
    /// la rejilla. Las más antiguas quedan más crecidas y hacia afuera.
    /// Portado de `autoPlacePlants` en `gardenState.ts`.
    static func autoPlacePlants(checkins: [CheckinEntry], streak: Int) -> [PlantPlacement] {
        guard streak > 0 else { return [] }

        let gridSize = GardenGrid.activeSize(streak: streak)
        let uniqueDates = Set(checkins.map(\.date)).sorted()
        let streakDates = Set(uniqueDates.suffix(streak))

        let streakCheckins = checkins
            .filter { streakDates.contains($0.date) }
            .sorted { a, b in
                a.date != b.date ? a.date < b.date : a.createdAt < b.createdAt
            }

        let maxSlots = gridSize * gridSize
        let center = gridSize / 2
        let spiral = generateSpiral(cx: center, cy: center, size: gridSize)
        let total = streakCheckins.count

        var plants: [PlantPlacement] = []
        for index in 0..<min(total, maxSlots) {
            guard index < spiral.count else { break }
            let checkin = streakCheckins[index]
            let position = spiral[index]
            plants.append(
                PlantPlacement(
                    gx: position.gx,
                    gy: position.gy,
                    emotion: checkin.emotion,
                    intensity: checkin.emotionIntensity,
                    date: checkin.date,
                    wateredToday: false,
                    growthStage: min(5, total - index)
                )
            )
        }
        return plants
    }

    /// Genera posiciones en espiral hacia afuera desde un centro.
    /// Portado de `generateSpiral` en `gardenState.ts`.
    static func generateSpiral(cx: Int, cy: Int, size: Int) -> [GridPosition] {
        var positions = [GridPosition(gx: cx, gy: cy)]
        var visited: Set<GridPosition> = [GridPosition(gx: cx, gy: cy)]

        let dirs = [(1, 0), (0, 1), (-1, 0), (0, -1)]
        var x = cx
        var y = cy
        var steps = 1
        var dirIndex = 0

        while positions.count < size * size {
            for _ in 0..<2 {
                let dir = dirs[dirIndex % 4]
                for _ in 0..<steps {
                    x += dir.0
                    y += dir.1
                    if GardenIso.inBounds(gx: x, gy: y, gridSize: size) {
                        let pos = GridPosition(gx: x, gy: y)
                        if visited.insert(pos).inserted {
                            positions.append(pos)
                        }
                    }
                }
                dirIndex += 1
            }
            steps += 1
        }
        return positions
    }
}
