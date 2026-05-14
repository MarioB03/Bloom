import SwiftUI

/// Fila horizontal de chips de emoción para filtrar el diario.
/// Portado de `src/components/search/EmotionChips.tsx`.
struct EmotionChipsRow: View {

    @Binding var selected: Set<EmotionID>

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Theme.Spacing.sm) {
                ForEach(EmotionConfig.ordered) { emotion in
                    chip(emotion)
                }
            }
            .padding(.horizontal, 2)
            .padding(.vertical, Theme.Spacing.xs)
        }
    }

    private func chip(_ emotion: EmotionConfig) -> some View {
        let isOn = selected.contains(emotion.id)
        return Button {
            if isOn {
                selected.remove(emotion.id)
            } else {
                selected.insert(emotion.id)
            }
        } label: {
            HStack(spacing: 4) {
                Text(emotion.emoji)
                    .font(.system(size: 14))
                Text(emotion.label)
                    .font(.smallText)
                    .foregroundStyle(isOn ? emotion.color : Theme.Palette.neutral500)
            }
            .padding(.horizontal, Theme.Spacing.sm + 4)
            .padding(.vertical, Theme.Spacing.sm)
            .background(isOn ? emotion.color.opacity(0.12) : Theme.Palette.neutral100)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .strokeBorder(isOn ? emotion.color : Theme.Palette.neutral200, lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.selection, trigger: isOn)
    }
}

/// Campo de filtro por fecha: muestra la fecha elegida (o un placeholder) y
/// abre una hoja con un `DatePicker` gráfico.
/// Equivalente nativo de `src/components/search/DatePickerField.tsx` — en lugar
/// del calendario hecho a mano de RN se usa el `DatePicker` del sistema.
struct DateFilterField: View {

    let label: String
    @Binding var date: Date?
    /// Fecha máxima seleccionable (no se pueden filtrar fechas futuras).
    let maximumDate: Date

    @State private var showingPicker = false
    @State private var draft = Date()

    private static let formatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "es_ES")
        formatter.dateFormat = "dd/MM/yyyy"
        return formatter
    }()

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs + 2) {
            Text(label)
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.neutral700)

            Button {
                draft = min(date ?? Date(), maximumDate)
                showingPicker = true
            } label: {
                HStack(spacing: Theme.Spacing.sm) {
                    Image(systemName: "calendar")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.Palette.neutral400)
                    Text(date.map { Self.formatter.string(from: $0) } ?? Strings.Agenda.datePlaceholder)
                        .font(.bodyText)
                        .foregroundStyle(date == nil ? Theme.Palette.neutral400 : Theme.Palette.neutral800)
                    Spacer()
                }
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.vertical, Theme.Spacing.sm + 2)
                .background(Theme.Palette.neutral50)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.Radius.md)
                        .strokeBorder(Theme.Palette.neutral200, lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
        }
        .sheet(isPresented: $showingPicker) {
            pickerSheet
        }
    }

    private var pickerSheet: some View {
        NavigationStack {
            VStack(spacing: Theme.Spacing.md) {
                DatePicker(
                    "",
                    selection: $draft,
                    in: ...maximumDate,
                    displayedComponents: .date
                )
                .datePickerStyle(.graphical)
                .labelsHidden()

                if date != nil {
                    Button(role: .destructive) {
                        date = nil
                        showingPicker = false
                    } label: {
                        Text(Strings.Agenda.removeDate)
                    }
                }

                Spacer()
            }
            .padding()
            .background(Theme.Palette.background)
            .navigationTitle(label)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(Strings.Common.cancel) { showingPicker = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(Strings.Common.done) {
                        date = draft
                        showingPicker = false
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
