import SwiftUI

/// Editor del plan de seguridad personal: cinco secciones plegables (señales de
/// alerta, estrategias de afrontamiento, contactos de confianza, pasos
/// personales y líneas de crisis) con guardado automático.
/// Portado de `app/plan-seguridad.tsx`.
///
/// Punto de entrada: en la app RN el plan vive en la pestaña de perfil (aún no
/// portada); aquí se accede desde un botón en la cabecera de la pestaña
/// Habilidades. No hay botón de guardar: cada cambio se persiste con un rebote
/// de 1,5 s, igual que en RN.
///
/// Divergencia de RN: al salir de la pantalla se vuelca el guardado pendiente
/// en lugar de descartarlo. La app RN hace `clearTimeout` en el desmontaje y
/// pierde el último cambio si no han pasado los 1,5 s.
struct SafetyPlanView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore

    @State private var plan = SafetyPlan.empty
    @State private var expandedSections: Set<Section> = [.warningSigns]
    @State private var isLoading = true
    @State private var pendingSave = false
    @State private var saveTask: Task<Void, Never>?

    /// Las cinco secciones del plan, en orden de aparición.
    private enum Section: CaseIterable {
        case warningSigns, copingStrategies, trustedContacts, personalSteps, crisisHotlines

        var icon: String {
            switch self {
            case .warningSigns: "exclamationmark.circle"
            case .copingStrategies: "lightbulb"
            case .trustedContacts: "person.2"
            case .personalSteps: "list.bullet"
            case .crisisHotlines: "phone"
            }
        }

        var title: String {
            switch self {
            case .warningSigns: Strings.SafetyPlan.warningSigns
            case .copingStrategies: Strings.SafetyPlan.copingStrategies
            case .trustedContacts: Strings.SafetyPlan.trustedContacts
            case .personalSteps: Strings.SafetyPlan.personalSteps
            case .crisisHotlines: Strings.SafetyPlan.crisisHotlines
            }
        }

        var description: String {
            switch self {
            case .warningSigns: Strings.SafetyPlan.warningSignsDesc
            case .copingStrategies: Strings.SafetyPlan.copingStrategiesDesc
            case .trustedContacts: Strings.SafetyPlan.trustedContactsDesc
            case .personalSteps: Strings.SafetyPlan.personalStepsDesc
            case .crisisHotlines: Strings.SafetyPlan.crisisHotlinesDesc
            }
        }
    }

    var body: some View {
        ScreenWrapper {
            hero
            if isLoading {
                ProgressView()
                    .tint(Theme.Palette.primary400)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Theme.Spacing.xxl)
            } else {
                ForEach(Section.allCases, id: \.self) { section in
                    sectionCard(section)
                }
                disclaimer
            }
        }
        .navigationTitle(Strings.SafetyPlan.title)
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .onChange(of: plan) { scheduleSave() }
        .onDisappear { flushPendingSave() }
    }

    // MARK: - Cabecera

    private var hero: some View {
        VStack(spacing: Theme.Spacing.xs) {
            Text("🛡️")
                .font(.system(size: 44))
            Text(Strings.SafetyPlan.subtitle)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, Theme.Spacing.sm)
    }

    // MARK: - Sección plegable

    private func sectionCard(_ section: Section) -> some View {
        let isExpanded = expandedSections.contains(section)
        return BloomCard {
            VStack(spacing: 0) {
                Button {
                    toggle(section)
                } label: {
                    HStack(spacing: Theme.Spacing.sm) {
                        Image(systemName: section.icon)
                            .font(.system(size: 16))
                            .foregroundStyle(Theme.Palette.secondary500)
                            .frame(width: 34, height: 34)
                            .background(Theme.Palette.secondary50)
                            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.sm))

                        VStack(alignment: .leading, spacing: 1) {
                            Text(section.title)
                                .font(.bodyBold)
                                .foregroundStyle(Theme.Palette.neutral700)
                            Text(section.description)
                                .font(.smallText)
                                .foregroundStyle(Theme.Palette.neutral400)
                                .multilineTextAlignment(.leading)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)

                        Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Theme.Palette.neutral400)
                    }
                }
                .buttonStyle(.plain)

                if isExpanded {
                    Divider()
                        .padding(.vertical, Theme.Spacing.md)
                    sectionContent(section)
                }
            }
        }
    }

    @ViewBuilder
    private func sectionContent(_ section: Section) -> some View {
        switch section {
        case .warningSigns:
            EditableListEditor(
                items: plan.warningSigns,
                placeholder: Strings.SafetyPlan.warningSignPlaceholder
            ) { plan.warningSigns = $0 }
        case .copingStrategies:
            EditableListEditor(
                items: plan.copingStrategies,
                placeholder: Strings.SafetyPlan.copingStrategyPlaceholder
            ) { plan.copingStrategies = $0 }
        case .trustedContacts:
            ContactListEditor(contacts: plan.trustedContacts) { plan.trustedContacts = $0 }
        case .personalSteps:
            EditableListEditor(
                items: plan.personalSteps,
                placeholder: Strings.SafetyPlan.personalStepPlaceholder
            ) { plan.personalSteps = $0 }
        case .crisisHotlines:
            CrisisHotlineListView()
        }
    }

    // MARK: - Aviso

    private var disclaimer: some View {
        HStack(alignment: .top, spacing: Theme.Spacing.sm) {
            Image(systemName: "info.circle")
                .font(.system(size: 14))
                .foregroundStyle(Theme.Palette.neutral400)
            Text(Strings.SafetyPlan.disclaimer)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral400)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, Theme.Spacing.md)
    }

    // MARK: - Interacción

    private func toggle(_ section: Section) {
        withAnimation(.snappy(duration: 0.22)) {
            if expandedSections.contains(section) {
                expandedSections.remove(section)
            } else {
                expandedSections.insert(section)
            }
        }
    }

    // MARK: - Datos

    private func load() async {
        guard let userID = auth.currentUserID else {
            isLoading = false
            return
        }
        do {
            if let saved = try await firestore.safetyPlan(userID: userID) {
                plan = saved
            }
        } catch {
            // Se arranca con un plan vacío ante un fallo de red.
        }
        isLoading = false
    }

    /// Reprograma el guardado con rebote de 1,5 s. Ignora el cambio de `plan`
    /// provocado por la carga inicial.
    private func scheduleSave() {
        guard !isLoading else { return }
        pendingSave = true
        saveTask?.cancel()
        let snapshot = plan
        saveTask = Task {
            try? await Task.sleep(for: .seconds(1.5))
            guard !Task.isCancelled else { return }
            persist(snapshot)
        }
    }

    /// Al abandonar la pantalla, vuelca de inmediato cualquier guardado pendiente.
    private func flushPendingSave() {
        saveTask?.cancel()
        guard pendingSave else { return }
        persist(plan)
    }

    private func persist(_ snapshot: SafetyPlan) {
        guard let userID = auth.currentUserID else { return }
        do {
            try firestore.saveSafetyPlan(snapshot, userID: userID)
            pendingSave = false
        } catch {
            // Se mantiene `pendingSave` para reintentar en el próximo cambio.
        }
    }
}

#Preview {
    NavigationStack {
        SafetyPlanView()
    }
    .environment(AuthService())
    .environment(FirestoreService())
}
