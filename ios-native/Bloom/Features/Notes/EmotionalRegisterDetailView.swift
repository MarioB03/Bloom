import SwiftUI

/// Detalle de un registro emocional: emoción, intensidad y los campos de la
/// técnica "Observar y describir" que se hayan rellenado.
/// Portado de `app/registro-emocional/[id].tsx`.
///
/// Modo solo lectura: si `ownerID` no es `nil`, el detalle se carga del
/// dueño compartido y se ocultan los botones de editar y eliminar
/// (equivalente al parámetro `?owner=` de la app RN).
struct EmotionalRegisterDetailView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore
    @Environment(\.dismiss) private var dismiss

    let id: String
    /// Si no es `nil`, la vista se carga del dueño compartido y se oculta la
    /// edición/borrado.
    var ownerID: String? = nil
    /// Se invoca cuando el registro se edita o se elimina, para recargar la
    /// pantalla origen.
    let onChanged: () -> Void

    private var isReadOnly: Bool { ownerID != nil }

    @State private var register: EmotionalRegisterEntry?
    @State private var isLoading = true
    @State private var showingEditForm = false
    @State private var showingDeleteConfirm = false

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
                    .tint(Theme.Palette.primary400)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Theme.Palette.background)
            } else if let register {
                content(register)
            } else {
                notFound
            }
        }
        .navigationTitle(Strings.EmotionalRegister.detailTitle)
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .sheet(isPresented: $showingEditForm) {
            if let register {
                EmotionalRegisterFormView(entryToEdit: register) {
                    onChanged()
                    Task { await load() }
                }
            }
        }
        .confirmationDialog(
            Strings.EmotionalRegister.deleteTitle,
            isPresented: $showingDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button(Strings.Common.delete, role: .destructive) { delete() }
            Button(Strings.Common.cancel, role: .cancel) {}
        } message: {
            Text(Strings.EmotionalRegister.deleteMessage)
        }
    }

    // MARK: - Contenido

    private func content(_ register: EmotionalRegisterEntry) -> some View {
        ScreenWrapper {
            heroCard(register)
            ForEach(detailFields(register), id: \.label) { field in
                fieldCard(label: field.label, value: field.value)
            }
        }
        .toolbar {
            if !isReadOnly {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        showingEditForm = true
                    } label: {
                        Image(systemName: "square.and.pencil")
                    }
                    Button(role: .destructive) {
                        showingDeleteConfirm = true
                    } label: {
                        Image(systemName: "trash")
                    }
                }
            }
        }
    }

    private func heroCard(_ register: EmotionalRegisterEntry) -> some View {
        let emotion = register.emotion?.config
        let label = emotion?.label ?? register.emotionCustom
        let emoji = emotion?.emoji ?? "🔍"
        let color = emotion?.color ?? Theme.Palette.primary400

        return BloomCard(style: .elevated) {
            VStack(spacing: Theme.Spacing.sm) {
                Text(emoji)
                    .font(.system(size: 42))
                    .frame(width: 80, height: 80)
                    .background(color.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 24))

                Text(label)
                    .font(.displaySmall)
                    .foregroundStyle(color)

                Text("\(Strings.EmotionalRegister.intensityShort): \(Strings.EmotionalRegister.intensityValue(register.intensity))")
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral500)

                HStack(spacing: Theme.Spacing.sm) {
                    dateBadge(icon: "calendar", text: BloomDate.displayDate(register.createdAt))
                    dateBadge(icon: "clock", text: BloomDate.time(register.createdAt))
                }
                .padding(.top, Theme.Spacing.xs)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.lg)
        }
    }

    private func dateBadge(icon: String, text: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 12))
            Text(text)
                .font(.caption)
        }
        .foregroundStyle(Theme.Palette.neutral500)
        .padding(.horizontal, Theme.Spacing.sm + 2)
        .padding(.vertical, 4)
        .background(Theme.Palette.neutral100)
        .clipShape(Capsule())
    }

    private func fieldCard(label: String, value: String) -> some View {
        BloomCard {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text(label)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)
                Text(value)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral600)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(Theme.Spacing.md)
                    .background(Theme.Palette.neutral50)
                    .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
            }
        }
    }

    /// Campos de la técnica con valor — los vacíos no se muestran (igual que RN).
    private func detailFields(_ register: EmotionalRegisterEntry) -> [(label: String, value: String)] {
        let s = Strings.EmotionalRegister.self
        return [
            (s.vulnerability, register.vulnerability),
            (s.trigger, register.trigger),
            (s.interpretations, register.interpretations),
            (s.internalSensations, register.internalSensations),
            (s.externalLanguage, register.externalLanguage),
            (s.impulses, register.impulses),
            (s.behavior, register.behavior),
            (s.consequences, register.consequences),
            (s.emotionFunction, register.emotionFunction),
        ].filter { !$0.value.isEmpty }
    }

    private var notFound: some View {
        VStack(spacing: Theme.Spacing.md) {
            Text("🔍")
                .font(.system(size: 48))
            Text(Strings.EmotionalRegister.notFound)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
            BloomButton(title: Strings.Common.back, variant: .outline) {
                dismiss()
            }
            .fixedSize()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.Palette.background)
    }

    // MARK: - Datos

    private func load() async {
        guard let userID = ownerID ?? auth.currentUserID else {
            isLoading = false
            return
        }
        do {
            register = try await firestore.emotionalRegister(id: id, userID: userID)
        } catch {
            register = nil
        }
        isLoading = false
    }

    private func delete() {
        guard let userID = auth.currentUserID else { return }
        Task {
            do {
                try await firestore.delete(registerID: id, userID: userID)
                onChanged()
                dismiss()
            } catch {
                // Si falla el borrado, se mantiene la pantalla abierta.
            }
        }
    }
}
