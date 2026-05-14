import SwiftUI

/// Lista editable de cadenas: cada fila se elimina con su cruz y se añaden
/// elementos nuevos con un campo de texto + botón.
/// Portado de `src/components/safetyPlan/EditableList.tsx`.
struct EditableListEditor: View {

    let items: [String]
    let placeholder: String
    let onUpdate: ([String]) -> Void

    @State private var newItem = ""

    private var canAdd: Bool {
        !newItem.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        VStack(spacing: Theme.Spacing.xs) {
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                HStack(spacing: Theme.Spacing.sm) {
                    Text(item)
                        .font(.bodyText)
                        .foregroundStyle(Theme.Palette.neutral700)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Button {
                        remove(at: index)
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 20))
                            .foregroundStyle(Theme.Palette.neutral300)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.vertical, Theme.Spacing.sm)
                .padding(.horizontal, Theme.Spacing.md)
                .background(Theme.Palette.secondary50)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
            }

            HStack(spacing: Theme.Spacing.sm) {
                TextField(placeholder, text: $newItem)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral800)
                    .tint(Theme.Palette.primary400)
                    .padding(.vertical, Theme.Spacing.sm)
                    .padding(.horizontal, Theme.Spacing.md)
                    .background(Theme.Palette.neutral50)
                    .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
                    .overlay(
                        RoundedRectangle(cornerRadius: Theme.Radius.md)
                            .strokeBorder(Theme.Palette.neutral200, lineWidth: 1)
                    )
                    .onSubmit(add)

                Button(action: add) {
                    Image(systemName: "plus")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(canAdd ? Theme.Palette.secondary500 : Theme.Palette.neutral300)
                        .frame(width: 36, height: 36)
                        .background(canAdd ? Theme.Palette.secondary50 : Theme.Palette.neutral50)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .disabled(!canAdd)
            }
        }
        .sensoryFeedback(.impact(weight: .light), trigger: items.count)
    }

    private func add() {
        let trimmed = newItem.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        onUpdate(items + [trimmed])
        newItem = ""
    }

    private func remove(at index: Int) {
        var updated = items
        updated.remove(at: index)
        onUpdate(updated)
    }
}
