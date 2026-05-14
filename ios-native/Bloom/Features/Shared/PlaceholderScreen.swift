import SwiftUI

/// Pantalla provisional para features aún sin portar.
/// Se irá sustituyendo por la implementación real feature a feature.
struct PlaceholderScreen: View {
    let title: String
    let systemImage: String
    var subtitle: String = "En construcción"

    var body: some View {
        ZStack {
            Theme.Palette.background.ignoresSafeArea()
            VStack(spacing: Theme.Spacing.md) {
                Image(systemName: systemImage)
                    .font(.system(size: 44))
                    .foregroundStyle(Theme.Palette.primary400)
                Text(title)
                    .font(.displaySmall)
                    .foregroundStyle(Theme.Palette.neutral800)
                Text(subtitle)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral500)
            }
            .padding(Theme.Spacing.lg)
        }
    }
}

#Preview {
    PlaceholderScreen(title: "Bloom", systemImage: "leaf.fill")
}
