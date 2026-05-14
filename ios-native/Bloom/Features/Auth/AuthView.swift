import SwiftUI

/// Flujo de autenticación (login / registro / recuperar contraseña).
/// Equivalente al grupo `app/(auth)/` en la app React Native.
/// TODO: portar login, registro, recuperación y social sign-in (Apple/Google).
struct AuthView: View {
    var body: some View {
        PlaceholderScreen(
            title: "Bienvenida a Bloom",
            systemImage: "leaf.fill",
            subtitle: "Pantalla de inicio de sesión — pendiente de portar"
        )
    }
}

#Preview {
    AuthView()
}
