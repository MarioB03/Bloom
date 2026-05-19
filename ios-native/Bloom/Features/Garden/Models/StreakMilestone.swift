import Foundation

/// Un hito de racha que dispara la celebración con confeti del jardín.
/// Independiente de los logros (`GardenAchievement`): los hitos premian la
/// constancia de la racha, no el estado del jardín. Portado de `MILESTONES`
/// en `StreakCelebration.tsx`.
struct StreakMilestone: Sendable, Identifiable {
    /// Días de racha que desbloquean el hito.
    let streak: Int
    let emoji: String
    let title: String
    /// Texto de lo que se desbloquea al alcanzarlo.
    let unlocks: String

    var id: Int { streak }

    /// Los 5 hitos de racha que se celebran.
    static let all: [StreakMilestone] = [
        .init(streak: 3,  emoji: "🌿", title: "¡3 días seguidos!", unlocks: "Rejilla 4×4, seta y +10 semillas"),
        .init(streak: 7,  emoji: "🔥", title: "¡Una semana!",      unlocks: "Banco y +25 semillas"),
        .init(streak: 14, emoji: "⭐", title: "¡Dos semanas!",     unlocks: "Casa de mariposas y +50 semillas"),
        .init(streak: 21, emoji: "🌈", title: "¡Tres semanas!",    unlocks: "Fuente y arcoíris"),
        .init(streak: 30, emoji: "👑", title: "¡Un mes!",          unlocks: "Rejilla 8×8, gnomo y +100 semillas"),
    ]

    /// Hito por su número de días de racha, o `nil` si no es un hito celebrable.
    static func at(_ streak: Int) -> StreakMilestone? {
        all.first { $0.streak == streak }
    }
}
