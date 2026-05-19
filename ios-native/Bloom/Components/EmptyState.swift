import SwiftUI

/// Estado vacío con emoji y mensaje centrados.
/// Portado de `src/components/ui/EmptyState.tsx`.
struct EmptyState: View {

    let emoji: String
    let message: String

    var body: some View {
        VStack(spacing: Theme.Spacing.sm) {
            Text(emoji)
                .font(.system(size: 40))
            Text(message)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Theme.Spacing.xl)
    }
}
