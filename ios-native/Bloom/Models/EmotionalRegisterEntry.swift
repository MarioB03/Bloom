import Foundation
import FirebaseFirestore

/// Registro emocional "Observar y describir" (técnica DBT).
/// Documento de `users/{userId}/registers/{registerId}` en Firestore.
/// Portado de `EmotionalRegisterEntry` en `src/types/checkin.ts`.
///
/// No es `Sendable`: el wrapper `@DocumentID` de FirebaseFirestore no lo es.
/// Se maneja siempre desde el main actor, igual que `CheckinEntry`.
struct EmotionalRegisterEntry: Codable, Identifiable {
    @DocumentID var id: String?
    var userId: String
    /// Fecha en formato "YYYY-MM-DD".
    var date: String
    var createdAt: Date
    var updatedAt: Date
    /// Emoción de la paleta, o `nil` si se describió una personalizada.
    var emotion: EmotionID?
    var emotionCustom: String
    /// Intensidad 1–10 (el check-in diario, en cambio, va de 1 a 5).
    var intensity: Int
    var vulnerability: String
    var trigger: String
    var interpretations: String
    var internalSensations: String
    var externalLanguage: String
    var impulses: String
    var behavior: String
    var consequences: String
    var emotionFunction: String
    /// Visibilidad para la cuenta vinculada. La feature de compartir aún no
    /// está portada; el campo se conserva para el round-trip con la app RN y
    /// por ahora es siempre `false`.
    var sharedVisible: Bool
}

/// Datos de formulario para crear o editar un registro emocional.
/// `date`, `createdAt`, `updatedAt` y `userId` los pone `FirestoreService`.
/// Equivalente a `EmotionalRegisterFormData` en `src/types/checkin.ts`.
struct EmotionalRegisterDraft {
    var emotion: EmotionID?
    var emotionCustom: String = ""
    var intensity: Int = 5
    var vulnerability: String = ""
    var trigger: String = ""
    var interpretations: String = ""
    var internalSensations: String = ""
    var externalLanguage: String = ""
    var impulses: String = ""
    var behavior: String = ""
    var consequences: String = ""
    var emotionFunction: String = ""
    var sharedVisible: Bool = false
}
