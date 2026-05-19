import SwiftUI
import AuthenticationServices
import CryptoKit
import GoogleSignIn

/// Botones de inicio de sesión social (Apple y Google).
/// Portado de `src/components/auth/SocialSignInButtons.tsx`.
///
/// No navega: al iniciar sesión, el listener de `AuthService` cambia el
/// estado y `RootView` muestra la app. Solo informa de errores.
struct SocialSignInButtons: View {

    @Environment(AuthService.self) private var authService

    var onError: (String) -> Void

    @State private var loadingProvider: Provider?
    /// Nonce sin hashear del intento de Apple en curso; se necesita íntegro
    /// para construir la credencial de Firebase.
    @State private var currentNonce: String?

    private enum Provider { case apple, google }

    var body: some View {
        VStack(spacing: Theme.Spacing.md) {
            divider

            VStack(spacing: Theme.Spacing.sm) {
                SignInWithAppleButton(.continue, onRequest: configureAppleRequest, onCompletion: handleAppleCompletion)
                    .signInWithAppleButtonStyle(.black)
                    .frame(height: 50)
                    .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
                    .disabled(loadingProvider != nil)

                googleButton
            }
        }
        .padding(.top, Theme.Spacing.lg)
    }

    private var divider: some View {
        HStack(spacing: Theme.Spacing.md) {
            Rectangle()
                .fill(Theme.Palette.neutral200)
                .frame(height: 1)
            Text(Strings.SocialAuth.divider)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral400)
            Rectangle()
                .fill(Theme.Palette.neutral200)
                .frame(height: 1)
        }
    }

    private var googleButton: some View {
        Button(action: handleGoogleSignIn) {
            Group {
                if loadingProvider == .google {
                    ProgressView()
                        .tint(Theme.Palette.neutral500)
                } else {
                    HStack(spacing: Theme.Spacing.sm) {
                        Text("G")
                            .font(.heading2)
                            .foregroundStyle(Color(hex: "4285F4"))
                        Text(Strings.SocialAuth.google)
                            .font(.bodyBold)
                            .foregroundStyle(Theme.Palette.neutral700)
                    }
                    .lineLimit(1)
                    .fixedSize()
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(Theme.Palette.surface)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.lg)
                    .strokeBorder(Theme.Palette.neutral200, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
            .bloomShadow(.sm)
        }
        .disabled(loadingProvider != nil)
    }

    // MARK: - Apple

    private func configureAppleRequest(_ request: ASAuthorizationAppleIDRequest) {
        let nonce = Self.randomNonceString()
        currentNonce = nonce
        request.requestedScopes = [.fullName, .email]
        request.nonce = Self.sha256(nonce)
    }

    private func handleAppleCompletion(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .failure(let error):
            // El usuario cancelando el diálogo no es un error que mostrar.
            if (error as? ASAuthorizationError)?.code != .canceled {
                onError(error.localizedDescription)
            }
        case .success(let authorization):
            guard
                let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                let nonce = currentNonce,
                let tokenData = credential.identityToken,
                let idToken = String(data: tokenData, encoding: .utf8)
            else {
                onError("No se recibió el token de Apple")
                return
            }
            loadingProvider = .apple
            Task {
                do {
                    try await authService.signInWithApple(
                        idToken: idToken,
                        rawNonce: nonce,
                        fullName: credential.fullName
                    )
                } catch {
                    onError(AuthService.message(for: error))
                }
                loadingProvider = nil
            }
        }
    }

    // MARK: - Google

    private func handleGoogleSignIn() {
        guard let presenter = Self.rootViewController() else {
            onError("No se pudo abrir el inicio de sesión de Google")
            return
        }
        loadingProvider = .google
        Task {
            do {
                let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presenter)
                guard let idToken = result.user.idToken?.tokenString else {
                    throw AuthService.AuthServiceError(message: "No se recibió el token de Google")
                }
                try await authService.signInWithGoogle(
                    idToken: idToken,
                    accessToken: result.user.accessToken.tokenString,
                    email: result.user.profile?.email
                )
            } catch let error as GIDSignInError where error.code == .canceled {
                // Cancelación del usuario: no se informa.
            } catch {
                onError(AuthService.message(for: error))
            }
            loadingProvider = nil
        }
    }

    // MARK: - Helpers

    @MainActor
    private static func rootViewController() -> UIViewController? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }?
            .rootViewController
    }

    /// Nonce aleatorio criptográficamente seguro para el flujo de Apple.
    private static func randomNonceString(length: Int = 32) -> String {
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remaining = length
        while remaining > 0 {
            var random: UInt8 = 0
            guard SecRandomCopyBytes(kSecRandomDefault, 1, &random) == errSecSuccess else { continue }
            if random < charset.count {
                result.append(charset[Int(random)])
                remaining -= 1
            }
        }
        return result
    }

    private static func sha256(_ input: String) -> String {
        SHA256.hash(data: Data(input.utf8))
            .map { String(format: "%02x", $0) }
            .joined()
    }
}
