import Foundation

/// Tipos de decoración que pueden colocarse en el jardín.
/// Portado de `DecorationType` / `DECORATIONS` en `gardenTypes.ts`.
///
/// Las decoraciones se dividen en dos grupos: las gratuitas se desbloquean por
/// racha; las premium se compran con semillas (`config.cost`).
enum DecorationType: String, Codable, CaseIterable, Sendable {
    case stone
    case wildflowers
    case mushroom
    case lantern
    case bench
    case tree
    case birdbath
    case pond
    case butterflyHouse = "butterfly_house"
    case bridge
    case fountain
    case gnome
    // Premium (se compran con semillas, sin requisito de racha)
    case arch
    case statue
    case swing
    case magicLantern = "magic_lantern"
    case wishingWell = "wishing_well"

    var config: DecorationConfig { DecorationConfig.all[self]! }
}

/// Metadatos de una decoración: etiqueta, emoji y forma de desbloqueo.
struct DecorationConfig: Sendable {
    let type: DecorationType
    let label: String
    let emoji: String
    /// Racha necesaria para desbloquearla (0 para las premium).
    let unlockStreak: Int
    /// Coste en semillas para las decoraciones premium; `nil` si es gratuita.
    let cost: Int?

    /// `true` si la decoración se compra con semillas en vez de desbloquearse
    /// por racha.
    var isPremium: Bool { cost != nil }

    /// Catálogo completo de decoraciones, en orden de desbloqueo.
    static let all: [DecorationType: DecorationConfig] = [
        .stone:          .init(type: .stone,          label: "Piedra",            emoji: "🪨", unlockStreak: 0,  cost: nil),
        .wildflowers:    .init(type: .wildflowers,    label: "Flores silvestres", emoji: "🌼", unlockStreak: 2,  cost: nil),
        .mushroom:       .init(type: .mushroom,       label: "Seta",              emoji: "🍄", unlockStreak: 3,  cost: nil),
        .lantern:        .init(type: .lantern,        label: "Farolillo",         emoji: "🏮", unlockStreak: 5,  cost: nil),
        .bench:          .init(type: .bench,          label: "Banco",             emoji: "🪑", unlockStreak: 7,  cost: nil),
        .tree:           .init(type: .tree,           label: "Arbolito",          emoji: "🌳", unlockStreak: 8,  cost: nil),
        .birdbath:       .init(type: .birdbath,       label: "Bebedero",          emoji: "🐦", unlockStreak: 10, cost: nil),
        .pond:           .init(type: .pond,           label: "Estanque",          emoji: "💧", unlockStreak: 12, cost: nil),
        .butterflyHouse: .init(type: .butterflyHouse, label: "Casa mariposas",    emoji: "🦋", unlockStreak: 14, cost: nil),
        .bridge:         .init(type: .bridge,         label: "Puente",            emoji: "🌉", unlockStreak: 18, cost: nil),
        .fountain:       .init(type: .fountain,       label: "Fuente",            emoji: "⛲", unlockStreak: 21, cost: nil),
        .gnome:          .init(type: .gnome,          label: "Gnomo",             emoji: "🧑‍🌾", unlockStreak: 30, cost: nil),
        .arch:           .init(type: .arch,           label: "Arco de flores",    emoji: "🌸", unlockStreak: 0,  cost: 30),
        .statue:         .init(type: .statue,         label: "Estatua",           emoji: "🗿", unlockStreak: 0,  cost: 50),
        .swing:          .init(type: .swing,          label: "Columpio",          emoji: "🎪", unlockStreak: 0,  cost: 40),
        .magicLantern:   .init(type: .magicLantern,   label: "Farol mágico",      emoji: "✨", unlockStreak: 0,  cost: 35),
        .wishingWell:    .init(type: .wishingWell,    label: "Pozo de deseos",    emoji: "🪨", unlockStreak: 0,  cost: 75),
    ]

    /// Catálogo en el orden canónico de `DecorationType.allCases`.
    static let ordered: [DecorationConfig] = DecorationType.allCases.map { all[$0]! }
}
