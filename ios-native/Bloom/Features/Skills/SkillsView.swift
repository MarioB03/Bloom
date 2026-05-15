import SwiftUI

/// Destino de navegación dentro de la pestaña Habilidades.
enum SkillsDestination: Hashable {
    case category(SkillCategory)
    case skill(id: String)
    case history
    case safetyPlan
}

/// Pestaña "Habilidades": catálogo de técnicas DBT agrupadas por categoría,
/// con filtro por emoción y acceso al historial de práctica.
/// Portado de `app/(tabs)/habilidades.tsx`.
///
/// Divergencia de RN: en la app React Native el historial de práctica
/// (`app/habilidades/historial.tsx`) existe pero ninguna pantalla navega a él.
/// Aquí se añade un acceso desde la cabecera para que la feature sea usable.
///
/// La cabecera incluye además el acceso al plan de seguridad: en la app RN vive
/// en la pestaña de perfil (aún no portada) y aquí se acomoda junto al resto de
/// herramientas de bienestar.
struct SkillsView: View {
    var body: some View {
        NavigationStack {
            SkillsCatalogView()
                .navigationDestination(for: SkillsDestination.self) { destination in
                    switch destination {
                    case .category(let category):
                        SkillCategoryDetailView(category: category)
                    case .skill(let id):
                        SkillDetailView(skillID: id)
                    case .history:
                        PracticeHistoryView()
                    case .safetyPlan:
                        SafetyPlanView()
                    }
                }
        }
    }
}

/// Contenido de la pestaña: cabecera, filtro por emoción y, según haya o no
/// emoción seleccionada, el listado de categorías o las habilidades sugeridas.
private struct SkillsCatalogView: View {

    @State private var selectedEmotion: EmotionID?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                header
                emotionFilter
                if let selectedEmotion {
                    suggestedSkills(for: selectedEmotion)
                } else {
                    categoryList
                }
            }
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.top, Theme.Spacing.md)
            .padding(.bottom, Theme.Spacing.xl)
        }
        .scrollIndicators(.hidden)
        .background(Theme.Palette.background)
        .toolbar(.hidden, for: .navigationBar)
    }

    // MARK: - Cabecera

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text(Strings.Skills.title)
                    .font(.displaySmall)
                    .foregroundStyle(Theme.Palette.neutral800)
                Text(Strings.Skills.subtitle)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral500)
            }
            Spacer()
            HStack(spacing: Theme.Spacing.xs) {
                NavigationLink(value: SkillsDestination.safetyPlan) {
                    Image(systemName: "shield")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(Theme.Palette.neutral600)
                        .frame(width: 40, height: 40)
                        .background(Theme.Palette.neutral100)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)

                NavigationLink(value: SkillsDestination.history) {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(Theme.Palette.neutral600)
                        .frame(width: 40, height: 40)
                        .background(Theme.Palette.neutral100)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Filtro por emoción

    private var emotionFilter: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text(Strings.Skills.filterByEmotion)
                .font(.heading3)
                .foregroundStyle(Theme.Palette.neutral700)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Theme.Spacing.xs) {
                    ForEach(EmotionConfig.ordered) { emotion in
                        emotionChip(emotion)
                    }
                }
            }
        }
    }

    private func emotionChip(_ emotion: EmotionConfig) -> some View {
        let isSelected = selectedEmotion == emotion.id
        return Button {
            selectedEmotion = isSelected ? nil : emotion.id
        } label: {
            HStack(spacing: 4) {
                BloomIconView(emotion.icon, size: 16)
                Text(emotion.label)
                    .font(.tag)
            }
            .foregroundStyle(isSelected ? emotion.color : Theme.Palette.neutral600)
            .padding(.horizontal, Theme.Spacing.sm + 2)
            .padding(.vertical, 6)
            .background(isSelected ? emotion.color.opacity(0.13) : Theme.Palette.surface)
            .overlay(
                Capsule().strokeBorder(
                    isSelected ? emotion.color : Theme.Palette.neutral200,
                    lineWidth: 1
                )
            )
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.selection, trigger: selectedEmotion)
    }

    // MARK: - Listados

    private var categoryList: some View {
        ForEach(SkillCatalog.categories) { category in
            NavigationLink(value: SkillsDestination.category(category.id)) {
                CategoryCard(
                    category: category,
                    skillCount: SkillCatalog.skills(in: category.id).count
                )
            }
            .buttonStyle(.plain)
        }
    }

    @ViewBuilder
    private func suggestedSkills(for emotion: EmotionID) -> some View {
        let skills = SkillCatalog.skills(forEmotion: emotion)
        Text(Strings.Skills.suggestedForYou)
            .font(.heading3)
            .foregroundStyle(Theme.Palette.neutral700)

        if skills.isEmpty {
            EmptyState(emoji: "🌿", message: Strings.Skills.noSkills)
        } else {
            ForEach(skills) { skill in
                NavigationLink(value: SkillsDestination.skill(id: skill.id)) {
                    SkillCard(skill: skill)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

#Preview {
    SkillsView()
}
