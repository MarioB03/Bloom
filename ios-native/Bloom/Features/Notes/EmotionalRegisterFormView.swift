import SwiftUI

/// Formulario modal para crear o editar un registro emocional
/// ("Observar y describir").
/// Portado de `app/registro-emocional/nuevo.tsx`.
///
/// La app RN incluye un interruptor de "visible al compartir" cuando hay una
/// cuenta vinculada; como la feature de compartir aún no está portada, ese
/// control se omite y `sharedVisible` queda en `false` (mismo criterio que el
/// muro de Premium en Insights).
struct EmotionalRegisterFormView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore
    @Environment(\.dismiss) private var dismiss

    /// Registro a editar, o `nil` para crear uno nuevo.
    let entryToEdit: EmotionalRegisterEntry?
    /// Se invoca tras guardar con éxito, para que la pantalla origen recargue.
    let onSaved: () -> Void

    @State private var emotion: EmotionID?
    @State private var emotionCustom: String
    @State private var intensity: Int
    @State private var vulnerability: String
    @State private var trigger: String
    @State private var interpretations: String
    @State private var internalSensations: String
    @State private var externalLanguage: String
    @State private var impulses: String
    @State private var behavior: String
    @State private var consequences: String
    @State private var emotionFunction: String
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(entryToEdit: EmotionalRegisterEntry? = nil, onSaved: @escaping () -> Void) {
        self.entryToEdit = entryToEdit
        self.onSaved = onSaved
        _emotion = State(initialValue: entryToEdit?.emotion)
        _emotionCustom = State(initialValue: entryToEdit?.emotionCustom ?? "")
        _intensity = State(initialValue: entryToEdit?.intensity ?? 5)
        _vulnerability = State(initialValue: entryToEdit?.vulnerability ?? "")
        _trigger = State(initialValue: entryToEdit?.trigger ?? "")
        _interpretations = State(initialValue: entryToEdit?.interpretations ?? "")
        _internalSensations = State(initialValue: entryToEdit?.internalSensations ?? "")
        _externalLanguage = State(initialValue: entryToEdit?.externalLanguage ?? "")
        _impulses = State(initialValue: entryToEdit?.impulses ?? "")
        _behavior = State(initialValue: entryToEdit?.behavior ?? "")
        _consequences = State(initialValue: entryToEdit?.consequences ?? "")
        _emotionFunction = State(initialValue: entryToEdit?.emotionFunction ?? "")
    }

    private var isEditing: Bool { entryToEdit != nil }

    /// Campos de texto libre, en el orden de la app RN.
    private var textFields: [(label: String, placeholder: String, text: Binding<String>)] {
        let s = Strings.EmotionalRegister.self
        return [
            (s.vulnerability, s.vulnerabilityPlaceholder, $vulnerability),
            (s.trigger, s.triggerPlaceholder, $trigger),
            (s.interpretations, s.interpretationsPlaceholder, $interpretations),
            (s.internalSensations, s.internalSensationsPlaceholder, $internalSensations),
            (s.externalLanguage, s.externalLanguagePlaceholder, $externalLanguage),
            (s.impulses, s.impulsesPlaceholder, $impulses),
            (s.behavior, s.behaviorPlaceholder, $behavior),
            (s.consequences, s.consequencesPlaceholder, $consequences),
            (s.emotionFunction, s.emotionFunctionPlaceholder, $emotionFunction),
        ]
    }

    var body: some View {
        NavigationStack {
            form
                .background(Theme.Palette.background)
                .navigationTitle(isEditing ? Strings.EmotionalRegister.editTitle : Strings.EmotionalRegister.formTitle)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button(Strings.Common.cancel) { dismiss() }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button(Strings.Common.save) { save() }
                            .disabled(isSaving)
                    }
                }
        }
    }

    // MARK: - Formulario

    private var form: some View {
        ScrollView {
            VStack(spacing: Theme.Spacing.md) {
                titleSection

                BloomCard {
                    VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                        sectionTitle(Strings.EmotionalRegister.emotion)
                        EmotionPicker(selected: $emotion)
                        customEmotionField
                    }
                }

                BloomCard {
                    intensitySection
                }

                ForEach(textFields, id: \.label) { field in
                    BloomCard {
                        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                            sectionTitle(field.label)
                            multilineField(placeholder: field.placeholder, text: field.text)
                        }
                    }
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
        // Elegir una emoción de la paleta descarta la emoción personalizada.
        .onChange(of: emotion) { _, newValue in
            if newValue != nil { emotionCustom = "" }
        }
    }

    private var titleSection: some View {
        VStack(spacing: Theme.Spacing.xs) {
            Text(Strings.EmotionalRegister.formTitle)
                .font(.displaySmall)
                .foregroundStyle(Theme.Palette.neutral800)
            Text(Strings.EmotionalRegister.formSubtitle)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, Theme.Spacing.sm)
    }

    /// Campo de emoción personalizada. Escribir en él descarta la emoción
    /// seleccionada de la paleta (igual que en la app RN).
    private var customEmotionField: some View {
        let binding = Binding(
            get: { emotionCustom },
            set: { newValue in
                emotionCustom = newValue
                if !newValue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    emotion = nil
                }
            }
        )
        return TextField(Strings.EmotionalRegister.emotionCustomPlaceholder, text: binding)
            .font(.bodyText)
            .padding(Theme.Spacing.sm)
            .background(Theme.Palette.neutral50)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.sm))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.sm)
                    .strokeBorder(Theme.Palette.neutral200, lineWidth: 1)
            )
    }

    private var intensitySection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack {
                Text(Strings.EmotionalRegister.intensity)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)
                Spacer()
                Text(Strings.EmotionalRegister.intensityValue(intensity))
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.primary500)
            }
            Slider(
                value: Binding(
                    get: { Double(intensity) },
                    set: { intensity = Int($0.rounded()) }
                ),
                in: 1...10,
                step: 1
            )
            .tint(Theme.Palette.primary500)
            .sensoryFeedback(.selection, trigger: intensity)
        }
    }

    private func multilineField(placeholder: String, text: Binding<String>) -> some View {
        TextField(placeholder, text: text, axis: .vertical)
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

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.bodyBold)
            .foregroundStyle(Theme.Palette.neutral700)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Guardado

    private func save() {
        let trimmedCustom = emotionCustom.trimmingCharacters(in: .whitespacesAndNewlines)
        guard emotion != nil || !trimmedCustom.isEmpty else {
            errorMessage = Strings.EmotionalRegister.selectEmotion
            return
        }
        guard let userID = auth.currentUserID else { return }

        errorMessage = nil
        isSaving = true

        func clean(_ value: String) -> String {
            value.trimmingCharacters(in: .whitespacesAndNewlines)
        }

        do {
            if let entryToEdit {
                var updated = entryToEdit
                updated.emotion = emotion
                updated.emotionCustom = trimmedCustom
                updated.intensity = intensity
                updated.vulnerability = clean(vulnerability)
                updated.trigger = clean(trigger)
                updated.interpretations = clean(interpretations)
                updated.internalSensations = clean(internalSensations)
                updated.externalLanguage = clean(externalLanguage)
                updated.impulses = clean(impulses)
                updated.behavior = clean(behavior)
                updated.consequences = clean(consequences)
                updated.emotionFunction = clean(emotionFunction)
                try firestore.updateEmotionalRegister(updated)
            } else {
                let draft = EmotionalRegisterDraft(
                    emotion: emotion,
                    emotionCustom: trimmedCustom,
                    intensity: intensity,
                    vulnerability: clean(vulnerability),
                    trigger: clean(trigger),
                    interpretations: clean(interpretations),
                    internalSensations: clean(internalSensations),
                    externalLanguage: clean(externalLanguage),
                    impulses: clean(impulses),
                    behavior: clean(behavior),
                    consequences: clean(consequences),
                    emotionFunction: clean(emotionFunction)
                )
                try firestore.createEmotionalRegister(draft, userID: userID)
            }
            onSaved()
            dismiss()
        } catch {
            isSaving = false
            errorMessage = Strings.EmotionalRegister.saveError
        }
    }
}
