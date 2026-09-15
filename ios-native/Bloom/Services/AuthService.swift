import Foundation
import FirebaseAuth
import FirebaseFirestore

/// Estado de sesión observable de la app.
/// Equivalente nativo de `AuthContext` + `src/lib/auth.ts` en la app React Native.
@Observable
@MainActor
final class AuthService {

    enum State: Equatable {
        case loading
        case signedOut
        case signedIn(uid: String)
    }

    /// Error de dominio propio (p. ej. el correo ya existe con otro proveedor).
    struct AuthServiceError: LocalizedError {
        let message: String
        var errorDescription: String? { message }
    }

    private(set) var state: State = .loading

    private let db = Firestore.firestore()

    init() {
        // El listener vive toda la vida de la app: `AuthService` se crea una
        // sola vez en `BloomApp` y nunca se desasigna, así que no se retira.
        Auth.auth().addStateDidChangeListener { [weak self] _, user in
            let uid = user?.uid
            Task { @MainActor in
                self?.state = uid.map { State.signedIn(uid: $0) } ?? .signedOut
            }
        }
    }

    var currentUserID: String? {
        if case let .signedIn(uid) = state { return uid }
        return nil
    }

    /// Nombre visible del usuario actual. No es reactivo —rara vez cambia tras
    /// el login—, pero el listener de sesión recrea la jerarquía de vistas al
    /// entrar, así que la home siempre lo lee actualizado.
    var currentDisplayName: String? {
        Auth.auth().currentUser?.displayName
    }

    // MARK: - Email / contraseña

    func signIn(email: String, password: String) async throws {
        try await signInWithEmail(email, password: password)
    }

    func signUp(
        email: String,
        password: String,
        displayName: String,
        genderForm: GenderForm
    ) async throws {
        try await createUser(email: email, password: password)
        guard let user = Auth.auth().currentUser else {
            throw AuthServiceError(message: "No se pudo crear la cuenta")
        }

        try await updateDisplayName(displayName, for: user)

        try createProfile(
            for: user,
            displayName: displayName,
            genderForm: genderForm,
            provider: .email
        )
    }

    func sendPasswordReset(email: String) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            Auth.auth().sendPasswordReset(withEmail: email) { error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume()
                }
            }
        }
    }

    func signOut() throws {
        try Auth.auth().signOut()
        WidgetSyncService.clear()
    }

    // MARK: - Eliminar cuenta

    /// Proveedor con el que se autentica la sesión actual. Determina qué flujo
    /// de reautenticación mostrar antes de eliminar la cuenta.
    var currentAuthProvider: AuthProvider {
        guard let user = Auth.auth().currentUser else { return .email }
        for data in user.providerData {
            if data.providerID == "apple.com" { return .apple }
            if data.providerID == "google.com" { return .google }
        }
        return .email
    }

    /// Reautentica con email y contraseña. Firebase exige una credencial
    /// reciente antes de operaciones sensibles como borrar la cuenta.
    func reauthenticate(password: String) async throws {
        guard let user = Auth.auth().currentUser, let email = user.email else {
            throw AuthServiceError(message: "No hay sesión activa")
        }
        let credential = EmailAuthProvider.credential(withEmail: email, password: password)
        try await reauthenticate(with: credential)
    }

    /// Reautentica con una credencial fresca de Apple.
    func reauthenticateWithApple(idToken: String, rawNonce: String) async throws {
        guard Auth.auth().currentUser != nil else {
            throw AuthServiceError(message: "No hay sesión activa")
        }
        let credential = OAuthProvider.appleCredential(
            withIDToken: idToken,
            rawNonce: rawNonce,
            fullName: nil
        )
        try await reauthenticate(with: credential)
    }

    /// Reautentica con una credencial fresca de Google.
    func reauthenticateWithGoogle(idToken: String, accessToken: String) async throws {
        guard Auth.auth().currentUser != nil else {
            throw AuthServiceError(message: "No hay sesión activa")
        }
        let credential = GoogleAuthProvider.credential(
            withIDToken: idToken,
            accessToken: accessToken
        )
        try await reauthenticate(with: credential)
    }

    /// Elimina la cuenta: primero los datos de Firestore y los locales
    /// (best-effort), después el usuario de Firebase Auth —el paso crítico—.
    /// El listener de sesión detecta la baja y `RootView` vuelve al login.
    /// Requiere haber reautenticado recientemente.
    func deleteAccount(firestore: FirestoreService) async throws {
        guard let user = Auth.auth().currentUser else {
            throw AuthServiceError(message: "No hay sesión activa")
        }
        try? await firestore.deleteAllUserData(userID: user.uid)
        clearLocalData()
        WidgetSyncService.clear()
        try await deleteCurrentUser(user)
    }

    /// Borra las claves locales de la app (`bloom.*`) en `UserDefaults`.
    private func clearLocalData() {
        let defaults = UserDefaults.standard
        for key in defaults.dictionaryRepresentation().keys where key.hasPrefix("bloom.") {
            defaults.removeObject(forKey: key)
        }
    }

    // MARK: - Social

    /// Inicia sesión con Apple. `fullName` solo llega en el primer inicio.
    func signInWithApple(
        idToken: String,
        rawNonce: String,
        fullName: PersonNameComponents?
    ) async throws {
        let credential = OAuthProvider.appleCredential(
            withIDToken: idToken,
            rawNonce: rawNonce,
            fullName: fullName
        )
        let user = try await signInWithSocial(
            credential: credential,
            email: nil,
            providerID: "apple.com"
        )

        // Apple solo entrega el nombre en el primer inicio de sesión.
        var displayName = user.displayName ?? ""
        if displayName.isEmpty, let fullName {
            let parts = [fullName.givenName, fullName.familyName].compactMap { $0 }
            displayName = parts.joined(separator: " ")
            if !displayName.isEmpty {
                try await updateDisplayName(displayName, for: user)
            }
        }

        try await createProfileIfNeeded(
            for: user,
            displayName: displayName.isEmpty ? "Usuario" : displayName,
            provider: .apple
        )
    }

    /// Inicia sesión con Google. `email` se usa para el pre-check de proveedor.
    func signInWithGoogle(
        idToken: String,
        accessToken: String,
        email: String?
    ) async throws {
        let credential = GoogleAuthProvider.credential(
            withIDToken: idToken,
            accessToken: accessToken
        )
        let user = try await signInWithSocial(
            credential: credential,
            email: email,
            providerID: "google.com"
        )
        try await createProfileIfNeeded(
            for: user,
            displayName: user.displayName ?? "Usuario",
            provider: .google
        )
    }

    /// Antes de iniciar sesión social, comprueba si el correo ya existe con
    /// OTRO proveedor. Evita el auto-linking de Firebase, que silenciosamente
    /// eliminaría el proveedor de contraseña existente.
    private func signInWithSocial(
        credential: AuthCredential,
        email: String?,
        providerID: String
    ) async throws -> User {
        if let email {
            let methods = try await fetchSignInMethods(forEmail: email)
            if !methods.isEmpty && !methods.contains(providerID) {
                let methodName: String
                if methods.contains("password") {
                    methodName = "correo y contraseña"
                } else if methods.contains("apple.com") {
                    methodName = "Apple"
                } else if methods.contains("google.com") {
                    methodName = "Google"
                } else {
                    methodName = "otro método"
                }
                throw AuthServiceError(
                    message: "Ya tienes una cuenta con este correo usando \(methodName). Inicia sesión con ese método."
                )
            }
        }
        try await signInWithCredential(credential)
        guard let user = Auth.auth().currentUser else {
            throw AuthServiceError(message: "No se pudo iniciar sesión")
        }
        return user
    }

    // MARK: - Firebase Auth completion wrappers
    // Async Firebase Auth APIs return non-Sendable `AuthDataResult` and trip
    // Swift 6 concurrency checks on CI. Prefer completion handlers, then read
    // `Auth.auth().currentUser` on the MainActor.

    private func signInWithEmail(_ email: String, password: String) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            Auth.auth().signIn(withEmail: email, password: password) { _, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume()
                }
            }
        }
    }

    private func createUser(email: String, password: String) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            Auth.auth().createUser(withEmail: email, password: password) { _, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume()
                }
            }
        }
    }

    private func signInWithCredential(_ credential: AuthCredential) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            Auth.auth().signIn(with: credential) { _, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume()
                }
            }
        }
    }

    private func reauthenticate(with credential: AuthCredential) async throws {
        guard let user = Auth.auth().currentUser else {
            throw AuthServiceError(message: "No hay sesión activa")
        }
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            user.reauthenticate(with: credential) { _, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume()
                }
            }
        }
    }

    private func deleteCurrentUser(_ user: User) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            user.delete { error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume()
                }
            }
        }
    }

    private func fetchSignInMethods(forEmail email: String) async throws -> [String] {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<[String], Error>) in
            Auth.auth().fetchSignInMethods(forEmail: email) { methods, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: methods ?? [])
                }
            }
        }
    }

    // MARK: - Perfil en Firestore

    /// Actualiza el `displayName` del usuario en Firebase Auth.
    ///
    /// Usa la variante con `completion` (en vez de `commitChanges() async`)
    /// porque `UserProfileChangeRequest` no es `Sendable` y atravesar el
    /// `await` dispararía un error de concurrencia estricta de Swift 6.
    private func updateDisplayName(_ name: String, for user: User) async throws {
        let request = user.createProfileChangeRequest()
        request.displayName = name
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            request.commitChanges { error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume()
                }
            }
        }
    }

    private func createProfile(
        for user: User,
        displayName: String,
        genderForm: GenderForm,
        provider: AuthProvider
    ) throws {
        let now = Date()
        let profile = UserProfile(
            email: user.email ?? "",
            displayName: displayName,
            createdAt: now,
            updatedAt: now,
            preferences: UserPreferences(trackMenstrualCycle: false, genderForm: genderForm),
            authProvider: provider
        )
        try db.collection("users").document(user.uid).setData(from: profile)
    }

    /// Crea el perfil solo si el usuario es nuevo (primer inicio social).
    private func createProfileIfNeeded(
        for user: User,
        displayName: String,
        provider: AuthProvider
    ) async throws {
        let docRef = db.collection("users").document(user.uid)
        let exists = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Bool, Error>) in
            docRef.getDocument { snapshot, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: snapshot?.exists ?? false)
                }
            }
        }
        guard !exists else { return }

        let now = Date()
        let profile = UserProfile(
            email: user.email ?? "",
            displayName: displayName,
            createdAt: now,
            updatedAt: now,
            preferences: UserPreferences(trackMenstrualCycle: false, genderForm: .neutro),
            authProvider: provider
        )
        try docRef.setData(from: profile)
    }

    // MARK: - Mensajes de error

    /// Traduce un error de Firebase Auth a un mensaje en español para la UI.
    nonisolated static func message(for error: Error) -> String {
        let nsError = error as NSError
        guard nsError.domain == AuthErrorDomain,
              let code = AuthErrorCode(rawValue: nsError.code) else {
            return error.localizedDescription
        }
        switch code {
        case .invalidCredential, .wrongPassword, .userNotFound:
            return "Email o contraseña incorrectos"
        case .tooManyRequests:
            return "Demasiados intentos. Intenta más tarde"
        case .emailAlreadyInUse:
            return "Este email ya está registrado"
        case .weakPassword:
            return "La contraseña es demasiado débil"
        case .networkError:
            return "Sin conexión. Revisa tu red e intenta de nuevo"
        default:
            return "Error al iniciar sesión"
        }
    }
}
