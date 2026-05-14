import Foundation
import FirebaseFirestore

/// Acceso a Cloud Firestore. Equivalente nativo de `src/lib/firestore.ts`.
///
/// Por ahora cubre el CRUD de check-ins; el resto de colecciones
/// (gratitud, registros emocionales, sharing, skills) se irá portando
/// feature a feature sobre esta misma capa.
///
/// Los campos sensibles (`notes` y el `title`/`description` de cada evento)
/// se cifran con `BloomCrypto` antes de escribir y se descifran al leer, igual
/// que en la app RN — ambas apps comparten el mismo proyecto Firestore.
@Observable
@MainActor
final class FirestoreService {

    private let db = Firestore.firestore()

    private func checkinsCollection(for userID: String) -> CollectionReference {
        db.collection("users").document(userID).collection("checkins")
    }

    // MARK: - Lectura

    /// Check-ins de un día concreto (`"YYYY-MM-DD"`), del más reciente al más antiguo.
    func checkins(byDate date: String, userID: String) async throws -> [CheckinEntry] {
        let snapshot = try await checkinsCollection(for: userID)
            .whereField("date", isEqualTo: date)
            .getDocuments()
        return try snapshot.documents
            .map { try $0.data(as: CheckinEntry.self) }
            .map(decrypted)
            .sorted { $0.createdAt > $1.createdAt }
    }

    /// Un check-in por su id, o `nil` si no existe.
    func checkin(id: String, userID: String) async throws -> CheckinEntry? {
        let document = try await checkinsCollection(for: userID).document(id).getDocument()
        guard document.exists else { return nil }
        return decrypted(try document.data(as: CheckinEntry.self))
    }

    /// Check-ins dentro de un rango de fechas (`"YYYY-MM-DD"`, ambos inclusive),
    /// ordenados por fecha y luego hora descendentes. Alimenta el calendario mensual.
    func checkins(byDateRange startDate: String, to endDate: String, userID: String) async throws -> [CheckinEntry] {
        let snapshot = try await checkinsCollection(for: userID)
            .whereField("date", isGreaterThanOrEqualTo: startDate)
            .whereField("date", isLessThanOrEqualTo: endDate)
            .getDocuments()
        return try snapshot.documents
            .map { try $0.data(as: CheckinEntry.self) }
            .map(decrypted)
            .sorted {
                $0.date != $1.date ? $0.date > $1.date : $0.createdAt > $1.createdAt
            }
    }

    /// Fechas (`"YYYY-MM-DD"`) con al menos un check-in en los últimos 30 días.
    /// Alimenta el cálculo de la racha.
    func checkinDates(lastDays days: Int, userID: String) async throws -> [String] {
        let now = Date()
        let start = Calendar.current.date(byAdding: .day, value: -days, to: now) ?? now
        let snapshot = try await checkinsCollection(for: userID)
            .whereField("date", isGreaterThanOrEqualTo: BloomDate.dateKey(start))
            .whereField("date", isLessThanOrEqualTo: BloomDate.dateKey(now))
            .getDocuments()
        return snapshot.documents.compactMap { $0.data()["date"] as? String }
    }

    // MARK: - Escritura

    /// Crea un check-in nuevo con la fecha de hoy.
    func createCheckin(_ draft: CheckinDraft, userID: String) throws {
        let now = Date()
        let entry = CheckinEntry(
            id: nil,
            userId: userID,
            date: BloomDate.dateKey(now),
            createdAt: now,
            updatedAt: now,
            emotion: draft.emotion,
            emotionIntensity: draft.emotionIntensity,
            sleepQuality: draft.sleepQuality,
            hungerLevel: draft.hungerLevel,
            cyclePhase: draft.cyclePhase,
            events: draft.events,
            notes: draft.notes,
            composted: nil,
            compostReflection: nil
        )
        _ = try checkinsCollection(for: userID).addDocument(from: encrypted(entry))
    }

    /// Actualiza un check-in existente. Conserva `date` y `createdAt` del
    /// `entry` recibido (que viene de una lectura previa) y refresca `updatedAt`.
    func updateCheckin(_ entry: CheckinEntry) throws {
        guard let id = entry.id else {
            throw FirestoreServiceError.missingID
        }
        var updated = entry
        updated.updatedAt = Date()
        try checkinsCollection(for: entry.userId)
            .document(id)
            .setData(from: encrypted(updated), merge: true)
    }

    func delete(checkinID: String, userID: String) async throws {
        try await checkinsCollection(for: userID).document(checkinID).delete()
    }

    // MARK: - Cifrado de campos sensibles

    /// Copia del check-in con `notes` y los eventos cifrados, lista para escribir.
    private func encrypted(_ entry: CheckinEntry) -> CheckinEntry {
        var result = entry
        result.notes = BloomCrypto.encrypt(entry.notes)
        result.events = entry.events.map {
            ImportantEvent(
                title: BloomCrypto.encrypt($0.title),
                description: BloomCrypto.encrypt($0.description)
            )
        }
        if let reflection = entry.compostReflection {
            result.compostReflection = BloomCrypto.encrypt(reflection)
        }
        return result
    }

    /// Copia del check-in con `notes` y los eventos descifrados, lista para la UI.
    private func decrypted(_ entry: CheckinEntry) -> CheckinEntry {
        var result = entry
        result.notes = BloomCrypto.decrypt(entry.notes)
        result.events = entry.events.map {
            ImportantEvent(
                title: BloomCrypto.decrypt($0.title),
                description: BloomCrypto.decrypt($0.description)
            )
        }
        if let reflection = entry.compostReflection {
            result.compostReflection = BloomCrypto.decrypt(reflection)
        }
        return result
    }
}

enum FirestoreServiceError: LocalizedError {
    case missingID

    var errorDescription: String? {
        switch self {
        case .missingID: "El documento no tiene identificador."
        }
    }
}
