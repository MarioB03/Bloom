import SwiftUI

/// Cabecera de navegación de meses: flechas anterior/siguiente y el mes actual.
/// Portado de `src/components/calendar/MonthNavigator.tsx`.
struct MonthNavigator: View {

    /// Primer día del mes mostrado.
    let month: Date
    let onPrev: () -> Void
    let onNext: () -> Void

    var body: some View {
        HStack {
            navButton(systemName: "chevron.left", action: onPrev)
            Spacer()
            Text(BloomDate.monthYearLabel(month))
                .font(.displaySmall)
                .foregroundStyle(Theme.Palette.neutral800)
            Spacer()
            navButton(systemName: "chevron.right", action: onNext)
        }
        .padding(.vertical, Theme.Spacing.sm)
        .padding(.horizontal, Theme.Spacing.xs)
    }

    private func navButton(systemName: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(Theme.Palette.neutral600)
                .padding(Theme.Spacing.sm)
        }
        .buttonStyle(.plain)
    }
}
