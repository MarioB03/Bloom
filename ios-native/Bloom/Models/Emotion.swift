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

/// Metadatos visuales de una emoción: etiqueta, planta asociada y color.
///
/// La planta es la flora que representa la emoción en el catálogo de iconos
/// (Girasol=alegría, Sauce=tristeza, Cactus ardiente=ira…) y se renderiza con
/// `BloomIconView(.emotion(id))`. El emoji legado se mantiene solo como
/// fallback para superficies que aún no aceptan vistas (compartir, dictado de
/// voz, etc.).
struct EmotionConfig: Identifiable, Sendable {
    let id: EmotionID
    let label: String
    /// Nombre de la planta del catálogo botánico. Se muestra en chips y
    /// resúmenes como subtítulo del icono.
    let plant: String
    /// Emoji legado, solo como fallback textual (Insights compartidos, copia
    /// para terapeuta…). En UI nativa usa siempre `BloomIconView`.
    let emoji: String
    let color: Color

    /// Icono botánico (SVG vectorial) de la emoción.
    var icon: BloomIcon { .emotion(id) }

    /// Paleta botánica cálida — un color por emoción, con su planta.
    static let all: [EmotionID: EmotionConfig] = [
        .alegria: .init(id: .alegria, label: "Alegría", plant: "Girasol", emoji: "😊", color: Color(hex: "E8A948")),
        .tristeza: .init(id: .tristeza, label: "Tristeza", plant: "Sauce", emoji: "😢", color: Color(hex: "7E9EB5")),
        .ira: .init(id: .ira, label: "Ira", plant: "Cactus ardiente", emoji: "😠", color: Color(hex: "A0522D")),
        .miedo: .init(id: .miedo, label: "Miedo", plant: "Lavanda", emoji: "😰", color: Color(hex: "8B7EB5")),
        .asco: .init(id: .asco, label: "Asco", plant: "Musgo", emoji: "🤢", color: Color(hex: "7A9E7E")),
        .sorpresa: .init(id: .sorpresa, label: "Sorpresa", plant: "Flor tropical", emoji: "😮", color: Color(hex: "D4937E")),
        .ansiedad: .init(id: .ansiedad, label: "Ansiedad", plant: "Hiedra", emoji: "😟", color: Color(hex: "B58B9E")),
        .calma: .init(id: .calma, label: "Calma", plant: "Bambú", emoji: "😌", color: Color(hex: "8BA888")),
        .frustracion: .init(id: .frustracion, label: "Frustración", plant: "Rosa espinosa", emoji: "😤", color: Color(hex: "C4725A")),
        .gratitud: .init(id: .gratitud, label: "Gratitud", plant: "Cerezo", emoji: "🙏", color: Color(hex: "F0C478")),
        .verguenza: .init(id: .verguenza, label: "Vergüenza", plant: "Violeta", emoji: "😳", color: Color(hex: "C9A0B0")),
        .culpa: .init(id: .culpa, label: "Culpa", plant: "Helecho", emoji: "😔", color: Color(hex: "B8AFA6")),
    ]

    /// Las 12 emociones en el orden canónico de la app.
    static let ordered: [EmotionConfig] = EmotionID.allCases.map { $0.config }
}
