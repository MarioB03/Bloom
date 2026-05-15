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

    private func registersCollection(for userID: String) -> CollectionReference {
        db.collection("users").document(userID).collection("registers")
    }

    private func gratitudeCollection(for userID: String) -> CollectionReference {
        db.collection("users").document(userID).collection("gratitude")
    }

    private func skillPracticeCollection(for userID: String) -> CollectionReference {
        db.collection("users").document(userID).collection("skillPractice")
    }

    /// El plan de seguridad es un documento único con id fijo (`plan`).
    private func safetyPlanDocument(for userID: String) -> DocumentReference {
        db.collection("users").document(userID).collection("safetyPlan").document("plan")
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

    /// Todos los check-ins del usuario, del más reciente al más antiguo.
    /// Alimenta la pantalla de insights y sus correlaciones.
    func allCheckins(userID: String) async throws -> [CheckinEntry] {
        let snapshot = try await checkinsCollection(for: userID)
            .order(by: "date", descending: true)
            .getDocuments()
        return try snapshot.documents
            .map { try $0.data(as: CheckinEntry.self) }
            .map(decrypted)
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

    // MARK: - Registros emocionales (Observar y describir)

    /// Todos los registros emocionales del usuario, del más reciente al más antiguo.
    /// Si `sharedOnly` es `true`, filtra por `sharedVisible == true` — lo que
    /// permite leer como viewer (las reglas exigen ese filtro en el cliente).
    func allEmotionalRegisters(userID: String, sharedOnly: Bool = false) async throws -> [EmotionalRegisterEntry] {
        var query: Query = registersCollection(for: userID)
        if sharedOnly {
            query = query.whereField("sharedVisible", isEqualTo: true)
        }
        let snapshot = try await query.order(by: "createdAt", descending: true).getDocuments()
        return try snapshot.documents
            .map { try $0.data(as: EmotionalRegisterEntry.self) }
            .map(decrypted)
    }

    /// Registros emocionales de un día concreto, del más reciente al más antiguo.
    /// El filtro `sharedOnly` aplica las mismas reglas que `allEmotionalRegisters`.
    func emotionalRegisters(byDate date: String, userID: String, sharedOnly: Bool = false) async throws -> [EmotionalRegisterEntry] {
        var query: Query = registersCollection(for: userID)
            .whereField("date", isEqualTo: date)
        if sharedOnly {
            query = query.whereField("sharedVisible", isEqualTo: true)
        }
        let snapshot = try await query.getDocuments()
        return try snapshot.documents
            .map { try $0.data(as: EmotionalRegisterEntry.self) }
            .map(decrypted)
            .sorted { $0.createdAt > $1.createdAt }
    }

    /// Un registro emocional por su id, o `nil` si no existe.
    func emotionalRegister(id: String, userID: String) async throws -> EmotionalRegisterEntry? {
        let document = try await registersCollection(for: userID).document(id).getDocument()
        guard document.exists else { return nil }
        return decrypted(try document.data(as: EmotionalRegisterEntry.self))
    }

    /// Crea un registro emocional nuevo con la fecha de hoy.
    func createEmotionalRegister(_ draft: EmotionalRegisterDraft, userID: String) throws {
        let now = Date()
        let entry = EmotionalRegisterEntry(
            id: nil,
            userId: userID,
            date: BloomDate.dateKey(now),
            createdAt: now,
            updatedAt: now,
            emotion: draft.emotion,
            emotionCustom: draft.emotionCustom,
            intensity: draft.intensity,
            vulnerability: draft.vulnerability,
            trigger: draft.trigger,
            interpretations: draft.interpretations,
            internalSensations: draft.internalSensations,
            externalLanguage: draft.externalLanguage,
            impulses: draft.impulses,
            behavior: draft.behavior,
            consequences: draft.consequences,
            emotionFunction: draft.emotionFunction,
            sharedVisible: draft.sharedVisible
        )
        _ = try registersCollection(for: userID).addDocument(from: encrypted(entry))
    }

    /// Actualiza un registro emocional existente. Conserva `date` y `createdAt`
    /// del `entry` recibido (que viene de una lectura previa) y refresca `updatedAt`.
    func updateEmotionalRegister(_ entry: EmotionalRegisterEntry) throws {
        guard let id = entry.id else {
            throw FirestoreServiceError.missingID
        }
        var updated = entry
        updated.updatedAt = Date()
        try registersCollection(for: entry.userId)
            .document(id)
            .setData(from: encrypted(updated), merge: true)
    }

    func delete(registerID: String, userID: String) async throws {
        try await registersCollection(for: userID).document(registerID).delete()
    }

    // MARK: - Diario de gratitud

    /// Entrada de gratitud de un día concreto (`"YYYY-MM-DD"`), o `nil` si no
    /// hay ninguna. Solo existe una entrada por día.
    func gratitude(byDate date: String, userID: String) async throws -> GratitudeEntry? {
        let snapshot = try await gratitudeCollection(for: userID)
            .whereField("date", isEqualTo: date)
            .getDocuments()
        guard let document = snapshot.documents.first else { return nil }
        return decrypted(try document.data(as: GratitudeEntry.self))
    }

    /// Todas las entradas de gratitud del usuario, de la más reciente a la más antigua.
    func allGratitude(userID: String) async throws -> [GratitudeEntry] {
        let snapshot = try await gratitudeCollection(for: userID)
            .order(by: "createdAt", descending: true)
            .getDocuments()
        return try snapshot.documents
            .map { try $0.data(as: GratitudeEntry.self) }
            .map(decrypted)
    }

    /// Crea la entrada de gratitud de hoy con los motivos indicados.
    func createGratitude(items: [String], userID: String) throws {
        let now = Date()
        let entry = GratitudeEntry(
            id: nil,
            userId: userID,
            date: BloomDate.dateKey(now),
            createdAt: now,
            updatedAt: now,
            items: items
        )
        _ = try gratitudeCollection(for: userID).addDocument(from: encrypted(entry))
    }

    /// Actualiza una entrada de gratitud existente. Conserva `date` y
    /// `createdAt` del `entry` recibido y refresca `updatedAt`.
    func updateGratitude(_ entry: GratitudeEntry) throws {
        guard let id = entry.id else {
            throw FirestoreServiceError.missingID
        }
        var updated = entry
        updated.updatedAt = Date()
        try gratitudeCollection(for: entry.userId)
            .document(id)
            .setData(from: encrypted(updated), merge: true)
    }

    // MARK: - Prácticas de habilidades

    /// Historial de prácticas del usuario, de la más reciente a la más antigua.
    func skillPracticeHistory(userID: String) async throws -> [SkillPractice] {
        let snapshot = try await skillPracticeCollection(for: userID)
            .order(by: "completedAt", descending: true)
            .getDocuments()
        return try snapshot.documents.map { try $0.data(as: SkillPractice.self) }
    }

    /// Ids de las habilidades distintas que el usuario ha practicado al menos
    /// una vez. Alimenta el contador "Habilidades diferentes" del historial.
    func uniquePracticedSkillIDs(userID: String) async throws -> Set<String> {
        let snapshot = try await skillPracticeCollection(for: userID).getDocuments()
        return Set(snapshot.documents.compactMap { $0.data()["skillId"] as? String })
    }

    /// Registra una práctica de habilidad completada, con la fecha de ahora.
    ///
    /// Divergencia de RN: en la app React Native `createSkillPractice` existe
    /// pero no se llama desde ninguna pantalla, así que el historial siempre
    /// queda vacío. Aquí sí se invoca (al terminar un ejercicio o al marcar un
    /// artículo como practicado), de modo que el historial es funcional.
    func createSkillPractice(_ draft: SkillPracticeDraft, userID: String) throws {
        let practice = SkillPractice(
            id: nil,
            userId: userID,
            skillId: draft.skillId,
            skillTitle: draft.skillTitle,
            category: draft.category,
            completedAt: Date(),
            durationSeconds: draft.durationSeconds
        )
        _ = try skillPracticeCollection(for: userID).addDocument(from: practice)
    }

    // MARK: - Plan de seguridad

    /// El plan de seguridad del usuario, o `nil` si todavía no ha creado ninguno.
    func safetyPlan(userID: String) async throws -> SafetyPlan? {
        let document = try await safetyPlanDocument(for: userID).getDocument()
        guard document.exists else { return nil }
        return decrypted(try document.data(as: SafetyPlan.self))
    }

    /// Guarda el plan de seguridad, sobrescribiendo el documento por completo y
    /// refrescando `updatedAt` (mismo comportamiento que `setDoc` en la app RN).
    func saveSafetyPlan(_ plan: SafetyPlan, userID: String) throws {
        var updated = plan
        updated.updatedAt = Date()
        try safetyPlanDocument(for: userID).setData(from: encrypted(updated))
    }

    // MARK: - Eliminar todos los datos del usuario

    /// Borra todas las subcolecciones del usuario y su documento de perfil.
    /// Best-effort: cada paso se aísla para que un fallo parcial no bloquee la
    /// baja de la cuenta (mismo criterio que `deleteUserAccount` en la app RN).
    ///
    /// No toca `sharingCodes` ni `viewerLinks`: el sharing aún no está portado.
    func deleteAllUserData(userID: String) async throws {
        let collections = [
            checkinsCollection(for: userID),
            registersCollection(for: userID),
            gratitudeCollection(for: userID),
            skillPracticeCollection(for: userID),
            db.collection("users").document(userID).collection("safetyPlan"),
        ]
        for collection in collections {
            try? await deleteAllDocuments(in: collection)
        }
        try? await db.collection("users").document(userID).delete()
    }

    /// Borra todos los documentos de una colección, uno a uno.
    private func deleteAllDocuments(in collection: CollectionReference) async throws {
        let snapshot = try await collection.getDocuments()
        for document in snapshot.documents {
            try await document.reference.delete()
        }
    }

    // MARK: - Premium

    /// Lee el estado Premium guardado en `users/{uid}.premium`. Si está
    /// caducado, lo marca como inactivo en segundo plano (mismo criterio que
    /// `getUserPremiumStatus` en la app RN).
    func userPremiumStatus(userID: String) async throws -> PremiumStatus? {
        let document = try await db.collection("users").document(userID).getDocument()
        guard let data = document.data(), data["premium"] != nil else { return nil }
        var status = try document.data(as: PremiumProfile.self).premium

        if status.source == nil {
            status.source = status.giftCode != nil ? .giftCode : nil
        }
        if status.isActive, let expiresAt = status.expiresAt, expiresAt < Date() {
            try? await db.collection("users").document(userID)
                .updateData(["premium.isActive": false])
            status.isActive = false
        }
        return status
    }

    /// Canjea un código de regalo: marca el código como redimido y actualiza
    /// el estado Premium del usuario.
    @discardableResult
    func redeemPremiumCode(_ rawCode: String, userID: String) async throws -> PremiumStatus {
        let code = rawCode.uppercased()
        let codeRef = db.collection("premiumCodes").document(code)
        let snapshot = try await codeRef.getDocument()
        guard snapshot.exists else { throw PremiumCodeError.invalid }

        let premiumCode: PremiumCode
        do {
            premiumCode = try snapshot.data(as: PremiumCode.self)
        } catch {
            throw PremiumCodeError.invalid
        }

        if premiumCode.status == .redeemed { throw PremiumCodeError.alreadyRedeemed }
        if premiumCode.expiresAt < Date() { throw PremiumCodeError.expired }

        let now = Date()
        let premiumExpiresAt = now.addingTimeInterval(Double(premiumCode.durationDays) * 86_400)
        let status = PremiumStatus(
            isActive: true,
            source: .giftCode,
            expiresAt: premiumExpiresAt,
            giftCode: code,
            activatedAt: now
        )

        let encoder = Firestore.Encoder()
        let statusDict = try encoder.encode(status)

        try await db.collection("users").document(userID).updateData([
            "premium": statusDict,
            "updatedAt": now,
        ])
        try await codeRef.updateData([
            "redeemedBy": userID,
            "redeemedAt": now,
            "status": PremiumCode.Status.redeemed.rawValue,
        ])
        return status
    }

    /// Wrapper para descodificar solo el campo `premium` del documento.
    private struct PremiumProfile: Codable {
        var premium: PremiumStatus
    }

    // MARK: - Preferencia de género

    /// Lee `users/{uid}.preferences.genderForm`, o `nil` si no está fijada.
    /// Se usa para hidratar `GenderService` tras iniciar sesión.
    func genderPreference(userID: String) async throws -> GenderForm? {
        let document = try await db.collection("users").document(userID).getDocument()
        guard
            let preferences = document.data()?["preferences"] as? [String: Any],
            let raw = preferences["genderForm"] as? String
        else { return nil }
        return GenderForm(rawValue: raw)
    }

    /// Guarda la forma seleccionada en `users/{uid}.preferences.genderForm`.
    /// Equivalente de `updateGenderPreference` en `src/lib/firestore.ts`.
    func updateGenderPreference(userID: String, form: GenderForm) async throws {
        try await db.collection("users").document(userID).updateData([
            "preferences.genderForm": form.rawValue,
            "updatedAt": Date(),
        ])
    }

    // MARK: - Compartir cuenta

    /// Alfabeto del código de invitación: sin caracteres confusos (0/O, 1/I/L).
    /// Idéntico al de la app RN.
    private static let sharingCodeChars = Array("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")

    private static func generateSharingCode() -> String {
        String((0..<6).map { _ in sharingCodeChars.randomElement()! })
    }

    private func viewersCollection(for ownerID: String) -> CollectionReference {
        db.collection("users").document(ownerID).collection("viewers")
    }

    /// Código activo más reciente del dueño (no caducado), o `nil`. Diverge
    /// de la app RN: ahí cada tap de "Generar código" creaba un documento
    /// nuevo y dejaba huérfanos los anteriores; aquí se reutiliza mientras
    /// siga vivo para no inundar la colección.
    func activeSharingCode(forOwner ownerID: String) async throws -> SharingCode? {
        let snapshot = try await db.collection("sharingCodes")
            .whereField("ownerId", isEqualTo: ownerID)
            .getDocuments()
        let now = Date()
        return try snapshot.documents
            .map { try $0.data(as: SharingCode.self) }
            .filter { $0.expiresAt > now }
            .max { $0.createdAt < $1.createdAt }
    }

    /// Devuelve el código activo del dueño si lo hay; si no, genera uno nuevo
    /// en `sharingCodes/{code}`. Caduca a las 24 horas.
    func createSharingCode(userID: String, displayName: String) async throws -> String {
        if let existing = try await activeSharingCode(forOwner: userID) {
            return existing.code
        }
        let code = Self.generateSharingCode()
        let now = Date()
        let expiresAt = now.addingTimeInterval(24 * 60 * 60)
        let payload = SharingCode(
            code: code,
            ownerId: userID,
            ownerDisplayName: displayName,
            createdAt: now,
            expiresAt: expiresAt
        )
        try db.collection("sharingCodes").document(code).setData(from: payload)
        return code
    }

    /// Lee `sharingCodes/{code}` (devuelve `nil` si no existe).
    func sharingCode(_ rawCode: String) async throws -> SharingCode? {
        let document = try await db.collection("sharingCodes").document(rawCode.uppercased()).getDocument()
        guard document.exists else { return nil }
        return try document.data(as: SharingCode.self)
    }

    /// Canjea un código: comprueba validez/expiración, evita auto-vínculo y
    /// vínculos duplicados, crea `users/{ownerId}/viewers/{viewerId}` y el
    /// lookup inverso `viewerLinks/{viewerId}` (idéntico criterio que la app RN).
    @discardableResult
    func redeemSharingCode(_ rawCode: String, viewerID: String, viewerDisplayName: String) async throws -> SharingLink {
        let code = rawCode.uppercased()
        guard let sharingCode = try await sharingCode(code) else {
            throw SharingError.invalidCode
        }
        if sharingCode.expiresAt < Date() {
            throw SharingError.codeExpired
        }
        if sharingCode.ownerId == viewerID {
            throw SharingError.cannotLinkSelf
        }

        let viewerDocRef = viewersCollection(for: sharingCode.ownerId).document(viewerID)
        let existing = try await viewerDocRef.getDocument()
        if existing.exists {
            let existingLink = try existing.data(as: SharingLink.self)
            if existingLink.status == .active {
                // Asegura el lookup inverso (migración para enlaces existentes
                // creados antes de añadir `viewerLinks`).
                try db.collection("viewerLinks").document(viewerID).setData(from: existingLink)
                throw SharingError.alreadyLinked
            }
            throw SharingError.linkRevoked
        }

        let link = SharingLink(
            ownerId: sharingCode.ownerId,
            viewerId: viewerID,
            ownerDisplayName: sharingCode.ownerDisplayName,
            viewerDisplayName: viewerDisplayName,
            createdAt: Date(),
            status: .active
        )
        try viewerDocRef.setData(from: link)
        try db.collection("viewerLinks").document(viewerID).setData(from: link)
        return link
    }

    /// Vínculo activo del que soy dueño (alguien me ve), o `nil` si nadie.
    func myViewer(ownerID: String) async throws -> SharingLink? {
        let snapshot = try await viewersCollection(for: ownerID)
            .whereField("status", isEqualTo: SharingLink.Status.active.rawValue)
            .getDocuments()
        guard let document = snapshot.documents.first else { return nil }
        return try document.data(as: SharingLink.self)
    }

    /// Vínculo activo en el que soy el viewer (puedo ver a alguien), o `nil`.
    /// Lee directo el documento de `viewerLinks/{viewerId}` para evitar una
    /// consulta `collectionGroup`, igual que en la app RN.
    func mySharedAccount(viewerID: String) async throws -> SharingLink? {
        let document = try await db.collection("viewerLinks").document(viewerID).getDocument()
        guard document.exists else { return nil }
        let link = try document.data(as: SharingLink.self)
        return link.status == .active ? link : nil
    }

    /// Marca el vínculo como revocado en ambos lados. El historial se conserva
    /// para que pueda restaurarse con un código nuevo (mismo criterio que RN).
    func revokeAccess(ownerID: String, viewerID: String) async throws {
        let updates: [String: Any] = ["status": SharingLink.Status.revoked.rawValue]
        try await viewersCollection(for: ownerID).document(viewerID).updateData(updates)
        try await db.collection("viewerLinks").document(viewerID).updateData(updates)
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

    /// Copia del registro emocional con los campos de texto libre cifrados,
    /// lista para escribir. La emoción, la intensidad, la fecha y la
    /// visibilidad compartida no se cifran (igual que en la app RN).
    private func encrypted(_ entry: EmotionalRegisterEntry) -> EmotionalRegisterEntry {
        var result = entry
        result.emotionCustom = BloomCrypto.encrypt(entry.emotionCustom)
        result.vulnerability = BloomCrypto.encrypt(entry.vulnerability)
        result.trigger = BloomCrypto.encrypt(entry.trigger)
        result.interpretations = BloomCrypto.encrypt(entry.interpretations)
        result.internalSensations = BloomCrypto.encrypt(entry.internalSensations)
        result.externalLanguage = BloomCrypto.encrypt(entry.externalLanguage)
        result.impulses = BloomCrypto.encrypt(entry.impulses)
        result.behavior = BloomCrypto.encrypt(entry.behavior)
        result.consequences = BloomCrypto.encrypt(entry.consequences)
        result.emotionFunction = BloomCrypto.encrypt(entry.emotionFunction)
        return result
    }

    /// Copia del registro emocional con los campos de texto libre descifrados,
    /// lista para la UI.
    private func decrypted(_ entry: EmotionalRegisterEntry) -> EmotionalRegisterEntry {
        var result = entry
        result.emotionCustom = BloomCrypto.decrypt(entry.emotionCustom)
        result.vulnerability = BloomCrypto.decrypt(entry.vulnerability)
        result.trigger = BloomCrypto.decrypt(entry.trigger)
        result.interpretations = BloomCrypto.decrypt(entry.interpretations)
        result.internalSensations = BloomCrypto.decrypt(entry.internalSensations)
        result.externalLanguage = BloomCrypto.decrypt(entry.externalLanguage)
        result.impulses = BloomCrypto.decrypt(entry.impulses)
        result.behavior = BloomCrypto.decrypt(entry.behavior)
        result.consequences = BloomCrypto.decrypt(entry.consequences)
        result.emotionFunction = BloomCrypto.decrypt(entry.emotionFunction)
        return result
    }

    /// Copia de la entrada de gratitud con los motivos cifrados, lista para escribir.
    private func encrypted(_ entry: GratitudeEntry) -> GratitudeEntry {
        var result = entry
        result.items = entry.items.map(BloomCrypto.encrypt)
        return result
    }

    /// Copia de la entrada de gratitud con los motivos descifrados, lista para la UI.
    private func decrypted(_ entry: GratitudeEntry) -> GratitudeEntry {
        var result = entry
        result.items = entry.items.map(BloomCrypto.decrypt)
        return result
    }

    /// Copia del plan de seguridad con todos los textos cifrados, lista para
    /// escribir. `updatedAt` no se cifra (igual que en la app RN).
    private func encrypted(_ plan: SafetyPlan) -> SafetyPlan {
        var result = plan
        result.warningSigns = plan.warningSigns.map(BloomCrypto.encrypt)
        result.copingStrategies = plan.copingStrategies.map(BloomCrypto.encrypt)
        result.trustedContacts = plan.trustedContacts.map {
            TrustedContact(name: BloomCrypto.encrypt($0.name), phone: BloomCrypto.encrypt($0.phone))
        }
        result.personalSteps = plan.personalSteps.map(BloomCrypto.encrypt)
        return result
    }

    /// Copia del plan de seguridad con todos los textos descifrados, lista para la UI.
    private func decrypted(_ plan: SafetyPlan) -> SafetyPlan {
        var result = plan
        result.warningSigns = plan.warningSigns.map(BloomCrypto.decrypt)
        result.copingStrategies = plan.copingStrategies.map(BloomCrypto.decrypt)
        result.trustedContacts = plan.trustedContacts.map {
            TrustedContact(name: BloomCrypto.decrypt($0.name), phone: BloomCrypto.decrypt($0.phone))
        }
        result.personalSteps = plan.personalSteps.map(BloomCrypto.decrypt)
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
