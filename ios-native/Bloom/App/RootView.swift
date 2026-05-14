import SwiftUI

/// Punto de entrada de la UI. Decide qué mostrar según el estado de sesión.
/// Equivalente al auth guard de `app/(tabs)/_layout.tsx` en la app React Native.
struct RootView: View {
    @Environment(AuthService.self) private var authService

    /// Onboarding visto. Mientras sea `false` y no haya sesión, se muestra el
    /// carrusel de bienvenida antes del flujo de autenticación.
    @AppStorage("bloom.onboardingComplete") private var onboardingComplete = false

    var body: some View {
        switch authService.state {
        case .loading:
            LoadingScreen()
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

/// Pantalla de carga mientras se resuelve el estado de sesión inicial.
struct LoadingScreen: View {
    var body: some View {
        ZStack {
            Theme.Palette.background.ignoresSafeArea()
            ProgressView()
                .tint(Theme.Palette.primary400)
        }
    }
}
