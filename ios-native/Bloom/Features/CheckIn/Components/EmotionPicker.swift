import SwiftUI

/// Selector de emoción en rejilla de 3 columnas.
/// Portado de `src/components/checkin/EmotionPicker.tsx`.
struct EmotionPicker: View {

    @Binding var selected: EmotionID?

    private let columns = Array(
        repeating: GridItem(.flexible(), spacing: Theme.Spacing.sm),
        count: 3
    )

    var body: some View {
        LazyVGrid(columns: columns, spacing: Theme.Spacing.sm) {
            ForEach(EmotionConfig.ordered) { emotion in
                EmotionCell(
                    emotion: emotion,
                    isSelected: selected == emotion.id
                ) {
                    selected = emotion.id
                }
            }
        }
    }
}

private struct EmotionCell: View {

    let emotion: EmotionConfig
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: Theme.Spacing.xs) {
                BloomIconView(emotion.icon, size: isSelected ? 44 : 36)
                Text(emotion.label)
                    .font(.caption)
                    .foregroundStyle(isSelected ? emotion.color : Theme.Palette.neutral600)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.md)
            .padding(.horizontal, Theme.Spacing.xs)
            .background(isSelected ? emotion.color.opacity(0.12) : Theme.Palette.surface)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.md)
                    .strokeBorder(
                        isSelected ? emotion.color : Theme.Palette.neutral200,
                        lineWidth: isSelected ? 2 : 1
                    )
            )
            .scaleEffect(isSelected ? 1.04 : 1)
        }
        .buttonStyle(.plain)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isSelected)
        .sensoryFeedback(.selection, trigger: isSelected)
    }
}
