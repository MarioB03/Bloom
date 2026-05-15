import SwiftUI
import GoogleSignIn

@main
struct BloomApp: App {

    @State private var authService: AuthService
    @State private var firestoreService: FirestoreService
    @State private var premiumService: PremiumService

    init() {
        FirebaseBootstrap.configure()
        Self.configureGoogleSignIn()
        _authService = State(initialValue: AuthService())
        _firestoreService = State(initialValue: FirestoreService())
        _premiumService = State(initialValue: PremiumService())
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(authService)
                .environment(firestoreService)
                .environment(premiumService)
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
                }
        }
    }

    /// Configura Google Sign-In con el `CLIENT_ID` de `GoogleService-Info.plist`.
    private static func configureGoogleSignIn() {
        guard
            let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
            let plist = NSDictionary(contentsOfFile: path),
            let clientID = plist["CLIENT_ID"] as? String
        else {
            assertionFailure("No se encontró CLIENT_ID en GoogleService-Info.plist")
            return
        }
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)
    }
}
