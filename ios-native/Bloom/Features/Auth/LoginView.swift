import SwiftUI

/// Pantalla de inicio de sesión. Portada de `app/(auth)/login.tsx`.
struct LoginView: View {

    @Environment(AuthService.self) private var authService

    @State private var email = ""
    @State private var password = ""
    @State private var loading = false
    @State private var alertMessage: String?

    var body: some View {
        AuthScaffold(
            gradientColors: [
                Theme.Palette.background,
                Theme.Palette.secondary50,
                Theme.Palette.background,
            ],
            logoEmoji: "🌿",
            logoBackground: Theme.Palette.primary400,
            title: Strings.App.name,
            subtitle: "Tu jardín de bienestar emocional"
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
                placeholder: "••••••••",
                text: $password,
                isSecure: true,
                textContentType: .password
            )
            BloomButton(
                title: Strings.Auth.loginButton,
                size: .lg,
                loading: loading,
                action: handleLogin
            )
            .padding(.top, Theme.Spacing.sm)
        }
        .authFormCard()
    }

    private var links: some View {
        VStack(spacing: Theme.Spacing.md) {
            NavigationLink(value: AuthRoute.forgotPassword) {
                Text(Strings.Auth.forgotPasswordLink)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.primary400)
            }
            HStack(spacing: 4) {
                Text(Strings.Auth.noAccount)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral400)
                NavigationLink(value: AuthRoute.register) {
                    Text(Strings.Auth.register)
                        .font(.bodyBold)
                        .foregroundStyle(Theme.Palette.primary400)
                }
            }
            // TODO: enlazar a la pantalla de política de privacidad cuando se porte.
            Text(Strings.PrivacyPolicy.link)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral400)
        }
    }

    private func handleLogin() {
        let trimmedEmail = email.trimmingCharacters(in: .whitespaces)
        guard !trimmedEmail.isEmpty, !password.isEmpty else {
            alertMessage = "Rellena todos los campos"
            return
        }
        loading = true
        Task {
            do {
                try await authService.signIn(email: trimmedEmail, password: password)
                // No se navega: el listener de AuthService actualiza RootView.
            } catch {
                alertMessage = AuthService.message(for: error)
            }
            loading = false
        }
    }
}
