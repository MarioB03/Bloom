import SwiftUI

/// Pestaña de registros emocionales ("Observar y describir").
/// Equivalente a `app/(tabs)/notas.tsx` → `app/registro-emocional/` en la app
/// React Native.
///
/// Divergencia de RN: la app RN crea los registros desde un CTA del home y los
/// lista mezclados con los check-ins en un buscador (`app/(tabs)/registros.tsx`).
/// Aquí la pestaña es autónoma: lista solo registros emocionales y tiene su
/// propio CTA de creación. El buscador combinado con filtros llegará con la
/// feature "Agenda y búsqueda".
struct NotesView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore

    @State private var registers: [EmotionalRegisterEntry] = []
    @State private var isLoading = true
    @State private var showingForm = false

    var body: some View {
        NavigationStack {
            ScreenWrapper {
                header
                newRegisterCard
                listSection
            }
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: String.self) { registerID in
                EmotionalRegisterDetailView(id: registerID) {
                    Task { await load() }
                }
            }
        }
        .sheet(isPresented: $showingForm) {
            EmotionalRegisterFormView {
                Task { await load() }
            }
        }
        .task { await load() }
    }

    // MARK: - Cabecera

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(Strings.EmotionalRegister.listTitle)
                .font(.displaySmall)
                .foregroundStyle(Theme.Palette.neutral800)
            Text(Strings.EmotionalRegister.listSubtitle)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - CTA de nuevo registro

    private var newRegisterCard: some View {
        Button {
            showingForm = true
        } label: {
            HStack(spacing: Theme.Spacing.md) {
                Text("🔍")
                    .font(.system(size: 22))
                    .frame(width: 44, height: 44)
                    .background(Color.white.opacity(0.2))
                    .clipShape(Circle())
                VStack(alignment: .leading, spacing: 2) {
                    Text(Strings.EmotionalRegister.newRegister)
                        .font(.bodyBold)
                        .foregroundStyle(.white)
                    Text(Strings.EmotionalRegister.newRegisterSubtitle)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.85))
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.85))
            }
            .padding(Theme.Spacing.md)
            .background(Theme.Palette.primary400)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
            .bloomShadow(.md)
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.impact(weight: .medium), trigger: showingForm)
    }

    // MARK: - Listado

    @ViewBuilder
    private var listSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text(Strings.EmotionalRegister.recentTitle)
                .font(.heading3)
                .foregroundStyle(Theme.Palette.neutral700)

            if isLoading {
                ProgressView()
                    .tint(Theme.Palette.primary400)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Theme.Spacing.xl)
            } else if registers.isEmpty {
                EmptyState(emoji: "🪞", message: Strings.EmotionalRegister.empty)
            } else {
                ForEach(registers) { register in
                    NavigationLink(value: register.id ?? "") {
                        EmotionalRegisterCard(register: register)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.top, Theme.Spacing.sm)
    }

    // MARK: - Datos

    private func load() async {
        guard let userID = auth.currentUserID else {
            isLoading = false
            return
        }
        do {
            registers = try await firestore.allEmotionalRegisters(userID: userID)
        } catch {
            // Se conserva el último estado conocido ante un fallo de red.
        }
        isLoading = false
    }
}
