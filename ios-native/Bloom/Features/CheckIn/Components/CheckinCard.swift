import SwiftUI

/// Tarjeta resumen de un check-in en una lista.
/// Portado de `src/components/checkin/CheckinCard.tsx`.
struct CheckinCard: View {

    let checkin: CheckinEntry

    private var emotion: EmotionConfig {
        checkin.emotion.config
    }

    var body: some View {
        HStack(spacing: 0) {
            Rectangle()
                .fill(emotion.color)
                .frame(width: 4)

            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                header
                badges
                footer
            }
            .padding(Theme.Spacing.md)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.Palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
        .bloomShadow(.sm)
    }

    private var header: some View {
        HStack(spacing: Theme.Spacing.sm) {
            Text(emotion.emoji)
                .font(.system(size: 22))
                .frame(width: 40, height: 40)
                .background(emotion.color.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 1) {
                Text(emotion.label)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral800)
                Text(Strings.CheckIn.intensityLabel(checkin.emotionIntensity))
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.neutral400)
            }

            Spacer()

            Text(BloomDate.time(checkin.createdAt))
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral500)
                .padding(.horizontal, Theme.Spacing.sm)
                .padding(.vertical, 3)
                .background(Theme.Palette.neutral100)
                .clipShape(Capsule())
        }
    }

    private var badges: some View {
        HStack(spacing: Theme.Spacing.xs) {
            Badge(
                label: "😴 \(Strings.CheckIn.sleepLabel(checkin.sleepQuality))",
                color: Theme.Palette.info
            )
            Badge(
                label: "🍽️ \(Strings.CheckIn.hungerLabel(checkin.hungerLevel))",
                color: Theme.Palette.accent500
            )
            if let phase = checkin.cyclePhase, phase != .noAplica {
                Badge(
                    label: Strings.CheckIn.cycleLabel(phase),
                    color: Theme.Palette.primary300
                )
            }
        }
    }

    @ViewBuilder
    private var footer: some View {
        if !checkin.events.isEmpty || !checkin.notes.isEmpty {
            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Divider()
                if !checkin.events.isEmpty {
                    Text("📌 \(checkin.events.count) \(checkin.events.count == 1 ? "evento" : "eventos")")
                        .font(.caption)
                        .foregroundStyle(Theme.Palette.neutral500)
                }
                if !checkin.notes.isEmpty {
                    Text(checkin.notes)
                        .font(.caption)
                        .italic()
                        .foregroundStyle(Theme.Palette.neutral500)
                        .lineLimit(2)
                }
            }
        }
    }
}
