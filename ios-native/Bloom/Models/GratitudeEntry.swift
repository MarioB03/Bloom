import Foundation
import FirebaseFirestore

/// Entrada del diario de gratitud: hasta tres cosas buenas de un día.
/// Documento de `users/{userId}/gratitude/{gratitudeId}` en Firestore.
/// Portado de `GratitudeEntry` en `src/types/checkin.ts`.
///
/// Hay como mucho una entrada por día. No es `Sendable`: el wrapper
/// `@DocumentID` de FirebaseFirestore no lo es; se maneja siempre desde el
/// main actor, igual que `CheckinEntry`.
struct GratitudeEntry: Codable, Identifiable {
    @DocumentID var id: String?
    var userId: String
    /// Fecha en formato "YYYY-MM-DD".
    var date: String
    var createdAt: Date
    var updatedAt: Date
    /// Hasta tres motivos de gratitud. Se guardan cifrados en Firestore.
    var items: [String]
}
