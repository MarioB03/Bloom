import SwiftUI

/// Formulario modal para crear o editar un check-in diario.
/// Portado de `app/checkin/nuevo.tsx` (la app RN lo presenta como modal
/// `slide_from_bottom`; aquí se presenta como `.sheet`).
struct CheckInFormView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore
    @Environment(\.dismiss) private var dismiss

    /// Check-in a editar, o `nil` para crear uno nuevo.
    let entryToEdit: CheckinEntry?
    /// Se invoca tras guardar con éxito, para que la pantalla origen recargue.
    let onSaved: () -> Void

    @State private var emotion: EmotionID?
    @State private var emotionIntensity: Int
    @State private var sleepQuality: Int
    @State private var hungerLevel: Int
    @State private var cyclePhase: CyclePhase?
    @State private var events: [ImportantEvent]
    @State private var notes: String
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(entryToEdit: CheckinEntry? = nil, onSaved: @escaping () -> Void) {
        self.entryToEdit = entryToEdit
        self.onSaved = onSaved
        _emotion = State(initialValue: entryToEdit?.emotion)
        _emotionIntensity = State(initialValue: entryToEdit?.emotionIntensity ?? 3)
        _sleepQuality = State(initialValue: entryToEdit?.sleepQuality ?? 3)
        _hungerLevel = State(initialValue: entryToEdit?.hungerLevel ?? 3)
        _cyclePhase = State(initialValue: entryToEdit?.cyclePhase)
        _events = State(initialValue: entryToEdit?.events ?? [])
        _notes = State(initialValue: entryToEdit?.notes ?? "")
    }

    private var isEditing: Bool { entryToEdit != nil }

    var body: some View {
        VStack(spacing: 0) {
            header
            form
        }
        .background(Theme.Palette.background)
    }

    // MARK: - Cabecera

    private var header: some View {
        ZStack {
            Text(isEditing ? Strings.CheckIn.editTitle : Strings.CheckIn.newCheckin)
                .font(.heading3)
                .foregroundStyle(Theme.Palette.neutral700)

            HStack {
                Spacer()
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Theme.Palette.primary400)
                        .frame(width: 40, height: 40)
                        .background(Theme.Palette.primary50)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, Theme.Spacing.md)
        .padding(.vertical, Theme.Spacing.sm)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(Theme.Palette.neutral100)
                .frame(height: 1)
        }
    }

    // MARK: - Formulario

    private var form: some View {
        ScrollView {
            VStack(spacing: Theme.Spacing.md) {
                titleSection

                BloomCard {
                    VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                        sectionTitle(Strings.CheckIn.emotion)
                        EmotionPicker(selected: $emotion)
                    }
                }

                BloomCard {
                    IntensitySelector(
                        label: Strings.CheckIn.intensity,
                        value: $emotionIntensity,
                        valueLabel: Strings.CheckIn.intensityLabel
                    )
                }

                BloomCard {
                    VStack(spacing: Theme.Spacing.md) {
                        IntensitySelector(
                            label: Strings.CheckIn.sleep,
                            value: $sleepQuality,
                            valueLabel: Strings.CheckIn.sleepLabel
                        )
                        Rectangle()
                            .fill(Theme.Palette.neutral100)
                            .frame(height: 1)
                        IntensitySelector(
                            label: Strings.CheckIn.hunger,
                            value: $hungerLevel,
                            valueLabel: Strings.CheckIn.hungerLabel
                        )
                    }
                }

                BloomCard {
                    CycleTracker(phase: $cyclePhase)
                }

                BloomCard {
                    EventInput(events: $events)
                }

                BloomCard {
                    notesSection
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(Theme.Palette.error)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                BloomButton(
                    title: isEditing ? Strings.CheckIn.saveChanges : Strings.CheckIn.save,
                    size: .lg,
                    loading: isSaving
                ) {
                    save()
                }
                .padding(.top, Theme.Spacing.sm)
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
            Text(Strings.CheckIn.formTitle)
                .font(.displaySmall)
                .foregroundStyle(Theme.Palette.neutral800)
            Text(Strings.CheckIn.formSubtitle)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, Theme.Spacing.sm)
    }

    private var notesSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            sectionTitle(Strings.CheckIn.notes)
            TextField(
                Strings.CheckIn.notesPlaceholder,
                text: $notes,
                axis: .vertical
            )
            .font(.bodyText)
            .lineLimit(4, reservesSpace: true)
            .padding(Theme.Spacing.sm)
            .background(Theme.Palette.neutral50)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.sm))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.sm)
                    .strokeBorder(Theme.Palette.neutral200, lineWidth: 1)
            )
        }
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.bodyBold)
            .foregroundStyle(Theme.Palette.neutral700)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Guardado

    private func save() {
        guard let emotion else {
            errorMessage = Strings.CheckIn.selectEmotion
            return
        }
        guard let userID = auth.currentUserID else { return }

        errorMessage = nil
        isSaving = true

        let cleanedEvents = events
            .map {
                ImportantEvent(
                    title: $0.title.trimmingCharacters(in: .whitespacesAndNewlines),
                    description: $0.description.trimmingCharacters(in: .whitespacesAndNewlines)
                )
            }
            .filter { !$0.title.isEmpty }
        let cleanedNotes = notes.trimmingCharacters(in: .whitespacesAndNewlines)

        do {
            if let entryToEdit {
                var updated = entryToEdit
                updated.emotion = emotion
                updated.emotionIntensity = emotionIntensity
                updated.sleepQuality = sleepQuality
                updated.hungerLevel = hungerLevel
                updated.cyclePhase = cyclePhase
                updated.events = cleanedEvents
                updated.notes = cleanedNotes
                try firestore.updateCheckin(updated)
            } else {
                let draft = CheckinDraft(
                    emotion: emotion,
                    emotionIntensity: emotionIntensity,
                    sleepQuality: sleepQuality,
                    hungerLevel: hungerLevel,
                    cyclePhase: cyclePhase,
                    events: cleanedEvents,
                    notes: cleanedNotes
                )
                try firestore.createCheckin(draft, userID: userID)
            }
            onSaved()
            dismiss()
        } catch {
            isSaving = false
            errorMessage = Strings.CheckIn.saveError
        }
    }
}
