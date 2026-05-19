import SwiftUI

/// Selector de fase del ciclo menstrual. Volver a pulsar la fase activa la
/// deselecciona. Portado de `src/components/checkin/CycleTracker.tsx`.
struct CycleTracker: View {

    @Binding var phase: CyclePhase?

    private static let emojis: [CyclePhase: String] = [
        .menstruacion: "🔴",
        .folicular: "🌱",
        .ovulacion: "🌸",
        .lutea: "🌙",
        .noAplica: "➖",
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text(Strings.CheckIn.cycle)
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.neutral700)

            HStack(spacing: Theme.Spacing.xs) {
                ForEach(CyclePhase.allCases, id: \.self) { item in
                    phaseButton(item)
                }
            }
        }
    }

    private func phaseButton(_ item: CyclePhase) -> some View {
        let isSelected = phase == item
        return Button {
            phase = isSelected ? nil : item
        } label: {
            VStack(spacing: 2) {
                Text(Self.emojis[item] ?? "")
                    .font(.system(size: 20))
                Text(Strings.CheckIn.cycleLabel(item))
                    .font(.smallText)
                    .foregroundStyle(isSelected ? Theme.Palette.primary500 : Theme.Palette.neutral600)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.sm)
            .padding(.horizontal, Theme.Spacing.xs)
            .background(isSelected ? Theme.Palette.primary50 : Theme.Palette.surface)
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
        .sensoryFeedback(.selection, trigger: phase)
    }
}
