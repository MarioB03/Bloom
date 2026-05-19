import SwiftUI

/// Contenedor base de pantalla: fondo cálido, scroll vertical y padding
/// horizontal consistente. Portado de `src/components/ui/ScreenWrapper.tsx`.
struct ScreenWrapper<Content: View>: View {

    @ViewBuilder var content: Content

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                content
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.top, Theme.Spacing.md)
            .padding(.bottom, Theme.Spacing.xl)
        }
        .scrollIndicators(.hidden)
        .background(Theme.Palette.background)
    }
}
