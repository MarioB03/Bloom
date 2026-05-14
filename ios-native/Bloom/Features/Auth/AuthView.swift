import SwiftUI

/// Destinos de navegación dentro del flujo de autenticación.
enum AuthRoute: Hashable {
    case register
    case forgotPassword
}

/// Flujo de autenticación (login / registro / recuperar contraseña).
/// Equivalente al grupo `app/(auth)/` en la app React Native.
///
/// No gestiona el éxito: cuando el usuario inicia sesión, el listener de
/// `AuthService` cambia el estado y `RootView` muestra `MainTabView`.
struct AuthView: View {
    var body: some View {
        NavigationStack {
            LoginView()
                .navigationDestination(for: AuthRoute.self) { route in
                    switch route {
                    case .register:
                        RegisterView()
                    case .forgotPassword:
                        ForgotPasswordView()
                    }
                }
        }
    }
}

#Preview {
    AuthView()
        .environment(AuthService())
}
