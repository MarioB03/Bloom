import SwiftUI

@main
struct BloomApp: App {

    @State private var authService: AuthService
    @State private var firestoreService: FirestoreService

    init() {
        FirebaseBootstrap.configure()
        _authService = State(initialValue: AuthService())
        _firestoreService = State(initialValue: FirestoreService())
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(authService)
                .environment(firestoreService)
        }
    }
}
