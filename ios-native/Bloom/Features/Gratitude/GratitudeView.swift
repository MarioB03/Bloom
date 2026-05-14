import SwiftUI

/// Editor del diario de gratitud: hasta tres motivos de gratitud del día.
/// Portado de `app/gratitud/nuevo.tsx` (la app RN lo presenta como pantalla
/// apilada; aquí se presenta como `.sheet` desde el CTA del home).
///
/// Solo edita la entrada de **hoy**: si ya existe se carga en modo edición,
/// si no se crea una nueva. La app RN admite además un modo de solo lectura
/// para días pasados (al abrirlo desde la agenda o el calendario); eso llegará
/// con esas features.
struct GratitudeView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore
    @Environment(\.dismiss) private var dismiss

    /// Se invoca tras guardar con éxito, para que la pantalla origen recargue.
    let onSaved: () -> Void

    @State private var items: [String] = ["", "", ""]
    @State private var existingEntry: GratitudeEntry?
    @State private var isLoading = true
    @State private var isSaving = false
    @State private var errorMessage: String?

    private var isEditing: Bool { existingEntry != nil }

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView()
                        .tint(Theme.Palette.accent400)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    form
                }
            }
            .background(Theme.Palette.background)
            .navigationTitle(isEditing ? Strings.Gratitude.editTitle : Strings.Gratitude.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(Strings.Common.cancel) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(Strings.Common.save) { save() }
                        .disabled(isSaving || isLoading)
                }
            }
        }
        .task { await load() }
    }

    // MARK: - Formulario

    private var form: some View {
        ScrollView {
            VStack(spacing: Theme.Spacing.md) {
                titleSection

                ForEach(0..<3, id: \.self) { index in
                    itemCard(index)
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(Theme.Palette.error)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.top, Theme.Spacing.md)
            .padding(.bottom, Theme.Spacing.xxl)
        }
        .scrollIndicators(.hidden)
        .scrollDismissesKeyboard(.interactively)
    }

    private var titleSection: some View {
        VStack(spacing: Theme.Spacing.xs) {
            Text("🙏")
                .font(.system(size: 42))
            Text(Strings.Gratitude.subtitle)
                .font(.displaySmall)
                .foregroundStyle(Theme.Palette.neutral800)
            Text(Strings.Gratitude.prompt)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, Theme.Spacing.sm)
    }

    private func itemCard(_ index: Int) -> some View {
        BloomCard {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                ZStack {
                    Circle()
                        .fill(Theme.Palette.accent100)
                        .frame(width: 28, height: 28)
                    Text("\(index + 1)")
                        .font(.bodyBold)
                        .foregroundStyle(Theme.Palette.accent500)
                }

                TextField(
                    Strings.Gratitude.placeholder(index),
                    text: $items[index],
                    axis: .vertical
                )
                .font(.bodyText)
                .lineLimit(3, reservesSpace: true)
                .padding(Theme.Spacing.sm)
                .background(Theme.Palette.neutral50)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.sm))
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.Radius.sm)
                        .strokeBorder(Theme.Palette.neutral200, lineWidth: 1)
                )
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
            let today = BloomDate.dateKey(Date())
            if let entry = try await firestore.gratitude(byDate: today, userID: userID) {
                existingEntry = entry
                var loaded = entry.items
                while loaded.count < 3 { loaded.append("") }
                items = Array(loaded.prefix(3))
            }
        } catch {
            // Se arranca con los campos vacíos ante un fallo de red.
        }
        isLoading = false
    }

    private func save() {
        let filled = items
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        guard !filled.isEmpty else {
            errorMessage = Strings.Gratitude.emptyError
            return
        }
        guard let userID = auth.currentUserID else { return }

        errorMessage = nil
        isSaving = true

        do {
            if let existingEntry {
                var updated = existingEntry
                updated.items = filled
                try firestore.updateGratitude(updated)
            } else {
                try firestore.createGratitude(items: filled, userID: userID)
            }
            onSaved()
            dismiss()
        } catch {
            isSaving = false
            errorMessage = Strings.Gratitude.saveError
        }
    }
}
