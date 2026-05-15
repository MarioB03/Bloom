import Foundation
import WidgetKit

/// Sincroniza el estado visible del widget de pantalla de inicio.
///
/// Escribe un blob JSON en el `UserDefaults` del App Group
/// `group.com.akemi01.bloom`, que el target `BloomWidget` lee desde
/// `BloomProvider`. Equivalente nativo de `src/lib/widget-sync.ts`.
///
/// Uso típico: tras cualquier cambio que el widget pinta (racha, semillas,
/// nivel del jardín, número de plantas) se llama a `refresh(...)` o a la
/// variante `update(_:)` para mutar solo lo necesario.
enum WidgetSyncService {

    /// Snapshot del estado que se serializa al App Group. Debe coincidir, campo
    /// a campo, con `WidgetData` del target `BloomWidget` (no se comparte el
    /// tipo: el widget extension no enlaza el módulo de la app).
    struct Snapshot: Codable, Equatable {
        var streak: Int
        var streakEmoji: String
        var streakMessage: String
        var gardenLevel: Int
        var gardenName: String
        var seedBalance: Int
        var totalPlants: Int
        var lastCheckinDate: String
        var updatedAt: String

        static let empty = Snapshot(
            streak: 0,
            streakEmoji: Streak.emoji(0),
            streakMessage: Streak.message(0),
            gardenLevel: 1,
            gardenName: "Semillero",
            seedBalance: 0,
            totalPlants: 0,
            lastCheckinDate: "",
            updatedAt: ""
        )
    }

    private static let appGroupID = "group.com.akemi01.bloom"
    private static let storageKey = "widgetData"
    private static let widgetKind = "BloomWidget"

    // MARK: - Lecturas

    /// Lee el snapshot persistido. `nil` si no existe o si el formato no encaja.
    static func currentSnapshot() -> Snapshot? {
        guard
            let defaults = UserDefaults(suiteName: appGroupID),
            let json = defaults.string(forKey: storageKey),
            let data = json.data(using: .utf8)
        else { return nil }
        return try? JSONDecoder().decode(Snapshot.self, from: data)
    }

    // MARK: - Escrituras

    /// Sustituye el snapshot completo. Útil cuando el caller conoce todos los
    /// campos a la vez (p. ej. `GardenStore` tras cargar y aplicar check-ins).
    static func refresh(
        streak: Int,
        seedBalance: Int,
        totalPlants: Int,
        lastCheckinDate: String
    ) {
        let level = GardenLevel.current(streak: streak)
        var snapshot = Snapshot(
            streak: streak,
            streakEmoji: Streak.emoji(streak),
            streakMessage: Streak.message(streak),
            gardenLevel: level.level,
            gardenName: level.name,
            seedBalance: seedBalance,
            totalPlants: totalPlants,
            lastCheckinDate: lastCheckinDate,
            updatedAt: ISO8601DateFormatter().string(from: Date())
        )
        write(&snapshot)
    }

    /// Mutación parcial sobre el snapshot existente — útil cuando el caller
    /// solo conoce uno o dos campos (p. ej. tras crear un check-in fuera del
    /// jardín). Si no había snapshot previo se parte de `Snapshot.empty`.
    static func update(_ mutate: (inout Snapshot) -> Void) {
        var snapshot = currentSnapshot() ?? .empty
        mutate(&snapshot)
        snapshot.updatedAt = ISO8601DateFormatter().string(from: Date())
        write(&snapshot)
    }

    /// Recalcula el snapshot desde Firestore: lee los check-ins de los últimos
    /// 36 días, recalcula la racha y conserva los campos del jardín que viven
    /// en `UserDefaults`. Llamar tras crear/editar/borrar un check-in cuando el
    /// `GardenStore` no está activo en pantalla.
    @MainActor
    static func refreshFromFirestore(_ firestore: FirestoreService, userID: String) async {
        let now = Date()
        let start = Calendar.current.date(byAdding: .day, value: -36, to: now) ?? now
        guard let checkins = try? await firestore.checkins(
            byDateRange: BloomDate.dateKey(start),
            to: BloomDate.dateKey(now),
            userID: userID
        ) else { return }

        let streak = Streak.current(from: checkins.map(\.date))
        let lastDate = checkins.map(\.date).max() ?? ""
        let seedBalance = GardenPersistence.loadSeedBalance().total
        // Cuando el jardín no está cargado, una planta por día de racha es la
        // misma cuenta que `autoPlacePlants` produce.
        refresh(
            streak: streak,
            seedBalance: seedBalance,
            totalPlants: streak,
            lastCheckinDate: lastDate
        )
    }

    /// Borra el snapshot — al cerrar sesión o eliminar la cuenta.
    static func clear() {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
        defaults.removeObject(forKey: storageKey)
        reloadTimeline()
    }

    // MARK: - Internos

    private static func write(_ snapshot: inout Snapshot) {
        if snapshot.updatedAt.isEmpty {
            snapshot.updatedAt = ISO8601DateFormatter().string(from: Date())
        }
        guard
            let defaults = UserDefaults(suiteName: appGroupID),
            let data = try? JSONEncoder().encode(snapshot),
            let json = String(data: data, encoding: .utf8)
        else { return }
        defaults.set(json, forKey: storageKey)
        reloadTimeline()
    }

    private static func reloadTimeline() {
        WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)
    }
}
