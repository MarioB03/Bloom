import SwiftUI

/// Overrides visuales activados por cosméticos comprados en la tienda.
/// Cada cosmético modifica un aspecto concreto del lienzo del jardín.
/// Portado de `gardenCosmetics.ts`.
struct CosmeticOverrides: Sendable {
    /// El cielo usa siempre la paleta de atardecer.
    var sunsetSky = false
    /// La valla se cubre de flores de colores.
    var flowerFence = false
    /// Se dibuja una textura de camino de piedra sobre las baldosas.
    var stonePath = false
    /// Las luciérnagas aparecen también de día.
    var firefliesAlways = false

    /// Resuelve una lista de ids de cosméticos activos en overrides tipados.
    /// Los ids provienen del catálogo de la tienda (`GardenEconomy.catalog`).
    static func resolve(activeIDs: [String]) -> CosmeticOverrides {
        var overrides = CosmeticOverrides()
        for id in activeIDs {
            switch id {
            case "sunset_sky": overrides.sunsetSky = true
            case "flower_fence": overrides.flowerFence = true
            case "stone_path": overrides.stonePath = true
            case "fireflies_always": overrides.firefliesAlways = true
            default: break
            }
        }
        return overrides
    }

    /// Colores del cielo de atardecer (cosmético `sunset_sky`).
    static let sunsetSky = (top: Color(hex: "F0C478"), bottom: Color(hex: "FBF0EC"))

    /// Colores de la valla de flores (cosmético `flower_fence`).
    static let flowerFenceColors = [
        Color(hex: "E8A0B0"), Color(hex: "F0C478"), Color(hex: "A0B8E0"),
        Color(hex: "C8E0A0"), Color(hex: "E8C0D0"),
    ]
}
