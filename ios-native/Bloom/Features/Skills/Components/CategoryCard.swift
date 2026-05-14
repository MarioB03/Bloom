import SwiftUI

/// Fila de una categoría de habilidades: icono coloreado, título, descripción y
/// número de habilidades. Presentacional — quien la usa la envuelve en un
/// `NavigationLink`. Portado de `src/components/skills/CategoryCard.tsx`.
struct CategoryCard: View {

    let category: SkillCategoryMeta
    let skillCount: Int

    var body: some View {
        HStack(spacing: Theme.Spacing.md) {
            Text(category.emoji)
                .font(.system(size: 24))
                .frame(width: 48, height: 48)
                .background(category.color.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))

            VStack(alignment: .leading, spacing: 2) {
                Text(category.title)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)
                Text(category.description)
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.neutral500)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: Theme.Spacing.xs) {
                Text("\(skillCount)")
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.neutral400)
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.Palette.neutral400)
            }
        }
        .padding(Theme.Spacing.md)
        .background(Theme.Palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
        .bloomShadow(.sm)
    }
}

#Preview {
    VStack(spacing: Theme.Spacing.sm) {
        ForEach(SkillCatalog.categories) { category in
            CategoryCard(
                category: category,
                skillCount: SkillCatalog.skills(in: category.id).count
            )
        }
    }
    .padding()
    .background(Theme.Palette.background)
}
