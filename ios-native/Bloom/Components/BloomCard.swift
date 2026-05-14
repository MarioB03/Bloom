import SwiftUI

/// Tarjeta base de Bloom. Portado de `src/components/ui/Card.tsx`.
///
/// `outlined` lleva borde sutil; `elevated` lleva sombra en lugar de borde.
struct BloomCard<Content: View>: View {

    enum Style {
        case outlined, elevated
    }

    var style: Style = .outlined
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Spacing.md)
        .background(Theme.Palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.lg)
                .strokeBorder(
                    style == .outlined ? Theme.Palette.neutral200 : .clear,
                    lineWidth: 1
                )
        )
        .modifier(CardShadowModifier(active: style == .elevated))
    }
}

/// Aplica la sombra media del sistema de diseño solo a la variante elevada.
private struct CardShadowModifier: ViewModifier {
    let active: Bool

    func body(content: Content) -> some View {
        if active {
            content.bloomShadow(.md)
        } else {
            content
        }
    }
}
