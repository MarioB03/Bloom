import SwiftUI

/// Fila del historial de práctica: emoji de la categoría, título de la
/// habilidad, categoría + duración y la hora de finalización.
/// Portado de `src/components/skills/PracticeHistoryCard.tsx`.
struct PracticeHistoryCard: View {

    let practice: SkillPractice

    private var category: SkillCategoryMeta { practice.category.meta }

    private var durationLabel: String {
        let minutes = practice.durationSeconds / 60
        let seconds = practice.durationSeconds % 60
        return minutes > 0 ? "\(minutes)m \(seconds)s" : "\(seconds)s"
    }

    private var meta: String {
        practice.durationSeconds > 0
            ? "\(category.title) · \(durationLabel)"
            : category.title
    }

    var body: some View {
        HStack(spacing: Theme.Spacing.sm) {
            Text(category.emoji)
                .font(.system(size: 24))

            VStack(alignment: .leading, spacing: 2) {
                Text(practice.skillTitle)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)
                Text(meta)
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.neutral500)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Text(BloomDate.time(practice.completedAt))
                .font(.caption)
                .foregroundStyle(Theme.Palette.neutral400)
        }
        .padding(Theme.Spacing.md)
        .background(Theme.Palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .bloomShadow(.sm)
    }
}
