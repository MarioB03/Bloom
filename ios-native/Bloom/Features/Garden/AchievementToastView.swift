import SwiftUI

/// Toast efímero que anuncia un logro recién desbloqueado: entra deslizándose
/// desde arriba con un rebote, se mantiene unos segundos y sale. Se autodescarta
/// llamando a `onDismiss`. Lo usan tanto los logros del jardín como los de app,
/// por eso recibe los campos sueltos en lugar de un modelo concreto.
/// Equivalente nativo de `AchievementToast.tsx`.
struct AchievementToastView: View {
    /// Icono botánico del logro. Cuando hay (logros del jardín con SVG en
    /// `achievements/`), tiene preferencia sobre el emoji.
    let icon: BloomIcon?
    let emoji: String
    let title: String
    let description: String
    let onDismiss: () -> Void

    init(
        icon: BloomIcon? = nil,
        emoji: String = "",
        title: String,
        description: String,
        onDismiss: @escaping () -> Void
    ) {
        self.icon = icon
        self.emoji = emoji
        self.title = title
        self.description = description
        self.onDismiss = onDismiss
    }

    @State private var offsetY: CGFloat = -140
    @State private var scale: CGFloat = 0.8
    @State private var opacity: CGFloat = 0

    var body: some View {
        HStack(spacing: Theme.Spacing.sm) {
            if let icon {
                BloomIconView(icon, size: 36)
            } else {
                Text(emoji)
                    .font(.system(size: 28))
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(Theme.Palette.neutral700)
                Text(description)
                    .font(.system(size: 12, design: .rounded))
                    .foregroundStyle(Theme.Palette.neutral500)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, Theme.Spacing.sm + 2)
        .padding(.horizontal, Theme.Spacing.md)
        .background(Theme.Palette.surface)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.lg)
                .strokeBorder(Theme.Palette.accent200, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .bloomShadow(.md)
        .scaleEffect(scale)
        .opacity(opacity)
        .offset(y: offsetY)
        .onAppear(perform: animate)
    }

    private func animate() {
        #if canImport(UIKit)
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        #endif
        withAnimation(.spring(response: 0.5, dampingFraction: 0.62)) {
            offsetY = 0
            scale = 1
            opacity = 1
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.9) {
            withAnimation(.easeIn(duration: 0.4)) {
                offsetY = -140
                scale = 0.8
                opacity = 0
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.4) {
            onDismiss()
        }
    }
}
