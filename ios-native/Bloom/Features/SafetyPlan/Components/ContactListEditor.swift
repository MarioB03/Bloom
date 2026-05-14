import SwiftUI

/// Lista editable de contactos de confianza (nombre + teléfono). Cada fila se
/// puede llamar (con confirmación) o eliminar; abajo hay un formulario para
/// añadir nuevos. Portado de `src/components/safetyPlan/ContactList.tsx`.
struct ContactListEditor: View {

    let contacts: [TrustedContact]
    let onUpdate: ([TrustedContact]) -> Void

    @Environment(\.openURL) private var openURL

    @State private var name = ""
    @State private var phone = ""
    @State private var contactToCall: TrustedContact?

    private var canAdd: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty &&
        !phone.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        VStack(spacing: Theme.Spacing.xs) {
            ForEach(Array(contacts.enumerated()), id: \.offset) { index, contact in
                contactRow(contact, index: index)
            }
            addSection
        }
        .sensoryFeedback(.impact(weight: .light), trigger: contacts.count)
        .alert(
            Strings.SafetyPlan.callConfirmTitle,
            isPresented: callAlertPresented,
            presenting: contactToCall
        ) { contact in
            Button(Strings.Common.cancel, role: .cancel) {}
            Button(Strings.SafetyPlan.call) { call(contact) }
        } message: { contact in
            Text(Strings.SafetyPlan.callConfirmMessage(contact.name))
        }
    }

    // MARK: - Fila de contacto

    private func contactRow(_ contact: TrustedContact, index: Int) -> some View {
        HStack(spacing: Theme.Spacing.sm) {
            VStack(alignment: .leading, spacing: 1) {
                Text(contact.name)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)
                Text(contact.phone)
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.neutral400)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Button {
                contactToCall = contact
            } label: {
                Image(systemName: "phone.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.Palette.secondary500)
                    .frame(width: 32, height: 32)
                    .background(Theme.Palette.secondary100)
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)

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

    // MARK: - Formulario para añadir

    private var addSection: some View {
        VStack(spacing: Theme.Spacing.xs) {
            TextField(Strings.SafetyPlan.contactNamePlaceholder, text: $name)
                .textFieldStyle(.plain)
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

            HStack(spacing: Theme.Spacing.sm) {
                TextField(Strings.SafetyPlan.contactPhonePlaceholder, text: $phone)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral800)
                    .tint(Theme.Palette.primary400)
                    .keyboardType(.phonePad)
                    .padding(.vertical, Theme.Spacing.sm)
                    .padding(.horizontal, Theme.Spacing.md)
                    .background(Theme.Palette.neutral50)
                    .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
                    .overlay(
                        RoundedRectangle(cornerRadius: Theme.Radius.md)
                            .strokeBorder(Theme.Palette.neutral200, lineWidth: 1)
                    )

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
    }

    // MARK: - Acciones

    private var callAlertPresented: Binding<Bool> {
        Binding(
            get: { contactToCall != nil },
            set: { if !$0 { contactToCall = nil } }
        )
    }

    private func add() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let trimmedPhone = phone.trimmingCharacters(in: .whitespaces)
        guard !trimmedName.isEmpty, !trimmedPhone.isEmpty else { return }
        onUpdate(contacts + [TrustedContact(name: trimmedName, phone: trimmedPhone)])
        name = ""
        phone = ""
    }

    private func remove(at index: Int) {
        var updated = contacts
        updated.remove(at: index)
        onUpdate(updated)
    }

    private func call(_ contact: TrustedContact) {
        guard let url = URL(string: "tel:\(contact.phone)") else { return }
        openURL(url)
    }
}
