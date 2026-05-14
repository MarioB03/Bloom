import SwiftUI

/// Etiqueta compacta con color de acento. Portado de `src/components/ui/Badge.tsx`.
struct Badge: View {

    let label: String
    var color: Color = Theme.Palette.primary400

    var body: some View {
        Text(label)
            .font(.tag)
            .foregroundStyle(color)
            .padding(.horizontal, Theme.Spacing.sm)
            .padding(.vertical, 3)
            .background(color.opacity(0.12))
            .clipShape(Capsule())
    }
}
