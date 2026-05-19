import Foundation
import FirebaseFirestore

/// Fase del ciclo menstrual. Portado de `CyclePhase` en `src/types/checkin.ts`.
enum CyclePhase: String, Codable, CaseIterable, Sendable {
    case menstruacion
    case folicular
    case ovulacion
    case lutea
    case noAplica = "no_aplica"
}

/// Un evento importante asociado a un check-in.
struct ImportantEvent: Codable, Hashable, Sendable {
    var title: String
    var description: String
}

/// Registro diario de bienestar emocional.
/// Documento de `users/{userId}/checkins/{checkinId}` en Firestore.
///
/// No es `Sendable`: el wrapper `@DocumentID` de FirebaseFirestore no lo es.
/// Estos modelos se manejan siempre desde el main actor (servicios y vistas).
struct CheckinEntry: Codable, Identifiable {
    @DocumentID var id: String?
    var userId: String
    /// Fecha en formato "YYYY-MM-DD".
    var date: String
    var createdAt: Date
    var updatedAt: Date
    var emotion: EmotionID
    /// Intensidad de la emoción, 1–5.
    var emotionIntensity: Int
    /// Calidad del sueño, 1–5.
    var sleepQuality: Int
    /// Nivel de hambre, 1–5.
    var hungerLevel: Int
    var cyclePhase: CyclePhase?
    var events: [ImportantEvent]
    var notes: String
    var composted: Bool?
    var compostReflection: String?
}

/// Datos de formulario para crear un check-in nuevo.
/// `date`, `createdAt`, `updatedAt` y `userId` los pone `FirestoreService`.
/// Equivalente a `CheckinFormData` en `src/types/checkin.ts`.
struct CheckinDraft {
    var emotion: EmotionID
    var emotionIntensity: Int = 3
    var sleepQuality: Int = 3
    var hungerLevel: Int = 3
    var cyclePhase: CyclePhase?
    var events: [ImportantEvent] = []
    var notes: String = ""
}
