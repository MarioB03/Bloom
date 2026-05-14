import SwiftUI

/// Pantalla de registro de cuenta. Portada de `app/(auth)/register.tsx`.
struct RegisterView: View {

    @Environment(AuthService.self) private var authService
    @Environment(\.dismiss) private var dismiss

    @State private var displayName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var genderForm: GenderForm = .neutro
    @State private var loading = false
    @State private var alertMessage: String?

    var body: some View {
        AuthScaffold(
            gradientColors: [
                Theme.Palette.secondary50,
                Theme.Palette.background,
                Theme.Palette.secondary50,
            ],
            logoEmoji: "🌱",
            logoBackground: Theme.Palette.secondary400,
            logoShadow: Theme.Shadow(
                color: Theme.Palette.secondary500.opacity(0.25),
                radius: 14,
                x: 0,
                y: 6
            ),
            title: "Crear cuenta",
            subtitle: "Comienza tu viaje de bienestar",
            scrollable: true
        ) {
            VStack(spacing: 0) {
                form
                SocialSignInButtons(onError: { alertMessage = $0 })
            }
        } links: {
            links
        }
        .errorAlert($alertMessage)
        .navigationBarBackButtonHidden()
    }

    private var form: some View {
        VStack(spacing: Theme.Spacing.md) {
            BloomTextField(
                label: Strings.Auth.displayName,
                placeholder: "Tu nombre",
                text: $displayName,
                textContentType: .name,
                autocapitalization: .words
            )

            genderSelector

            BloomTextField(
                label: Strings.Auth.email,
                placeholder: "tu@email.com",
                text: $email,
                keyboardType: .emailAddress,
                textContentType: .emailAddress,
                autocapitalization: .never,
                disableAutocorrection: true
            )
            BloomTextField(
                label: Strings.Auth.password,
                placeholder: "Mínimo 6 caracteres",
                text: $password,
                isSecure: true,
                textContentType: .newPassword
            )
            BloomTextField(
                label: Strings.Auth.confirmPassword,
                placeholder: "Repite la contraseña",
                text: $confirmPassword,
                isSecure: true,
                textContentType: .newPassword
            )
            BloomButton(
                title: Strings.Auth.registerButton,
                size: .lg,
                loading: loading,
                action: handleRegister
            )
            .padding(.top, Theme.Spacing.sm)
        }
        .authFormCard()
    }

    private var genderSelector: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            Text(Strings.Auth.genderLabel)
                .font(.caption)
                .foregroundStyle(Theme.Palette.neutral500)

            HStack(spacing: Theme.Spacing.sm) {
                genderChip(.femenino, label: Strings.Auth.genderFeminine)
                genderChip(.masculino, label: Strings.Auth.genderMasculine)
                genderChip(.neutro, label: Strings.Auth.genderNeutral)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func genderChip(_ value: GenderForm, label: String) -> some View {
        let selected = genderForm == value
        return Button {
            genderForm = value
        } label: {
            Text(label)
                .font(.caption)
                .foregroundStyle(selected ? Theme.Palette.primary500 : Theme.Palette.neutral400)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Theme.Spacing.sm)
                .background(selected ? Theme.Palette.primary50 : Theme.Palette.surface)
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.Radius.md)
                        .strokeBorder(
                            selected ? Theme.Palette.primary400 : Theme.Palette.neutral200,
                            lineWidth: 1.5
                        )
                )
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
        }
        .buttonStyle(.plain)
    }

    private var links: some View {
        VStack(spacing: Theme.Spacing.md) {
            HStack(spacing: 4) {
                Text(Strings.Auth.hasAccount)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral400)
                Button(Strings.Auth.login) { dismiss() }
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.primary400)
            }
            // TODO: enlazar a la pantalla de política de privacidad cuando se porte.
            Text(Strings.PrivacyPolicy.link)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral400)
        }
    }

    private func handleRegister() {
        let trimmedName = displayName.trimmingCharacters(in: .whitespaces)
        let trimmedEmail = email.trimmingCharacters(in: .whitespaces)

        guard !trimmedName.isEmpty, !trimmedEmail.isEmpty,
              !password.isEmpty, !confirmPassword.isEmpty else {
            alertMessage = "Rellena todos los campos"
            return
        }
        guard password == confirmPassword else {
            alertMessage = "Las contraseñas no coinciden"
            return
        }
        guard password.count >= 6 else {
            alertMessage = "La contraseña debe tener al menos 6 caracteres"
            return
        }

        loading = true
        Task {
            do {
                try await authService.signUp(
                    email: trimmedEmail,
                    password: password,
                    displayName: trimmedName,
                    genderForm: genderForm
                )
                // TODO: persistir genderForm en almacenamiento local cuando se
                // porte GenderContext (cross-cutting).
            } catch {
                alertMessage = AuthService.message(for: error)
            }
            loading = false
        }
    }
}
