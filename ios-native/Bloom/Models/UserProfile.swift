import Foundation
import FirebaseFirestore

/// Forma de género para el lenguaje de la UI. Portado de `GenderForm`.
enum GenderForm: String, Codable, Sendable {
    case femenino = "f"
    case masculino = "m"
    case neutro = "n"
}

/// Proveedor de autenticación con el que se creó la cuenta.
enum AuthProvider: String, Codable, Sendable {
    case email
    case apple
    case google
}

/// Preferencias del usuario.
struct UserPreferences: Codable, Sendable {
    var trackMenstrualCycle: Bool
    var genderForm: GenderForm?
}

/// Perfil del usuario. Documento de `users/{userId}` en Firestore.
///
/// No es `Sendable`: el wrapper `@DocumentID` de FirebaseFirestore no lo es.
/// Estos modelos se manejan siempre desde el main actor (servicios y vistas).
struct UserProfile: Codable, Identifiable {
    @DocumentID var id: String?
    var email: String
    var displayName: String
    var createdAt: Date
    var updatedAt: Date
    var preferences: UserPreferences
    var authProvider: AuthProvider?
}
