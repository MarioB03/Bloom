import Foundation

/// Una mascota que deambula por el jardín. Portado de `PetType` en
/// `src/components/garden/gardenTypes.ts`.
///
/// El gato es gratuito y aparece con racha ≥ 3; el resto se compran en la
/// tienda (`ShopCategory.pets`). El `rawValue` de las comprables coincide con
/// el `id` del artículo en `GardenEconomy.catalog`.
enum PetType: String, Sendable, CaseIterable {
    case cat
    case bunny
    case bird
    case goldenButterfly = "golden_butterfly"
    case hedgehog

    /// Mascotas comprables en la tienda (todas menos el gato).
    static let purchasable: [PetType] = [.bunny, .bird, .goldenButterfly, .hedgehog]
}
