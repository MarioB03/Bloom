import SwiftUI

/// Tarjeta resumen de un registro emocional en una lista.
/// Portado de `src/components/checkin/EmotionalRegisterCard.tsx`.
struct EmotionalRegisterCard: View {

    let register: EmotionalRegisterEntry

    /// Configuración de la emoción de la paleta, o `nil` si fue personalizada.
    private var emotion: EmotionConfig? { register.emotion?.config }
    private var emotionLabel: String { emotion?.label ?? register.emotionCustom }
    private var emotionEmoji: String { emotion?.emoji ?? "🔍" }
    private var emotionColor: Color { emotion?.color ?? Theme.Palette.primary400 }

    var body: some View {
        HStack(spacing: 0) {
            Rectangle()
                .fill(emotionColor)
                .frame(width: 4)

            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                header
                typeBadge
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
            Text(emotionEmoji)
                .font(.system(size: 22))
                .frame(width: 40, height: 40)
                .background(emotionColor.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 1) {
                Text(emotionLabel)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral800)
                Text(Strings.EmotionalRegister.intensityValue(register.intensity))
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.neutral400)
            }

            Spacer()

            Text(BloomDate.time(register.createdAt))
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral500)
                .padding(.horizontal, Theme.Spacing.sm)
                .padding(.vertical, 3)
                .background(Theme.Palette.neutral100)
                .clipShape(Capsule())
        }
    }

    private var typeBadge: some View {
        Text(Strings.EmotionalRegister.typeLabel)
            .font(.smallText)
            .foregroundStyle(Theme.Palette.primary400)
            .padding(.horizontal, Theme.Spacing.sm)
            .padding(.vertical, 3)
            .background(Theme.Palette.primary50)
            .clipShape(Capsule())
    }
}
