import SwiftUI

/// Detalle de una categoría de habilidades: cabecera, filtro por tipo
/// (todas / ejercicios / artículos) y el listado de habilidades.
/// Portado de `app/habilidades/categoria/[id].tsx`.
struct SkillCategoryDetailView: View {

    let category: SkillCategory

    private enum TypeFilter: CaseIterable {
        case all, exercise, article

        var label: String {
            switch self {
            case .all: Strings.Skills.allTypes
            case .exercise: Strings.Skills.exercises
            case .article: Strings.Skills.articles
            }
        }
    }

    @State private var filter: TypeFilter = .all

    private var meta: SkillCategoryMeta { category.meta }

    private var skills: [Skill] {
        let all = SkillCatalog.skills(in: category)
        switch filter {
        case .all: return all
        case .exercise: return all.filter { $0.type == .exercise }
        case .article: return all.filter { $0.type == .article }
        }
    }

    var body: some View {
        ScreenWrapper {
            categoryInfo
            filterTabs
            ForEach(skills) { skill in
                NavigationLink(value: SkillsDestination.skill(id: skill.id)) {
                    SkillCard(skill: skill)
                }
                .buttonStyle(.plain)
            }
        }
        .navigationTitle(meta.title)
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Cabecera

    private var categoryInfo: some View {
        VStack(spacing: Theme.Spacing.sm) {
            Text(meta.emoji)
                .font(.system(size: 48))
            Text(meta.title)
                .font(.displaySmall)
                .foregroundStyle(Theme.Palette.neutral800)
            Text(meta.description)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity)
        .padding(.bottom, Theme.Spacing.sm)
    }

    // MARK: - Filtro por tipo

    private var filterTabs: some View {
        HStack(spacing: Theme.Spacing.sm) {
            ForEach(TypeFilter.allCases, id: \.self) { option in
                let isActive = filter == option
                Button {
                    filter = option
                } label: {
                    Text(option.label)
                        .font(.tag)
                        .foregroundStyle(isActive ? meta.color : Theme.Palette.neutral500)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Theme.Spacing.sm)
                        .background(isActive ? meta.color.opacity(0.13) : Theme.Palette.surface)
                        .overlay(
                            Capsule().strokeBorder(
                                isActive ? meta.color : Theme.Palette.neutral200,
                                lineWidth: 1
                            )
                        )
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .sensoryFeedback(.selection, trigger: filter)
            }
        }
    }
}

#Preview {
    NavigationStack {
        SkillCategoryDetailView(category: .mindfulness)
    }
}
