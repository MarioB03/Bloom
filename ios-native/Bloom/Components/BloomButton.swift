import SwiftUI

/// Botón base de Bloom. Portado de `src/components/ui/Button.tsx`.
///
/// Variantes de color, tres tamaños, estado de carga y animación de
/// pulsación (escala con muelle + haptic ligero).
struct BloomButton: View {

    enum Variant {
        case primary, secondary, outline, ghost
    }

    enum Size {
        case sm, md, lg
    }

    let title: String
    var variant: Variant = .primary
    var size: Size = .md
    var loading = false
    var isEnabled = true
    var icon: Image?
    let action: () -> Void

    private var isDisabled: Bool { !isEnabled || loading }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if loading {
                    ProgressView()
                        .tint(foregroundColor)
                } else {
                    if let icon {
                        icon
                    }
                    Text(title)
                        .font(font)
                        .kerning(0.3)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, verticalPadding)
            .padding(.horizontal, horizontalPadding)
            .foregroundStyle(foregroundColor)
            .background(backgroundColor)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.lg)
                    .strokeBorder(borderColor, lineWidth: 1.5)
            )
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        }
        .buttonStyle(PressableButtonStyle())
        .disabled(isDisabled)
        .opacity(isDisabled ? 0.5 : 1)
        .modifier(WarmShadowModifier(active: variant == .primary))
    }

    // MARK: - Estilo derivado de la variante

    private var backgroundColor: Color {
        switch variant {
        case .primary: Theme.Palette.primary400
        case .secondary: Theme.Palette.primary50
        case .outline, .ghost: .clear
        }
    }

    private var foregroundColor: Color {
        switch variant {
        case .primary: Theme.Palette.neutral50
        case .secondary, .outline, .ghost: Theme.Palette.primary500
        }
    }

    private var borderColor: Color {
        variant == .outline ? Theme.Palette.primary200 : .clear
    }

    private var font: Font {
        switch size {
        case .sm: .bodyBold.weight(.semibold)
        case .md: .bodyBold
        case .lg: .heading3
        }
    }

    private var verticalPadding: CGFloat {
        switch size {
        case .sm: Theme.Spacing.sm
        case .md: Theme.Spacing.md - 2
        case .lg: Theme.Spacing.md + 2
        }
    }

    private var horizontalPadding: CGFloat {
        switch size {
        case .sm: Theme.Spacing.md
        case .md: Theme.Spacing.lg
        case .lg: Theme.Spacing.xl
        }
    }
}

/// Escala el botón con un muelle y dispara un haptic ligero al pulsar.
/// Equivalente al `withSpring` + `Haptics.impactAsync` de la versión RN.
private struct PressableButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: configuration.isPressed)
            .sensoryFeedback(.impact(weight: .light), trigger: configuration.isPressed) { _, pressed in
                pressed
            }
    }
}

/// Aplica la sombra cálida del sistema de diseño solo a la variante primaria.
private struct WarmShadowModifier: ViewModifier {
    let active: Bool

    func body(content: Content) -> some View {
        if active {
            content.bloomShadow(.warm)
        } else {
            content
        }
    }
}

#Preview {
    VStack(spacing: Theme.Spacing.md) {
        BloomButton(title: "Entrar", variant: .primary, size: .lg) {}
        BloomButton(title: "Registrarse", variant: .secondary) {}
        BloomButton(title: "Cancelar", variant: .outline) {}
        BloomButton(title: "Cargando", loading: true) {}
        BloomButton(title: "Deshabilitado", isEnabled: false) {}
    }
    .padding()
    .background(Theme.Palette.background)
}
