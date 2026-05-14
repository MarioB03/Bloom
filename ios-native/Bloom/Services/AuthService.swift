import Foundation
import FirebaseAuth

/// Estado de sesión observable de la app.
/// Equivalente nativo de `AuthContext` en la app React Native.
@Observable
@MainActor
final class AuthService {

    enum State: Equatable {
        case loading
        case signedOut
        case signedIn(uid: String)
    }

    private(set) var state: State = .loading

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

    func signIn(email: String, password: String) async throws {
        try await Auth.auth().signIn(withEmail: email, password: password)
    }

    func signUp(email: String, password: String) async throws {
        try await Auth.auth().createUser(withEmail: email, password: password)
    }

    func sendPasswordReset(email: String) async throws {
        try await Auth.auth().sendPasswordReset(withEmail: email)
    }

    func signOut() throws {
        try Auth.auth().signOut()
    }
}
