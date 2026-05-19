import SwiftUI

/// Las cuatro estaciones, que tematizan el cielo, el suelo y las partículas
/// del jardín. Portado de `gardenSeasons.ts`.
enum Season: String, Sendable, CaseIterable {
    case spring
    case summer
    case autumn
    case winter

    /// Estación actual según el mes del dispositivo. `southern` invierte el
    /// hemisferio.
    static func current(now: Date = Date(), southern: Bool = false) -> Season {
        let month = Calendar.current.component(.month, from: now)
        let season: Season
        switch month {
        case 3...5: season = .spring
        case 6...8: season = .summer
        case 9...11: season = .autumn
        default: season = .winter
        }
        guard southern else { return season }
        switch season {
        case .spring: return .autumn
        case .summer: return .winter
        case .autumn: return .spring
        case .winter: return .summer
        }
    }

    var label: String {
        switch self {
        case .spring: "Primavera"
        case .summer: "Verano"
        case .autumn: "Otoño"
        case .winter: "Invierno"
        }
    }

    var emoji: String {
        switch self {
        case .spring: "🌸"
        case .summer: "☀️"
        case .autumn: "🍂"
        case .winter: "❄️"
        }
    }

    var theme: SeasonalTheme { SeasonalTheme.all[self]! }
}

/// Tipo de partícula ambiental de una estación.
enum SeasonalParticle: Sendable {
    case blossom
    case leaf
    case snow
    case none
}

/// Paleta visual de una estación: colores de cielo (día/noche), suelo,
/// baldosas, hojas y partículas. Portado de `SEASONAL_THEMES`.
struct SeasonalTheme: Sendable {
    let skyTopDay: Color
    let skyBottomDay: Color
    let skyTopNight: Color
    let skyBottomNight: Color
    let groundColor: Color
    let groundHighlight: Color
    let tileBase1: Color
    let tileBase2: Color
    let leafTint: Color
    let particleColor: Color
    let particleType: SeasonalParticle
    let particleCount: Int
    /// Tinte ambiental opcional sobre toda la escena.
    let ambientOverlay: Color?

    static let all: [Season: SeasonalTheme] = [
        .spring: .init(
            skyTopDay: Color(hex: "B8D4E3"), skyBottomDay: Color(hex: "E8F5E0"),
            skyTopNight: Color(hex: "0F1538"), skyBottomNight: Color(hex: "2D3560"),
            groundColor: Color(hex: "B8D8A0"), groundHighlight: rgba(190, 220, 170, 0.3),
            tileBase1: Color(hex: "A4C68E"), tileBase2: Color(hex: "97BB82"),
            leafTint: Color(hex: "6B8B6A"), particleColor: rgba(240, 180, 200, 0.6),
            particleType: .blossom, particleCount: 8, ambientOverlay: nil
        ),
        .summer: .init(
            skyTopDay: Color(hex: "88C4E8"), skyBottomDay: Color(hex: "D8ECD0"),
            skyTopNight: Color(hex: "0A1030"), skyBottomNight: Color(hex: "1E2850"),
            groundColor: Color(hex: "C4D4A8"), groundHighlight: rgba(200, 220, 170, 0.25),
            tileBase1: Color(hex: "A8CA90"), tileBase2: Color(hex: "9BBF84"),
            leafTint: Color(hex: "5A8050"), particleColor: rgba(255, 220, 100, 0.4),
            particleType: .none, particleCount: 0, ambientOverlay: rgba(255, 240, 200, 0.04)
        ),
        .autumn: .init(
            skyTopDay: Color(hex: "D4B8A0"), skyBottomDay: Color(hex: "F0E4D0"),
            skyTopNight: Color(hex: "1A1530"), skyBottomNight: Color(hex: "302848"),
            groundColor: Color(hex: "C8B890"), groundHighlight: rgba(200, 180, 140, 0.25),
            tileBase1: Color(hex: "B0A880"), tileBase2: Color(hex: "A89E78"),
            leafTint: Color(hex: "8A7A50"), particleColor: rgba(200, 140, 60, 0.5),
            particleType: .leaf, particleCount: 6, ambientOverlay: rgba(180, 120, 60, 0.03)
        ),
        .winter: .init(
            skyTopDay: Color(hex: "C8D8E8"), skyBottomDay: Color(hex: "E8ECF0"),
            skyTopNight: Color(hex: "0A1028"), skyBottomNight: Color(hex: "1E2548"),
            groundColor: Color(hex: "D0DCC8"), groundHighlight: rgba(215, 225, 210, 0.3),
            tileBase1: Color(hex: "B0C4A0"), tileBase2: Color(hex: "A8BC96"),
            leafTint: Color(hex: "7A9070"), particleColor: rgba(230, 240, 255, 0.7),
            particleType: .snow, particleCount: 10, ambientOverlay: rgba(180, 200, 230, 0.04)
        ),
    ]
}

/// Color a partir de componentes RGB 0–255 y alfa 0–1. Los temas estacionales
/// de la app RN usan cadenas `rgba(...)`; aquí se traducen a `Color` directo.
private func rgba(_ r: Double, _ g: Double, _ b: Double, _ a: Double) -> Color {
    Color(.sRGB, red: r / 255, green: g / 255, blue: b / 255, opacity: a)
}
