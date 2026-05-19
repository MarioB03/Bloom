import SwiftUI

/// Iconos botánicos del sistema (87+ piezas) que sustituyen a los emojis
/// genéricos. Los assets viven en `Resources/Assets.xcassets/<categoría>/`
/// con `preserves-vector-representation` activado y se nombran por su id
/// (`emotions/alegria`, `decorations/stone`, …).
///
/// Entregados por Claude Design en `Bloom Iconography v3` (sesiones 01-03).
enum BloomIcon: Hashable {
    case emotion(EmotionID)
    case skillCategory(SkillCategory)
    case skill(id: String)
    case gardenAchievement(id: String)
    case decoration(id: String)
    case pet(id: String)
    case season(Season)
    case cosmetic(id: String)
    case plantAccent(PlantAccent)
    case brand(Brand)

    /// Acentos centrales de las plantas (los antiguos `centerEmoji` de
    /// `PlantMorphology`: ☀️🔥✨💛).
    enum PlantAccent: String, Hashable {
        case sun
        case flame
        case sparkle
        case heart
    }

    /// Piezas de marca: símbolo, mark monocromo, icono de app, icono
    /// adaptable (Android), splash a pantalla completa, wordmark y favicon.
    enum Brand: String, Hashable {
        case symbol
        case symbolMono = "symbol-mono"
        case icon
        case adaptiveIcon = "adaptive-icon"
        case splash
        case wordmark
        case favicon
    }

    /// Nombre del asset (compatible con `Image(_:)` y `UIImage(named:)`).
    var assetName: String {
        switch self {
        case let .emotion(id):
            return "emotions/\(id.rawValue)"
        case let .skillCategory(category):
            return "skill-categories/\(category.rawValue)"
        case let .skill(id):
            return "skills/\(id)"
        case let .gardenAchievement(id):
            return "achievements/\(id)"
        case let .decoration(id):
            return "decorations/\(id)"
        case let .pet(id):
            return "pets/\(id)"
        case let .season(season):
            return "seasons/\(season.rawValue)"
        case let .cosmetic(id):
            return "cosmetics/\(id)"
        case let .plantAccent(accent):
            return "plant-accents/\(accent.rawValue)"
        case let .brand(brand):
            return "brand/\(brand.rawValue)"
        }
    }
}

// MARK: - Vista

/// Renderiza un `BloomIcon` a un tamaño cuadrado dado. El SVG está vectorizado
/// con `preserves-vector-representation`, así que escala nítido a cualquier
/// resolución sin pixelarse.
///
/// Ejemplo:
/// ```swift
/// BloomIconView(.emotion(.alegria), size: 32)
/// ```
struct BloomIconView: View {
    let icon: BloomIcon
    var size: CGFloat = 32
    /// Si se da un color, se aplica como tinte (usa `.template`). Por defecto
    /// se conservan los colores originales del SVG.
    var tint: Color?

    init(_ icon: BloomIcon, size: CGFloat = 32, tint: Color? = nil) {
        self.icon = icon
        self.size = size
        self.tint = tint
    }

    var body: some View {
        Image(icon.assetName)
            .renderingMode(tint == nil ? .original : .template)
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: size, height: size)
            .foregroundStyle(tint ?? .primary)
            .accessibilityHidden(true)
    }
}

#Preview("Marca") {
    VStack(spacing: 20) {
        BloomIconView(.brand(.symbol), size: 96)
        BloomIconView(.brand(.wordmark), size: 200)
    }
    .padding()
    .background(Theme.Palette.background)
}

#Preview("Emociones") {
    let cols = [GridItem(.adaptive(minimum: 64), spacing: 16)]
    return LazyVGrid(columns: cols, spacing: 16) {
        ForEach(EmotionID.allCases) { id in
            VStack(spacing: 4) {
                BloomIconView(.emotion(id), size: 48)
                Text(id.config.label)
                    .font(.caption2)
                    .foregroundStyle(Theme.Palette.neutral500)
            }
        }
    }
    .padding()
    .background(Theme.Palette.background)
}
