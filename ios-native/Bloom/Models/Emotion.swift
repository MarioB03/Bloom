import SwiftUI

/// Las 12 emociones de Bloom. Portado de `src/types/checkin.ts` y
/// `src/constants/emotions.ts`.
enum EmotionID: String, CaseIterable, Codable, Identifiable, Sendable {
    case alegria
    case tristeza
    case ira
    case miedo
    case asco
    case sorpresa
    case ansiedad
    case calma
    case frustracion
    case gratitud
    case verguenza
    case culpa

    var id: String { rawValue }

    var config: EmotionConfig { EmotionConfig.all[self]! }
}

/// Metadatos visuales de una emoción: etiqueta, emoji y color.
struct EmotionConfig: Identifiable, Sendable {
    let id: EmotionID
    let label: String
    let emoji: String
    let color: Color

    /// Paleta botánica cálida — un color por emoción.
    static let all: [EmotionID: EmotionConfig] = [
        .alegria: .init(id: .alegria, label: "Alegría", emoji: "😊", color: Color(hex: "E8A948")),
        .tristeza: .init(id: .tristeza, label: "Tristeza", emoji: "😢", color: Color(hex: "7E9EB5")),
        .ira: .init(id: .ira, label: "Ira", emoji: "😠", color: Color(hex: "A0522D")),
        .miedo: .init(id: .miedo, label: "Miedo", emoji: "😰", color: Color(hex: "8B7EB5")),
        .asco: .init(id: .asco, label: "Asco", emoji: "🤢", color: Color(hex: "7A9E7E")),
        .sorpresa: .init(id: .sorpresa, label: "Sorpresa", emoji: "😮", color: Color(hex: "D4937E")),
        .ansiedad: .init(id: .ansiedad, label: "Ansiedad", emoji: "😟", color: Color(hex: "B58B9E")),
        .calma: .init(id: .calma, label: "Calma", emoji: "😌", color: Color(hex: "8BA888")),
        .frustracion: .init(id: .frustracion, label: "Frustración", emoji: "😤", color: Color(hex: "C4725A")),
        .gratitud: .init(id: .gratitud, label: "Gratitud", emoji: "🙏", color: Color(hex: "F0C478")),
        .verguenza: .init(id: .verguenza, label: "Vergüenza", emoji: "😳", color: Color(hex: "C9A0B0")),
        .culpa: .init(id: .culpa, label: "Culpa", emoji: "😔", color: Color(hex: "B8AFA6")),
    ]

    /// Las 12 emociones en el orden canónico de la app.
    static let ordered: [EmotionConfig] = EmotionID.allCases.map { $0.config }
}
