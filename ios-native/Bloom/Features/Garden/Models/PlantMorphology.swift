import SwiftUI

/// Forma de los pétalos de una planta.
enum PetalShape: Sendable {
    case round
    case elongated
    case pointed
}

/// Morfología visual de una planta: cada emoción florece como una especie
/// distinta. Portado de `plantMorphology` en `src/constants/garden.ts`.
struct PlantMorphology: Sendable {
    /// Nombre de la "especie" (Girasol, Lavanda, …).
    let name: String
    /// Número de pétalos de la flor (4–8).
    let petalCount: Int
    /// Radio del pétalo en píxeles.
    let petalSize: CGFloat
    /// Distancia del centro al centro de cada pétalo.
    let petalSpread: CGFloat
    /// Rango de altura del tallo `[mín, máx]`.
    let stemHeight: ClosedRange<CGFloat>
    /// Número de hojas (2–4).
    let leafCount: Int
    /// Tamaño de la hoja: ancho × alto.
    let leafSize: CGSize
    /// Emoji opcional (fallback) del acento central.
    let centerEmoji: String?
    /// Acento central vectorial preferido sobre el emoji. Apunta a uno de los
    /// 4 SVGs de `plant-accents/` (sol, llama, chispa, corazón) entregados por
    /// Claude Design v3.
    let centerAccent: BloomIcon.PlantAccent?
    let petalShape: PetalShape

    /// Tabla de morfología por emoción — las 12 "especies" del jardín.
    static let all: [EmotionID: PlantMorphology] = [
        .alegria: .init(
            name: "Girasol", petalCount: 8, petalSize: 7, petalSpread: 14,
            stemHeight: 45...60, leafCount: 3, leafSize: .init(width: 7, height: 18),
            centerEmoji: "☀️", centerAccent: .sun, petalShape: .elongated
        ),
        .tristeza: .init(
            name: "Sauce llorón", petalCount: 5, petalSize: 6, petalSpread: 12,
            stemHeight: 35...50, leafCount: 4, leafSize: .init(width: 6, height: 20),
            centerEmoji: nil, centerAccent: nil, petalShape: .elongated
        ),
        .ira: .init(
            name: "Cactus ardiente", petalCount: 6, petalSize: 5, petalSpread: 10,
            stemHeight: 30...45, leafCount: 2, leafSize: .init(width: 5, height: 12),
            centerEmoji: "🔥", centerAccent: .flame, petalShape: .pointed
        ),
        .miedo: .init(
            name: "Lavanda", petalCount: 6, petalSize: 5, petalSpread: 11,
            stemHeight: 40...55, leafCount: 3, leafSize: .init(width: 5, height: 16),
            centerEmoji: nil, centerAccent: nil, petalShape: .elongated
        ),
        .asco: .init(
            name: "Musgo", petalCount: 5, petalSize: 6, petalSpread: 11,
            stemHeight: 25...38, leafCount: 4, leafSize: .init(width: 8, height: 14),
            centerEmoji: nil, centerAccent: nil, petalShape: .round
        ),
        .sorpresa: .init(
            name: "Flor tropical", petalCount: 7, petalSize: 7, petalSpread: 14,
            stemHeight: 40...55, leafCount: 3, leafSize: .init(width: 7, height: 18),
            centerEmoji: "✨", centerAccent: .sparkle, petalShape: .round
        ),
        .ansiedad: .init(
            name: "Hiedra", petalCount: 5, petalSize: 5, petalSpread: 10,
            stemHeight: 35...48, leafCount: 4, leafSize: .init(width: 6, height: 15),
            centerEmoji: nil, centerAccent: nil, petalShape: .pointed
        ),
        .calma: .init(
            name: "Bambú sereno", petalCount: 6, petalSize: 6, petalSpread: 12,
            stemHeight: 45...60, leafCount: 3, leafSize: .init(width: 6, height: 22),
            centerEmoji: nil, centerAccent: nil, petalShape: .elongated
        ),
        .frustracion: .init(
            name: "Rosa espinosa", petalCount: 7, petalSize: 6, petalSpread: 13,
            stemHeight: 38...52, leafCount: 3, leafSize: .init(width: 6, height: 16),
            centerEmoji: nil, centerAccent: nil, petalShape: .pointed
        ),
        .gratitud: .init(
            name: "Cerezo", petalCount: 5, petalSize: 8, petalSpread: 14,
            stemHeight: 42...58, leafCount: 3, leafSize: .init(width: 7, height: 17),
            centerEmoji: "💛", centerAccent: .heart, petalShape: .round
        ),
        .verguenza: .init(
            name: "Violeta", petalCount: 5, petalSize: 6, petalSpread: 11,
            stemHeight: 30...42, leafCount: 3, leafSize: .init(width: 6, height: 15),
            centerEmoji: nil, centerAccent: nil, petalShape: .round
        ),
        .culpa: .init(
            name: "Helecho", petalCount: 6, petalSize: 5, petalSpread: 10,
            stemHeight: 32...44, leafCount: 4, leafSize: .init(width: 7, height: 18),
            centerEmoji: nil, centerAccent: nil, petalShape: .elongated
        ),
    ]
}

extension EmotionID {
    /// Morfología de planta de esta emoción.
    var plantMorphology: PlantMorphology { PlantMorphology.all[self]! }
}

/// Funciones de crecimiento y cielo del jardín.
/// Portado de `getGrowthStage` y `getSkyColors` en `src/constants/garden.ts`.
enum GardenGrowth {

    /// Etapa de crecimiento 0–5 según hace cuántos días se plantó el check-in.
    /// Las plantas más antiguas (índice bajo) están más crecidas.
    static func stage(dayIndex: Int, totalDays: Int) -> Int {
        let age = totalDays - dayIndex
        switch age {
        case ..<1: return 5
        case 1: return 4
        case 2: return 3
        case 3: return 2
        case 4: return 1
        default: return 0
        }
    }

    /// Gradiente del cielo `(arriba, abajo)` según la longitud de la racha.
    static func skyColors(streak: Int) -> (top: Color, bottom: Color) {
        switch streak {
        case 0:     return (Color(hex: "E8E0D8"), Color(hex: "F3EDE6"))
        case 1...3: return (Color(hex: "FCEBC4"), Color(hex: "FBF0EC"))
        case 4...7: return (Color(hex: "B8D4E3"), Color(hex: "F0F5EF"))
        case 8...14: return (Color(hex: "FEF7E8"), Color(hex: "F0F5EF"))
        default:    return (Color(hex: "FCEBC4"), Color(hex: "FEF7E8"))
        }
    }
}
