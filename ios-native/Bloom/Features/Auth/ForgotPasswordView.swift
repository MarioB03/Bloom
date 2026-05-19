import SwiftUI

/// Pantalla de recuperación de contraseña. Portada de
/// `app/(auth)/forgot-password.tsx`.
struct ForgotPasswordView: View {

    @Environment(AuthService.self) private var authService
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var loading = false
    @State private var sent = false
    @State private var alertMessage: String?

    var body: some View {
        AuthScaffold(
            gradientColors: [
                Theme.Palette.background,
                Theme.Palette.primary50,
                Theme.Palette.background,
            ],
            logoEmoji: sent ? "✉️" : "🔑",
            logoBackground: Theme.Palette.primary400,
            title: sent ? "Enlace enviado" : Strings.Auth.forgotPassword,
            subtitle: sent
                ? "Revisa tu bandeja de entrada"
                : "Te enviaremos un enlace para restablecer tu contraseña"
        ) {
            if sent {
                sentCard
            } else {
                form
            }
        } links: {
            Button("← \(Strings.Auth.backToLogin)") { dismiss() }
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.primary400)
        }
        .errorAlert($alertMessage)
        .navigationBarBackButtonHidden()
        .animation(.easeInOut, value: sent)
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
            BloomButton(
                title: Strings.Auth.forgotPasswordButton,
                size: .lg,
                loading: loading,
                action: handleReset
            )
            .padding(.top, Theme.Spacing.sm)
        }
        .authFormCard()
    }

    private var sentCard: some View {
        VStack(spacing: Theme.Spacing.sm) {
            Text("📬")
                .font(.system(size: 56))
                .padding(.bottom, Theme.Spacing.sm)
            Text("Hemos enviado un enlace a ")
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral600)
            + Text(email)
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.primary400)
            + Text(" para restablecer tu contraseña.")
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral600)

            Text("Si no lo encuentras, revisa tu carpeta de spam.")
                .font(.caption)
                .foregroundStyle(Theme.Palette.neutral400)
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity)
        .padding(Theme.Spacing.xl)
        .background(Theme.Palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
        .bloomShadow(.lg)
    }

    private func handleReset() {
        let trimmedEmail = email.trimmingCharacters(in: .whitespaces)
        guard !trimmedEmail.isEmpty else {
            alertMessage = "Introduce tu email"
            return
        }
        loading = true
        Task {
            do {
                try await authService.sendPasswordReset(email: trimmedEmail)
                sent = true
            } catch {
                alertMessage = "No se pudo enviar el enlace. Verifica el email."
            }
            loading = false
        }
    }
}
