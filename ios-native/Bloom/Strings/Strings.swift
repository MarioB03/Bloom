import Foundation

/// Catálogo de textos de la UI, todo en español.
/// Portado de `src/constants/strings.ts` de la app React Native.
///
/// Se irá completando feature a feature; por ahora cubre Auth.
/// La estrategia definitiva (`String(localized:)` vs enum) está por decidir.
enum Strings {

    enum App {
        static let name = "Bloom"
    }

    enum Auth {
        static let login = "Iniciar sesión"
        static let register = "Crear cuenta"
        static let forgotPassword = "Recuperar contraseña"
        static let email = "Correo electrónico"
        static let password = "Contraseña"
        static let confirmPassword = "Confirmar contraseña"
        static let displayName = "Nombre"
        static let loginButton = "Entrar"
        static let registerButton = "Registrarse"
        static let forgotPasswordButton = "Enviar enlace"
        static let noAccount = "¿No tienes cuenta?"
        static let hasAccount = "¿Ya tienes cuenta?"
        static let forgotPasswordLink = "¿Olvidaste tu contraseña?"
        static let backToLogin = "Volver al inicio"
        static let logout = "Cerrar sesión"
        static let genderLabel = "Forma de tratamiento"
        static let genderFeminine = "Femenino"
        static let genderMasculine = "Masculino"
        static let genderNeutral = "Neutro"
    }

    enum SocialAuth {
        static let divider = "o continuar con"
        static let apple = "Continuar con Apple"
        static let google = "Continuar con Google"
    }

    enum PrivacyPolicy {
        static let link = "Política de privacidad"
    }
}
