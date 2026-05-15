import SwiftUI
import AuthenticationServices
import CryptoKit
import GoogleSignIn

/// Pantalla de eliminación de cuenta. Portado de `app/eliminar-cuenta.tsx`.
///
/// Pide reautenticación reciente (Firebase la exige para operaciones
/// sensibles) y luego ejecuta el borrado en cascada: datos de Firestore,
/// claves locales (`bloom.*` en `UserDefaults`) y el usuario de Firebase
/// Auth. El listener de sesión llevará a `RootView` → `AuthView`.
struct DeleteAccountView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore
    @Environment(GenderService.self) private var gender

    @State private var password = ""
    @State private var reAuthenticated = false
    @State private var reAuthLoading = false
    @State private var deleting = false
    @State private var showConfirm = false
    @State private var errorMessage: String?

    /// Nonce sin hashear del intento de Apple en curso (igual que en
    /// `SocialSignInButtons`).
    @State private var currentNonce: String?

    var body: some View {
        ScreenWrapper {
            warningCard
            deletionListCard
            reAuthCard
            deleteButton
        }
        .navigationTitle(Strings.DeleteAccount.title)
        .navigationBarTitleDisplayMode(.inline)
        .alert(
            Strings.DeleteAccount.confirmTitle,
            isPresented: $showConfirm
        ) {
            Button(Strings.DeleteAccount.confirmButton, role: .destructive) {
                Task { await performDelete() }
            }
            Button(Strings.Common.cancel, role: .cancel) {}
        } message: {
            Text(gender.resolve(Strings.DeleteAccount.confirmMessage))
        }
        .errorAlert($errorMessage)
    }

    // MARK: - Secciones

    private var warningCard: some View {
        BloomCard {
            HStack(spacing: Theme.Spacing.sm) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Theme.Palette.error.opacity(0.15))
                        .frame(width: 44, height: 44)
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 22))
                        .foregroundStyle(Theme.Palette.error)
                }
                Text(Strings.DeleteAccount.warning)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral700)
            }
        }
    }

    private var deletionListCard: some View {
        BloomCard {
            Text(Strings.DeleteAccount.whatDeleted)
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.neutral700)
                .padding(.bottom, Theme.Spacing.sm)

            VStack(alignment: .leading, spacing: 6) {
                ForEach(Self.deletionItems, id: \.self) { item in
                    HStack(alignment: .top, spacing: Theme.Spacing.sm) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(Theme.Palette.error)
                            .padding(.top, 2)
                        Text(item)
                            .font(.bodyText)
                            .foregroundStyle(Theme.Palette.neutral600)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var reAuthCard: some View {
        BloomCard {
            Text(Strings.DeleteAccount.reAuthTitle)
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.neutral700)
                .padding(.bottom, Theme.Spacing.sm)

            if reAuthenticated {
                HStack(spacing: Theme.Spacing.sm) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(Theme.Palette.success)
                    Text(Strings.DeleteAccount.verified)
                        .font(.bodyText)
                        .foregroundStyle(Theme.Palette.success)
                }
                .padding(.vertical, Theme.Spacing.sm)
            } else {
                switch auth.currentAuthProvider {
                case .email: passwordReAuth
                case .apple: appleReAuth
                case .google: googleReAuth
                }
            }
        }
    }

    private var passwordReAuth: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text(Strings.DeleteAccount.reAuthPassword)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral500)

            BloomTextField(
                label: Strings.Auth.password,
                placeholder: Strings.DeleteAccount.passwordPlaceholder,
                text: $password,
                isSecure: true,
                textContentType: .password,
                autocapitalization: .never,
                disableAutocorrection: true
            )

            BloomButton(
                title: Strings.DeleteAccount.verify,
                variant: .outline,
                size: .md,
                loading: reAuthLoading,
                isEnabled: !password.isEmpty
            ) {
                Task { await reauthWithPassword() }
            }
            .padding(.top, Theme.Spacing.xs)
        }
    }

    private var appleReAuth: some View {
        SignInWithAppleButton(.continue, onRequest: configureAppleRequest, onCompletion: handleAppleCompletion)
            .signInWithAppleButtonStyle(.black)
            .frame(height: 50)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
            .disabled(reAuthLoading)
    }

    private var googleReAuth: some View {
        BloomButton(
            title: Strings.DeleteAccount.reAuthGoogle,
            variant: .outline,
            size: .md,
            loading: reAuthLoading
        ) {
            handleGoogleReAuth()
        }
    }

    private var deleteButton: some View {
        Button {
            showConfirm = true
        } label: {
            HStack(spacing: Theme.Spacing.sm) {
                if deleting {
                    ProgressView()
                        .tint(.white)
                    Text(Strings.DeleteAccount.deleting)
                } else {
                    Image(systemName: "trash.fill")
                    Text(Strings.DeleteAccount.confirmButton)
                }
            }
            .font(.bodyBold)
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.md)
            .background(Theme.Palette.error)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
            .opacity(reAuthenticated && !deleting ? 1 : 0.4)
        }
        .disabled(!reAuthenticated || deleting)
        .padding(.top, Theme.Spacing.md)
        .padding(.bottom, Theme.Spacing.xl)
        .sensoryFeedback(.warning, trigger: showConfirm)
    }

    // MARK: - Acciones de reautenticación

    private func reauthWithPassword() async {
        reAuthLoading = true
        defer { reAuthLoading = false }
        do {
            try await auth.reauthenticate(password: password)
            reAuthenticated = true
        } catch {
            errorMessage = Strings.DeleteAccount.errorReAuth
        }
    }

    private func configureAppleRequest(_ request: ASAuthorizationAppleIDRequest) {
        let nonce = Self.randomNonceString()
        currentNonce = nonce
        request.requestedScopes = [.fullName, .email]
        request.nonce = Self.sha256(nonce)
    }

    private func handleAppleCompletion(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .failure(let error):
            if (error as? ASAuthorizationError)?.code != .canceled {
                errorMessage = Strings.DeleteAccount.errorReAuth
            }
        case .success(let authorization):
            guard
                let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                let nonce = currentNonce,
                let tokenData = credential.identityToken,
                let idToken = String(data: tokenData, encoding: .utf8)
            else {
                errorMessage = Strings.DeleteAccount.errorReAuth
                return
            }
            reAuthLoading = true
            Task {
                do {
                    try await auth.reauthenticateWithApple(idToken: idToken, rawNonce: nonce)
                    reAuthenticated = true
                } catch {
                    errorMessage = Strings.DeleteAccount.errorReAuth
                }
                reAuthLoading = false
            }
        }
    }

    private func handleGoogleReAuth() {
        guard let presenter = Self.rootViewController() else {
            errorMessage = Strings.DeleteAccount.errorReAuth
            return
        }
        reAuthLoading = true
        Task {
            do {
                let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presenter)
                guard let idToken = result.user.idToken?.tokenString else {
                    throw AuthService.AuthServiceError(message: "Sin idToken de Google")
                }
                try await auth.reauthenticateWithGoogle(
                    idToken: idToken,
                    accessToken: result.user.accessToken.tokenString
                )
                reAuthenticated = true
            } catch let error as GIDSignInError where error.code == .canceled {
                // Cancelación del usuario: no se informa.
            } catch {
                errorMessage = Strings.DeleteAccount.errorReAuth
            }
            reAuthLoading = false
        }
    }

    // MARK: - Borrado

    private func performDelete() async {
        deleting = true
        do {
            try await auth.deleteAccount(firestore: firestore)
            // El listener de sesión recoge el cambio y devuelve a AuthView.
        } catch {
            errorMessage = Strings.DeleteAccount.errorDelete
            deleting = false
        }
    }

    // MARK: - Helpers

    private static let deletionItems = [
        Strings.DeleteAccount.itemCheckins,
        Strings.DeleteAccount.itemGratitude,
        Strings.DeleteAccount.itemSkills,
        Strings.DeleteAccount.itemSafetyPlan,
        Strings.DeleteAccount.itemAccount,
    ]

    @MainActor
    private static func rootViewController() -> UIViewController? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }?
            .rootViewController
    }

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

#Preview {
    NavigationStack {
        DeleteAccountView()
            .environment(AuthService())
            .environment(FirestoreService())
            .environment(GenderService())
    }
}
