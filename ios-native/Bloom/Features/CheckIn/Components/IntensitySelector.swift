import SwiftUI

/// Selector de nivel 1–5 con etiqueta y descripción del valor activo.
/// Portado de `src/components/checkin/IntensitySlider.tsx`.
struct IntensitySelector: View {

    let label: String
    @Binding var value: Int
    /// Texto descriptivo del valor seleccionado (p. ej. "Media", "Bien").
    var valueLabel: (Int) -> String

    private let range = 1...5

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text(label)
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.neutral700)

            HStack(spacing: Theme.Spacing.sm) {
                ForEach(range, id: \.self) { level in
                    levelButton(level)
                }
            }

            Text(valueLabel(value))
                .font(.caption)
                .foregroundStyle(Theme.Palette.neutral500)
                .frame(maxWidth: .infinity, alignment: .center)
        }
    }

    private func levelButton(_ level: Int) -> some View {
        let isSelected = value == level
        return Button {
            value = level
        } label: {
            Text("\(level)")
                .font(.bodyBold)
                .foregroundStyle(isSelected ? Theme.Palette.neutral50 : Theme.Palette.neutral600)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Theme.Spacing.sm + 2)
                .background(isSelected ? Theme.Palette.primary500 : Theme.Palette.surface)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.sm))
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.Radius.sm)
                        .strokeBorder(
                            isSelected ? Theme.Palette.primary500 : Theme.Palette.neutral200,
                            lineWidth: 1
                        )
                )
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.selection, trigger: value)
    }
}
