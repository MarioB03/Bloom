import SwiftUI

/// Tarjeta de una habilidad en un listado: icono, tipo, título, descripción y
/// duración. Presentacional — la navegación la pone quien la usa, envolviéndola
/// en un `NavigationLink` (igual que `CheckinCard` en el diario).
/// Portado de `src/components/skills/SkillCard.tsx`.
struct SkillCard: View {

    let skill: Skill

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack {
                Text(skill.icon)
                    .font(.system(size: 28))
                Spacer()
                SkillTypeBadge(type: skill.type)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(skill.title)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)
                Text(skill.description)
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.neutral500)
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            HStack {
                HStack(spacing: 4) {
                    Image(systemName: "clock")
                        .font(.system(size: 12))
                    Text(skill.durationLabel)
                        .font(.smallText)
                }
                .foregroundStyle(Theme.Palette.neutral400)
                Spacer()
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
    ScrollView {
        VStack(spacing: Theme.Spacing.sm) {
            SkillCard(skill: SkillCatalog.all[0])
            SkillCard(skill: SkillCatalog.all[1])
        }
        .padding()
    }
    .background(Theme.Palette.background)
}
