import Foundation

/// Plan de seguridad personal: señales de alerta, estrategias de afrontamiento,
/// contactos de confianza y pasos personales para momentos difíciles.
/// Documento único de `users/{userId}/safetyPlan/plan` en Firestore.
/// Portado de `SafetyPlan` en `src/types/safetyPlan.ts`.
///
/// A diferencia del resto de modelos el documento tiene id fijo (`plan`), así
/// que no necesita `@DocumentID`. Todos los campos de texto se guardan cifrados
/// en Firestore con `BloomCrypto`, igual que en la app RN.
struct SafetyPlan: Codable, Equatable, Sendable {
    var warningSigns: [String]
    var copingStrategies: [String]
    var trustedContacts: [TrustedContact]
    var personalSteps: [String]
    var updatedAt: Date?

    /// Plan vacío inicial, antes de que el usuario escriba nada.
    static let empty = SafetyPlan(
        warningSigns: [],
        copingStrategies: [],
        trustedContacts: [],
        personalSteps: [],
        updatedAt: nil
    )
}

/// Contacto de confianza al que el usuario puede llamar cuando necesite apoyo.
/// Portado de `TrustedContact` en `src/types/safetyPlan.ts`.
struct TrustedContact: Codable, Equatable, Sendable {
    var name: String
    var phone: String
}

/// Línea de crisis profesional. Catálogo estático en `CrisisHotlineCatalog`,
/// no se lee de Firestore (igual que `src/constants/crisisHotlines.ts` en RN).
/// Portado de `CrisisHotline` en `src/types/safetyPlan.ts`.
struct CrisisHotline: Identifiable, Sendable {
    let name: String
    let phone: String
    let country: String
    let emoji: String

    var id: String { "\(country)-\(phone)" }
}
