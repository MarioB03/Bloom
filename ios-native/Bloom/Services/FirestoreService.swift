import Foundation
import FirebaseFirestore

/// Acceso a Cloud Firestore. Equivalente nativo de `src/lib/firestore.ts`.
///
/// Por ahora cubre el CRUD de check-ins; el resto de colecciones
/// (gratitud, registros emocionales, sharing, skills) se irá portando
/// feature a feature sobre esta misma capa.
@Observable
@MainActor
final class FirestoreService {

    private let db = Firestore.firestore()

    private func checkinsCollection(for userID: String) -> CollectionReference {
        db.collection("users").document(userID).collection("checkins")
    }

    /// Devuelve los check-ins del usuario ordenados por fecha descendente.
    func checkins(for userID: String) async throws -> [CheckinEntry] {
        let snapshot = try await checkinsCollection(for: userID)
            .order(by: "date", descending: true)
            .getDocuments()
        return try snapshot.documents.map { try $0.data(as: CheckinEntry.self) }
    }

    /// Crea o actualiza un check-in. Si `id` es `nil`, crea un documento nuevo.
    func save(_ checkin: CheckinEntry) throws {
        let collection = checkinsCollection(for: checkin.userId)
        if let id = checkin.id {
            try collection.document(id).setData(from: checkin, merge: true)
        } else {
            _ = try collection.addDocument(from: checkin)
        }
    }

    func delete(checkinID: String, userID: String) async throws {
        try await checkinsCollection(for: userID).document(checkinID).delete()
    }
}
