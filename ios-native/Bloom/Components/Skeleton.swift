import SwiftUI

// MARK: - Primitiva

/// Caja gris con animación de pulso usada como bloque base de los skeletons.
/// Portada de `SkeletonBox` en `src/components/ui/Skeleton.tsx`.
struct SkeletonBox: View {

    let width: SkeletonDimension
    let height: CGFloat
    let cornerRadius: CGFloat

    init(width: SkeletonDimension = .fill, height: CGFloat = 16, cornerRadius: CGFloat = 8) {
        self.width = width
        self.height = height
        self.cornerRadius = cornerRadius
    }

    @State private var pulse: Bool = false

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .fill(Theme.Palette.neutral200)
            .frame(maxWidth: width.maxWidth, alignment: .leading)
            .frame(width: width.fixedWidth, height: height)
            .opacity(pulse ? 1 : 0.4)
            .onAppear {
                withAnimation(
                    .easeInOut(duration: 0.8).repeatForever(autoreverses: true)
                ) {
                    pulse = true
                }
            }
    }
}

/// Anchura del skeleton: fija en puntos o "ocupa el ancho disponible".
/// Equivalente al `width: number | '%'` de la versión RN.
enum SkeletonDimension {
    case fixed(CGFloat)
    case fill

    var fixedWidth: CGFloat? {
        if case .fixed(let value) = self { return value }
        return nil
    }

    var maxWidth: CGFloat? {
        if case .fill = self { return .infinity }
        return nil
    }
}

// MARK: - Variantes

/// Skeleton de una tarjeta de check-in/registro (icono + dos líneas + badge).
struct SkeletonCard: View {
    var body: some View {
        HStack(spacing: Theme.Spacing.sm) {
            SkeletonBox(width: .fixed(44), height: 44, cornerRadius: 14)
            VStack(alignment: .leading, spacing: 6) {
                SkeletonBox(height: 14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.trailing, 80)
                SkeletonBox(height: 12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.trailing, 140)
            }
            SkeletonBox(width: .fixed(50), height: 24, cornerRadius: 12)
        }
        .padding(Theme.Spacing.md)
        .background(Theme.Palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.lg)
                .strokeBorder(Theme.Palette.neutral100, lineWidth: 1)
        )
        .padding(.bottom, Theme.Spacing.sm)
    }
}

/// Fila de 3 tarjetas con un número y una etiqueta cada una (stats del perfil).
struct SkeletonStats: View {
    var body: some View {
        HStack(spacing: Theme.Spacing.sm) {
            ForEach(0..<3, id: \.self) { _ in
                VStack(spacing: 6) {
                    SkeletonBox(width: .fixed(48), height: 28, cornerRadius: 6)
                    SkeletonBox(width: .fixed(56), height: 10, cornerRadius: 4)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, Theme.Spacing.md)
                .background(Theme.Palette.surface)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.Radius.lg)
                        .strokeBorder(Theme.Palette.neutral100, lineWidth: 1)
                )
            }
        }
        .padding(.bottom, Theme.Spacing.md)
    }
}

/// Skeleton de la pestaña Registros (título, búsqueda, segmentos, varias tarjetas).
struct SkeletonRegistros: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            SkeletonBox(height: 24)
                .padding(.trailing, 160)
                .padding(.bottom, Theme.Spacing.sm)
            SkeletonBox(height: 14)
                .padding(.trailing, 100)
                .padding(.bottom, Theme.Spacing.md)
            SkeletonBox(height: 44, cornerRadius: Theme.Radius.md)
                .padding(.bottom, 12)
            SkeletonBox(height: 40, cornerRadius: Theme.Radius.lg)
                .padding(.bottom, Theme.Spacing.md)
            ForEach(0..<4, id: \.self) { _ in
                SkeletonCard()
            }
        }
        .padding(.horizontal, Theme.Spacing.md)
        .padding(.top, Theme.Spacing.md)
    }
}

/// Skeleton de la pestaña Tú/Perfil (avatar centrado, stats, lista de filas).
struct SkeletonProfile: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(spacing: 0) {
                SkeletonBox(width: .fixed(80), height: 80, cornerRadius: 40)
                    .padding(.bottom, 12)
                SkeletonBox(width: .fixed(120), height: 20)
                    .padding(.bottom, 6)
                SkeletonBox(width: .fixed(160), height: 14)
            }
            .frame(maxWidth: .infinity)
            .padding(.top, Theme.Spacing.lg)
            .padding(.bottom, Theme.Spacing.lg)

            SkeletonStats()

            VStack(spacing: 0) {
                ForEach(0..<4, id: \.self) { index in
                    if index > 0 {
                        Rectangle()
                            .fill(Theme.Palette.neutral100)
                            .frame(height: 1)
                    }
                    HStack(spacing: Theme.Spacing.sm) {
                        SkeletonBox(width: .fixed(34), height: 34, cornerRadius: 10)
                        VStack(alignment: .leading, spacing: 4) {
                            SkeletonBox(height: 14)
                                .padding(.trailing, 100)
                            SkeletonBox(height: 10)
                                .padding(.trailing, 160)
                        }
                    }
                    .padding(.vertical, Theme.Spacing.sm)
                }
            }
            .padding(Theme.Spacing.md)
            .background(Theme.Palette.surface)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.lg)
                    .strokeBorder(Theme.Palette.neutral100, lineWidth: 1)
            )
        }
        .padding(.horizontal, Theme.Spacing.md)
        .padding(.top, Theme.Spacing.md)
    }
}

/// Skeleton compacto de la sección "Registros de hoy" del home (título + 2 cards).
struct SkeletonHomeRecords: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            SkeletonBox(height: 18)
                .padding(.trailing, 200)
                .padding(.bottom, 12)
            SkeletonCard()
            SkeletonCard()
        }
    }
}

/// Skeleton de la pantalla modal de Agenda (título serif, búsqueda, segmentos,
/// badge de fecha y varias tarjetas).
struct SkeletonAgenda: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            SkeletonBox(height: 28)
                .padding(.trailing, 180)
                .padding(.bottom, 6)
            SkeletonBox(height: 14)
                .padding(.trailing, 140)
                .padding(.bottom, Theme.Spacing.md)
            SkeletonBox(height: 44, cornerRadius: Theme.Radius.md)
                .padding(.bottom, 12)
            SkeletonBox(height: 40, cornerRadius: Theme.Radius.lg)
                .padding(.bottom, Theme.Spacing.md)
            HStack {
                Spacer()
                SkeletonBox(width: .fixed(70), height: 24, cornerRadius: 12)
                Spacer()
            }
            .padding(.bottom, 12)
            ForEach(0..<3, id: \.self) { _ in
                SkeletonCard()
            }
        }
        .padding(.horizontal, Theme.Spacing.md)
        .padding(.top, Theme.Spacing.md)
    }
}
