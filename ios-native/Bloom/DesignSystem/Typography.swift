import SwiftUI

/// Tipografía de Bloom — portada de `src/constants/theme.ts`.
/// Fuentes registradas vía `UIAppFonts` en Info.plist. Se referencian por
/// nombre PostScript con `Font.custom`.
extension Font {

    private enum Name {
        static let serif = "DMSerifDisplay-Regular"
        static let sans = "DMSans-Regular"
        static let sansMedium = "DMSans-Medium"
        static let sansSemiBold = "DMSans-SemiBold"
        static let sansBold = "DMSans-Bold"
        static let rounded = "Nunito-SemiBold"
        static let roundedBold = "Nunito-Bold"
    }

    // MARK: - Serif display — títulos de pantalla, cabeceras emocionales

    static let displayLarge = Font.custom(Name.serif, size: 32)
    static let displayMedium = Font.custom(Name.serif, size: 26)
    static let displaySmall = Font.custom(Name.serif, size: 22)

    // MARK: - Sans — cabeceras, cuerpo, labels

    static let heading1 = Font.custom(Name.sansBold, size: 24)
    static let heading2 = Font.custom(Name.sansSemiBold, size: 20)
    static let heading3 = Font.custom(Name.sansSemiBold, size: 17)
    static let bodyText = Font.custom(Name.sans, size: 15)
    static let bodyBold = Font.custom(Name.sansSemiBold, size: 15)
    static let caption = Font.custom(Name.sansMedium, size: 13)
    static let smallText = Font.custom(Name.sansMedium, size: 11)

    // MARK: - Rounded — tags, badges, etiquetas de estado de ánimo

    static let tag = Font.custom(Name.rounded, size: 12)
    static let tagBold = Font.custom(Name.roundedBold, size: 12)
}
