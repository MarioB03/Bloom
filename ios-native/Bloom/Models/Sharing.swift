import Foundation

/// Documento `sharingCodes/{code}`: un código de 6 caracteres que el dueño
/// genera y comparte para invitar a alguien a ver su jardín. Caduca a las
/// 24 horas de su creación.
struct SharingCode: Codable, Sendable {
    let code: String
    let ownerId: String
    let ownerDisplayName: String
    let createdAt: Date
    let expiresAt: Date
}

/// Documento `users/{ownerId}/viewers/{viewerId}` —y su lookup inverso
/// `viewerLinks/{viewerId}`— con la relación viewer ↔ owner.
///
/// `active` deja al viewer ver los datos en solo lectura; `revoked` la
/// bloquea sin borrar el historial. Si el dueño quiere romper el vínculo
/// para siempre, lo marca como revocado (no se borra, igual que en RN).
struct SharingLink: Identifiable, Codable, Sendable {
    enum Status: String, Codable, Sendable {
        case active, revoked
    }

    var id: String { viewerId }
    let ownerId: String
    let viewerId: String
    let ownerDisplayName: String
    let viewerDisplayName: String
    let createdAt: Date
    var status: Status
}

/// Errores del flujo de canje de código de invitación, alineados con los
/// que lanza `redeemSharingCode` en la app RN para que los textos coincidan.
enum SharingError: LocalizedError {
    case invalidCode
    case codeExpired
    case cannotLinkSelf
    case alreadyLinked
    case linkRevoked

    var errorDescription: String? {
        switch self {
        case .invalidCode: return Strings.Sharing.errorInvalidCode
        case .codeExpired: return Strings.Sharing.errorExpiredCode
        case .cannotLinkSelf: return Strings.Sharing.errorSelfLink
        case .alreadyLinked: return Strings.Sharing.errorAlreadyLinked
        case .linkRevoked: return Strings.Sharing.errorLinkRevoked
        }
    }
}
