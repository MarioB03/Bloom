import Foundation

/// Tipos base del jardín de bienestar. Portado de
/// `src/components/garden/gardenTypes.ts`.

/// Una posición en la rejilla isométrica.
struct GridPosition: Codable, Hashable, Sendable {
    var gx: Int
    var gy: Int
}

/// Contenido posible de una celda de la rejilla.
enum CellContent: String, Sendable {
    case empty
    case plant
    case decoration
    case path
}

/// Una planta colocada en el jardín. Cada planta nace de un check-in: la
/// emoción define su morfología y la antigüedad su etapa de crecimiento.
///
/// Las plantas no se persisten: se regeneran en cada sesión a partir de los
/// check-ins de Firestore (ver `GardenStore.refreshFromCheckins`).
struct PlantPlacement: Codable, Hashable, Sendable, Identifiable {
    var gx: Int
    var gy: Int
    var emotion: EmotionID
    /// Intensidad de la emoción del check-in, 1–5.
    var intensity: Int
    /// Fecha del check-in en formato `"YYYY-MM-DD"`.
    var date: String
    var wateredToday: Bool
    /// Etapa de crecimiento, 0 (semilla) – 5 (flor completa).
    var growthStage: Int

    /// Identidad por celda: en el jardín no hay dos plantas en la misma posición.
    var id: GridPosition { GridPosition(gx: gx, gy: gy) }
}

/// Una decoración colocada en el jardín. A diferencia de las plantas, las
/// decoraciones sí se persisten localmente.
struct DecorationPlacement: Codable, Hashable, Sendable, Identifiable {
    var gx: Int
    var gy: Int
    var type: DecorationType

    var id: GridPosition { GridPosition(gx: gx, gy: gy) }
}

/// Estado completo del jardín: plantas, decoraciones y baldosas de camino.
struct GardenLayout: Codable, Sendable {
    var plants: [PlantPlacement] = []
    var decorations: [DecorationPlacement] = []
    var pathTiles: [GridPosition] = []
}

/// Animación de riego activa sobre una celda. Se descarta tras
/// `GardenStore.waterEffectDuration`.
struct WaterEffect: Identifiable, Sendable {
    let id = UUID()
    var gx: Int
    var gy: Int
    /// Momento en que empezó la animación.
    var startTime: Date
}

/// Modo de interacción del jardín: condiciona qué hace un toque sobre una celda.
enum InteractionMode: String, Sendable {
    /// Tocar una planta abre su detalle.
    case view
    /// Mover plantas de celda (definido pero aún sin gestos en RN).
    case move
    /// Tocar una celda vacía coloca la decoración seleccionada.
    case decorate
    /// Tocar una planta sin regar la riega.
    case water
}
