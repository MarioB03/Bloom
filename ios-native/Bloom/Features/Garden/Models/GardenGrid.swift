import Foundation

/// Dimensiones y reglas de expansión de la rejilla isométrica.
/// Portado de la sección "Grid" de `src/components/garden/gardenTypes.ts`.
///
/// La rejilla crece con la racha: empieza en 3×3 y llega a 8×8 a los 30 días.
enum GardenGrid {

    /// Ancho de una baldosa isométrica en píxeles.
    static let tileW: CGFloat = 52
    /// Alto de una baldosa isométrica en píxeles.
    static let tileH: CGFloat = 26
    /// Tamaño máximo de la rejilla (lado).
    static let maxSize = 8

    /// Lado de la rejilla activa (desbloqueada) según la racha.
    static func activeSize(streak: Int) -> Int {
        switch streak {
        case ..<2: return 3
        case ..<5: return 4
        case ..<10: return 5
        case ..<18: return 6
        case ..<30: return 7
        default: return 8
        }
    }

    /// Racha necesaria para desbloquear la siguiente expansión, o `nil` si la
    /// rejilla ya está al máximo.
    static func nextUnlockStreak(streak: Int) -> Int? {
        [2, 5, 10, 18, 30].first { streak < $0 }
    }
}

/// Un nivel del jardín: nombre, racha mínima y qué desbloquea.
/// Portado de `GardenLevel` / `GARDEN_LEVELS`.
struct GardenLevel: Sendable, Identifiable {
    let level: Int
    let name: String
    let minStreak: Int
    let gridSize: Int
    /// Descripción de lo que desbloquea este nivel.
    let unlocks: String

    var id: Int { level }

    /// Los 6 niveles del jardín, de Semillero a Jardín dorado.
    static let all: [GardenLevel] = [
        .init(level: 1, name: "Semillero",          minStreak: 0,  gridSize: 3, unlocks: "Tu primer jardín"),
        .init(level: 2, name: "Brote",              minStreak: 2,  gridSize: 4, unlocks: "Flores silvestres + mariposas"),
        .init(level: 3, name: "Jardín joven",       minStreak: 5,  gridSize: 5, unlocks: "Nubes, colinas, farolillos"),
        .init(level: 4, name: "Jardín floreciente", minStreak: 10, gridSize: 6, unlocks: "Estanque, luciérnagas"),
        .init(level: 5, name: "Jardín frondoso",    minStreak: 18, gridSize: 7, unlocks: "Puente, más visitantes"),
        .init(level: 6, name: "Jardín dorado",      minStreak: 30, gridSize: 8, unlocks: "Arcoíris, jardín completo"),
    ]

    /// Nivel actual del jardín según la racha.
    static func current(streak: Int) -> GardenLevel {
        all.last { streak >= $0.minStreak } ?? all[0]
    }

    /// Siguiente nivel por desbloquear, o `nil` si ya está en el máximo.
    static func next(streak: Int) -> GardenLevel? {
        all.first { streak < $0.minStreak }
    }
}
