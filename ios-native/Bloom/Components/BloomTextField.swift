import SwiftUI

/// Campo de texto base de Bloom. Portado de `src/components/ui/Input.tsx`.
///
/// Etiqueta opcional encima, mensaje de error opcional debajo y soporte
/// para entrada segura (contraseñas).
struct BloomTextField: View {

    let label: String?
    let placeholder: String
    @Binding var text: String
    var isSecure = false
    var error: String?
    var keyboardType: UIKeyboardType = .default
    var textContentType: UITextContentType?
    var autocapitalization: TextInputAutocapitalization = .sentences
    var disableAutocorrection = false

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs + 2) {
            if let label {
                Text(label)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)
            }

            field
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral800)
                .tint(Theme.Palette.primary400)
                .keyboardType(keyboardType)
                .textContentType(textContentType)
                .textInputAutocapitalization(autocapitalization)
                .autocorrectionDisabled(disableAutocorrection)
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.vertical, Theme.Spacing.md - 4)
                .background(Theme.Palette.neutral50)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.Radius.md)
                        .strokeBorder(
                            error == nil ? Theme.Palette.neutral200 : Theme.Palette.error,
                            lineWidth: 1
                        )
                )

            if let error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.error)
            }
        }
    }

    @ViewBuilder
    private var field: some View {
        if isSecure {
            SecureField(placeholder, text: $text)
        } else {
            TextField(placeholder, text: $text)
        }
    }
}

#Preview {
    @Previewable @State var email = ""
    @Previewable @State var password = ""
    return VStack(spacing: Theme.Spacing.md) {
        BloomTextField(
            label: "Correo electrónico",
            placeholder: "tu@email.com",
            text: $email,
            keyboardType: .emailAddress,
            autocapitalization: .never,
            disableAutocorrection: true
        )
        BloomTextField(
            label: "Contraseña",
            placeholder: "••••••••",
            text: $password,
            isSecure: true,
            error: "Email o contraseña incorrectos"
        )
    }
    .padding()
    .background(Theme.Palette.background)
}
