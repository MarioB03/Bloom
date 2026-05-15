import SwiftUI

/// Política de privacidad estática. Portado de `app/politica-privacidad.tsx`.
struct PrivacyPolicyView: View {

    var body: some View {
        ScreenWrapper {
            ForEach(Array(Self.sections.enumerated()), id: \.offset) { _, section in
                VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                    Text(section.title)
                        .font(.bodyBold)
                        .foregroundStyle(Theme.Palette.neutral700)
                    Text(section.body)
                        .font(.bodyText)
                        .foregroundStyle(Theme.Palette.neutral600)
                        .lineSpacing(4)
                }
                .padding(.bottom, Theme.Spacing.md)
            }
        }
        .navigationTitle(Strings.PrivacyPolicy.title)
        .navigationBarTitleDisplayMode(.inline)
    }

    private struct Section {
        let title: String
        let body: String
    }

    private static let sections: [Section] = [
        Section(
            title: "1. Información que recopilamos",
            body: """
            Bloom recopila los siguientes datos cuando usas la aplicación:

            - Correo electrónico y nombre para tu cuenta
            - Datos de check-in emocional: emociones, intensidad, calidad de sueño, nivel de hambre, fase del ciclo menstrual, eventos y notas
            - Registros emocionales detallados (observar y describir)
            - Entradas del diario de gratitud
            - Plan de seguridad: señales de alerta, estrategias, contactos de confianza y pasos personales
            - Historial de práctica de habilidades
            - Datos del jardín y logros
            """
        ),
        Section(
            title: "2. Cómo usamos tus datos",
            body: """
            Tus datos se utilizan exclusivamente para:

            - Proporcionarte una experiencia personalizada de bienestar emocional
            - Mostrarte insights y patrones sobre tu bienestar
            - Permitirte compartir datos de forma voluntaria con una persona de confianza

            No utilizamos tus datos para publicidad. No vendemos ni compartimos tus datos con terceros. No realizamos análisis de datos agregados con fines comerciales.
            """
        ),
        Section(
            title: "3. Almacenamiento y seguridad",
            body: """
            Tus datos se almacenan de forma segura en Firebase (Google Cloud Platform), con las siguientes medidas de protección:

            - Los campos sensibles (notas, eventos, gratitud, plan de seguridad) se encriptan con AES antes de almacenarse
            - El acceso a Firestore está protegido por reglas de seguridad que solo permiten acceso al propietario de los datos
            - La autenticación se gestiona a través de Firebase Authentication
            - Las comunicaciones están protegidas con HTTPS/TLS
            """
        ),
        Section(
            title: "4. Compartir datos",
            body: """
            Bloom incluye una función opcional para compartir tus datos de check-in con otra persona:

            - Tú generas un código de 6 caracteres que expira en 24 horas
            - La persona vinculada solo tiene acceso de lectura
            - Puedes revocar el acceso en cualquier momento desde tu perfil
            - Solo se puede compartir con una persona a la vez
            """
        ),
        Section(
            title: "5. Retención de datos",
            body: """
            Tus datos se conservan mientras mantengas tu cuenta activa en Bloom. Cuando eliminas tu cuenta, se borran permanentemente:

            - Todos los check-ins y registros emocionales
            - El diario de gratitud
            - El jardín, semillas y logros
            - El plan de seguridad
            - Los vínculos de compartir
            - Tu perfil y cuenta de autenticación
            """
        ),
        Section(
            title: "6. Tus derechos",
            body: """
            Como usuaria de Bloom, tienes derecho a:

            - Acceder a todos tus datos dentro de la aplicación
            - Exportar tus datos en formato PDF (función Premium)
            - Eliminar tu cuenta y todos los datos asociados de forma permanente
            - Revocar el acceso compartido en cualquier momento
            """
        ),
        Section(
            title: "7. Contacto",
            body: """
            Si tienes preguntas sobre esta política de privacidad o sobre cómo manejamos tus datos, puedes contactarnos a través de la App Store o enviando un correo a la dirección proporcionada en la página de la aplicación.

            Última actualización: mayo 2026.
            """
        ),
    ]
}

#Preview {
    NavigationStack {
        PrivacyPolicyView()
    }
}
