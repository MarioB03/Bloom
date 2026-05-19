import Foundation
import UserNotifications

/// Ajustes del recordatorio diario. Equivalente a `ReminderSettings` de
/// `src/lib/notifications.ts` en la app React Native.
struct ReminderSettings: Codable, Equatable {
    var enabled: Bool
    var hour: Int
    var minute: Int

    static let `default` = ReminderSettings(enabled: false, hour: 20, minute: 0)
}

/// Programa y cancela un recordatorio diario local (`UNCalendarNotificationTrigger`)
/// y persiste los ajustes en `UserDefaults`. Sustituye a `src/lib/notifications.ts`
/// (Expo Notifications) por la API nativa de iOS.
///
/// El cuerpo del recordatorio se elige al azar entre 4 mensajes, igual que en
/// RN, para que el aviso diario no resulte monótono.
///
/// Se inyecta en `BloomApp` y se accede desde `ProfileView`.
@Observable
@MainActor
final class NotificationsService {

    /// Identificador único del recordatorio diario en
    /// `UNUserNotificationCenter`. Lo usamos para cancelar la notificación
    /// previa antes de programar una nueva.
    static let dailyReminderID = "bloom.daily-reminder"

    private static let settingsKey = "bloom.reminderSettings"

    private(set) var settings: ReminderSettings = .default

    /// Mensajes posibles del recordatorio diario; se elige uno al azar al
    /// programar la notificación. Portados literalmente de `notifications.ts`.
    private static let messages: [(title: String, body: String)] = [
        ("🌿 ¿Cómo estás?", "Dedica un momento a registrar cómo te sientes hoy"),
        ("🌱 Tu jardín te espera", "Haz tu check-in diario y observa tu crecimiento"),
        ("🌸 Momento de reflexión", "Registra tu emoción del día y sigue tu racha"),
        ("✨ Cuida tu bienestar", "Un check-in rápido puede hacer la diferencia"),
    ]

    init() {
        load()
    }

    // MARK: - Persistencia

    /// Carga los ajustes desde `UserDefaults`. Si no hay ninguno guardado o el
    /// JSON está corrupto, mantiene el valor por defecto (desactivado, 20:00).
    private func load() {
        guard let data = UserDefaults.standard.data(forKey: Self.settingsKey),
              let decoded = try? JSONDecoder().decode(ReminderSettings.self, from: data)
        else { return }
        settings = decoded
    }

    private func save() {
        guard let data = try? JSONEncoder().encode(settings) else { return }
        UserDefaults.standard.set(data, forKey: Self.settingsKey)
    }

    // MARK: - API pública

    /// Aplica nuevos ajustes: guarda en `UserDefaults`, cancela el recordatorio
    /// existente y, si está activado, pide permiso (si hace falta) y programa el
    /// nuevo. Devuelve `false` cuando el usuario activa el recordatorio pero
    /// niega el permiso de notificaciones — el llamador puede revertir el toggle.
    @discardableResult
    func update(_ newSettings: ReminderSettings) async -> Bool {
        settings = newSettings
        save()

        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [Self.dailyReminderID])

        guard newSettings.enabled else { return true }

        let granted = await requestPermission()
        guard granted else {
            // Si no hay permiso, revertimos el flag para que la UI lo refleje.
            settings.enabled = false
            save()
            return false
        }

        schedule()
        return true
    }

    /// Pide permiso de notificaciones (alerta + sonido). Devuelve `true` si el
    /// usuario ya lo había concedido o lo concede ahora, `false` si lo deniega o
    /// si el sistema falla al consultarlo.
    func requestPermission() async -> Bool {
        let center = UNUserNotificationCenter.current()
        let current = await center.notificationSettings()
        switch current.authorizationStatus {
        case .authorized, .provisional, .ephemeral:
            return true
        case .denied:
            return false
        case .notDetermined:
            return (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false
        @unknown default:
            return false
        }
    }

    // MARK: - Programación

    /// Programa el recordatorio diario con un `UNCalendarNotificationTrigger`
    /// repetitivo (mismo patrón que `Notifications.scheduleNotificationAsync`
    /// con `DAILY` trigger en RN).
    private func schedule() {
        let message = Self.messages.randomElement() ?? Self.messages[0]

        let content = UNMutableNotificationContent()
        content.title = message.title
        content.body = message.body
        content.sound = .default

        var components = DateComponents()
        components.hour = settings.hour
        components.minute = settings.minute
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)

        let request = UNNotificationRequest(
            identifier: Self.dailyReminderID,
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().add(request)
    }
}
