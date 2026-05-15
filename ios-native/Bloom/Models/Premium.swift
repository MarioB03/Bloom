import Foundation
import FirebaseFirestore

/// Origen del Premium activo. Suscripción tiene prioridad sobre código de
/// regalo a efectos de visualización (mismo criterio que RN).
enum PremiumSource: String, Codable, Sendable {
    case giftCode = "gift_code"
    case subscription
}

/// Estado Premium guardado en `users/{userId}.premium`.
struct PremiumStatus: Codable, Sendable, Equatable {
    var isActive: Bool
    var source: PremiumSource?
    var expiresAt: Date?
    var giftCode: String?
    var activatedAt: Date?
}

/// Documento `premiumCodes/{code}`. Un código de 6 caracteres con caducidad
/// (para canjearlo) y duración (días de Premium que otorga al canjear).
struct PremiumCode: Codable, Sendable {

    enum Status: String, Codable, Sendable {
        case active, redeemed, expired
    }

    let code: String
    let createdBy: String
    let createdAt: Date
    let expiresAt: Date
    let durationDays: Int
    var redeemedBy: String?
    var redeemedAt: Date?
    var status: Status
}

/// Errores del flujo de canje de código de regalo, alineados con los del
/// servicio RN para mensajes coherentes.
enum PremiumCodeError: LocalizedError {
    case invalid
    case alreadyRedeemed
    case expired
    case noSession

    var errorDescription: String? {
        switch self {
        case .invalid: return Strings.Premium.errorInvalidCode
        case .alreadyRedeemed: return Strings.Premium.errorAlreadyRedeemed
        case .expired: return Strings.Premium.errorExpiredCode
        case .noSession: return "No hay sesión activa"
        }
    }
}
