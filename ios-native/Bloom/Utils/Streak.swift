import Foundation

/// Cálculo de la racha de días consecutivos con check-in.
/// Portado de `src/utils/streak.ts`.
///
/// Es lógica transversal: la usan home, jardín, insights y perfil. Por ahora
/// vive aquí y solo la consume el home del check-in.
enum Streak {

    /// Días consecutivos con al menos un check-in, contando hacia atrás desde
    /// hoy o ayer. Si el último check-in es más antiguo que ayer, la racha es 0.
    static func current(from checkinDates: [String], now: Date = Date()) -> Int {
        guard !checkinDates.isEmpty else { return 0 }

        let uniqueDates = Set(checkinDates).sorted(by: >)

        let today = BloomDate.dateKey(now)
        let yesterday = BloomDate.dateKey(
            Calendar.current.date(byAdding: .day, value: -1, to: now) ?? now
        )

        guard uniqueDates[0] == today || uniqueDates[0] == yesterday else {
            return 0
        }

        var streak = 1
        for i in 1..<uniqueDates.count {
            guard
                let current = BloomDate.date(fromKey: uniqueDates[i - 1]),
                let previous = BloomDate.date(fromKey: uniqueDates[i])
            else { break }

            let diff = Calendar.current.dateComponents([.day], from: previous, to: current).day
            if diff == 1 {
                streak += 1
            } else {
                break
            }
        }
        return streak
    }

    /// Emoji de planta según la longitud de la racha.
    static func emoji(_ streak: Int) -> String {
        switch streak {
        case 0: "🌱"
        case 1...3: "🌿"
        case 4...7: "🌻"
        case 8...14: "🌳"
        case 15...30: "🌺"
        default: "🏆"
        }
    }

    /// Mensaje motivacional según la racha.
    static func message(_ streak: Int) -> String {
        switch streak {
        case 0: "Empieza tu racha hoy"
        case 1: "¡Primer día! Sigue así"
        case 2...3: "\(streak) días seguidos 🌿"
        case 4...7: "\(streak) días · ¡Vas genial!"
        case 8...14: "\(streak) días · ¡Increíble!"
        case 15...30: "\(streak) días · ¡Imparable!"
        default: "\(streak) días · ¡Leyenda! 🏆"
        }
    }

    /// Texto del contador ("Sin racha" / "1 día" / "N días").
    static func countLabel(_ streak: Int) -> String {
        switch streak {
        case 0: "Sin racha"
        case 1: "1 día"
        default: "\(streak) días"
        }
    }
}
