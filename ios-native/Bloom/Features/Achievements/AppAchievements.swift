import Foundation

/// Orquesta la comprobación y el desbloqueo de los logros de app: construye las
/// métricas desde Firestore, detecta los recién desbloqueados, los persiste
/// (con su fecha) y los encola como toasts.
/// Portado de `buildAchievementData` + `checkAndUnlockAchievements` +
/// la cola de toasts de `src/lib/achievements.ts`.
@MainActor
enum AppAchievements {

    /// Construye las métricas del usuario a partir de los check-ins, las
    /// entradas de gratitud y las prácticas de habilidades de Firestore.
    ///
    /// A diferencia de la app RN (que lanza siete consultas), aquí basta con
    /// tres lecturas de colección: el resto de métricas (racha, compostaje,
    /// emociones distintas) se derivan en local de los check-ins.
    static func buildData(userID: String, firestore: FirestoreService) async throws -> AppAchievementData {
        let checkins = try await firestore.allCheckins(userID: userID)
        let gratitude = try await firestore.allGratitude(userID: userID)
        let practices = try await firestore.skillPracticeHistory(userID: userID)

        return AppAchievementData(
            totalCheckins: checkins.count,
            streak: Streak.current(from: checkins.map(\.date)),
            gratitudeCount: gratitude.count,
            compostCount: checkins.filter { $0.composted == true }.count,
            uniqueEmotions: Set(checkins.map(\.emotion)).count,
            practiceCount: practices.count,
            uniqueCategories: Set(practices.map(\.category)).count
        )
    }

    /// Comprueba los logros, desbloquea los nuevos —persistiéndolos junto a su
    /// fecha— y los añade a la cola de toasts pendientes. Devuelve los recién
    /// desbloqueados. Pensado para llamarse en segundo plano tras guardar datos;
    /// si la lectura de Firestore falla, no hace nada.
    @discardableResult
    static func checkAndUnlock(userID: String, firestore: FirestoreService) async -> [AppAchievement] {
        guard let data = try? await buildData(userID: userID, firestore: firestore) else {
            return []
        }

        let unlocked = AppAchievementPersistence.loadUnlocked()
        let newIDs = AppAchievementCatalog.newlyUnlocked(data: data, unlockedIDs: Set(unlocked))
        guard !newIDs.isEmpty else { return [] }

        var allUnlocked = unlocked
        var timestamps = AppAchievementPersistence.loadTimestamps()
        var pending = AppAchievementPersistence.loadPendingToasts()
        let now = Date()
        for id in newIDs {
            allUnlocked.append(id)
            timestamps[id] = now
            if !pending.contains(id) { pending.append(id) }
        }
        AppAchievementPersistence.saveUnlocked(allUnlocked)
        AppAchievementPersistence.saveTimestamps(timestamps)
        AppAchievementPersistence.savePendingToasts(pending)

        return newIDs.compactMap(AppAchievementCatalog.byID)
    }

    /// Vacía la cola de toasts pendientes y devuelve los logros a mostrar.
    static func consumePendingToasts() -> [AppAchievement] {
        let ids = AppAchievementPersistence.loadPendingToasts()
        guard !ids.isEmpty else { return [] }
        AppAchievementPersistence.clearPendingToasts()
        return ids.compactMap(AppAchievementCatalog.byID)
    }
}
