import SwiftUI

/// Punto de entrada de la UI. Decide qué mostrar según el estado de sesión y
/// presenta el splash animado por encima hasta que la app está lista y la
/// animación ha completado. Equivalente al auth guard de
/// `app/(tabs)/_layout.tsx` + el `AnimatedSplash` overlay del `_layout.tsx` de RN.
struct RootView: View {
    @Environment(AuthService.self) private var authService

    /// Onboarding visto. Mientras sea `false` y no haya sesión, se muestra el
    /// carrusel de bienvenida antes del flujo de autenticación.
    @AppStorage("bloom.onboardingComplete") private var onboardingComplete = false

    /// `true` cuando el splash ha terminado su animación de salida. Hasta
    /// entonces, se renderiza encima del contenido principal.
    @State private var splashDone = false

    var body: some View {
        ZStack {
            content
            if !splashDone {
                AnimatedSplashView(isReady: authService.state != .loading) {
                    splashDone = true
                }
                .transition(.opacity)
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        switch authService.state {
        case .loading:
            // Fondo neutro mientras se resuelve la sesión. El splash tapa todo.
            Theme.Palette.background.ignoresSafeArea()
        case .signedOut:
            if onboardingComplete {
                AuthView()
            } else {
                OnboardingView()
            }
        case .signedIn:
            MainTabView()
        }
    }
}
