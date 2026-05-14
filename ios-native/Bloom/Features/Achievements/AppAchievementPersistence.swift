import Foundation

/// Persistencia local de los logros de app en `UserDefaults`. Equivalente
/// nativo de las claves `@bloom_app_*` que `src/lib/achievements.ts` guarda en
/// `AsyncStorage`.
///
/// Es independiente de `GardenPersistence`: los logros del jardín y los de app
/// se guardan por separado, igual que en la app RN.
enum AppAchievementPersistence {

    private enum Key {
        static let unlocked = "bloom.appAchievements.unlocked"
        static let timestamps = "bloom.appAchievements.timestamps"
        static let pendingToasts = "bloom.appAchievements.pendingToasts"
    }

    // MARK: - Logros desbloqueados

    static func loadUnlocked() -> [String] {
        UserDefaults.standard.stringArray(forKey: Key.unlocked) ?? []
    }

    static func saveUnlocked(_ ids: [String]) {
        UserDefaults.standard.set(ids, forKey: Key.unlocked)
    }

    // MARK: - Fecha de desbloqueo por logro

    static func loadTimestamps() -> [String: Date] {
        guard
            let data = UserDefaults.standard.data(forKey: Key.timestamps),
            let stored = try? JSONDecoder().decode([String: Date].self, from: data)
        else {
            return [:]
        }
        return stored
    }

    static func saveTimestamps(_ timestamps: [String: Date]) {
        guard let data = try? JSONEncoder().encode(timestamps) else { return }
        UserDefaults.standard.set(data, forKey: Key.timestamps)
    }

    // MARK: - Cola de toasts pendientes

    static func loadPendingToasts() -> [String] {
        UserDefaults.standard.stringArray(forKey: Key.pendingToasts) ?? []
    }

    static func savePendingToasts(_ ids: [String]) {
        UserDefaults.standard.set(ids, forKey: Key.pendingToasts)
    }

    static func clearPendingToasts() {
        UserDefaults.standard.removeObject(forKey: Key.pendingToasts)
    }
}
