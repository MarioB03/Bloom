import SwiftUI

/// Sistema de diseño de Bloom — paleta botánica cálida.
/// Portado de `src/constants/theme.ts` de la app React Native.
enum Theme {

    // MARK: - Colores

    enum Palette {
        // Brand — terracota
        static let primary50 = Color(hex: "FBF0EC")
        static let primary100 = Color(hex: "F2D6CC")
        static let primary200 = Color(hex: "E4AD99")
        static let primary300 = Color(hex: "D4937E")
        static let primary400 = Color(hex: "C4725A")
        static let primary500 = Color(hex: "A45B44")
        static let primary600 = Color(hex: "8B4A37")
        static let primary700 = Color(hex: "6E3A2B")

        // Verde salvia
        static let secondary50 = Color(hex: "F0F5EF")
        static let secondary100 = Color(hex: "DAE7D8")
        static let secondary200 = Color(hex: "C0D6BD")
        static let secondary300 = Color(hex: "A8C4A5")
        static let secondary400 = Color(hex: "8BA888")
        static let secondary500 = Color(hex: "6B8B6A")
        static let secondary600 = Color(hex: "557055")
        static let secondary700 = Color(hex: "3F5440")

        // Ámbar dorado
        static let accent50 = Color(hex: "FEF7E8")
        static let accent100 = Color(hex: "FCEBC4")
        static let accent200 = Color(hex: "F5D48A")
        static let accent300 = Color(hex: "F0C478")
        static let accent400 = Color(hex: "E8A948")
        static let accent500 = Color(hex: "D49330")
        static let accent600 = Color(hex: "B57A20")

        // Neutros cálidos
        static let neutral50 = Color(hex: "FAF6F0")
        static let neutral100 = Color(hex: "F3EDE6")
        static let neutral200 = Color(hex: "E8E0D8")
        static let neutral300 = Color(hex: "D6CCC2")
        static let neutral400 = Color(hex: "B8AFA6")
        static let neutral500 = Color(hex: "7A7570")
        static let neutral600 = Color(hex: "5C5752")
        static let neutral700 = Color(hex: "44403C")
        static let neutral800 = Color(hex: "2D2926")
        static let neutral900 = Color(hex: "1C1917")

        // Semánticos
        static let error = Color(hex: "C75450")
        static let warning = Color(hex: "D49330")
        static let success = Color(hex: "6B8B6A")
        static let info = Color(hex: "7E9EB5")
        static let background = Color(hex: "FAF6F0")
        static let surface = Color.white
    }

    // MARK: - Espaciado

    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }

    // MARK: - Radios

    enum Radius {
        static let sm: CGFloat = 8
        static let md: CGFloat = 14
        static let lg: CGFloat = 20
        static let xl: CGFloat = 24
        static let full: CGFloat = 9999
    }

    // MARK: - Sombras

    struct Shadow {
        let color: Color
        let radius: CGFloat
        let x: CGFloat
        let y: CGFloat

        static let sm = Shadow(color: Palette.neutral800.opacity(0.04), radius: 8, x: 0, y: 2)
        static let md = Shadow(color: Palette.neutral800.opacity(0.06), radius: 12, x: 0, y: 4)
        static let lg = Shadow(color: Palette.neutral800.opacity(0.08), radius: 24, x: 0, y: 8)
        static let warm = Shadow(color: Palette.primary400.opacity(0.2), radius: 16, x: 0, y: 6)
    }
}

extension View {
    /// Aplica una sombra del sistema de diseño.
    func bloomShadow(_ shadow: Theme.Shadow) -> some View {
        self.shadow(color: shadow.color, radius: shadow.radius, x: shadow.x, y: shadow.y)
    }
}
