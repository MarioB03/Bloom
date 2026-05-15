import Foundation

/// Forma de tratamiento seleccionada por el usuario, persistida en local y
/// sincronizada con `users/{uid}.preferences.genderForm` en Firestore.
/// Equivalente nativo de `GenderContext` en `src/contexts/GenderContext.tsx`.
///
/// La carga es en dos pasos, igual que en RN:
/// 1. **Local primero** (`UserDefaults`) — instantáneo, sin esperar a Firestore.
/// 2. **Firestore después** — autoritativo cuando hay sesión, sobreescribe local.
///
/// Si el documento de perfil aún no existe (cuenta nueva) o falla la lectura,
/// el servicio se queda con lo que tenga en local o, en su defecto, `.neutro`.
@Observable
@MainActor
final class GenderService {

    private static let storageKey = "bloom.genderForm"

    /// Forma actual del usuario. Se inicializa desde `UserDefaults`; `sync`
    /// puede sobreescribirla con el valor de Firestore.
    private(set) var form: GenderForm

    init() {
        if let raw = UserDefaults.standard.string(forKey: Self.storageKey),
           let stored = GenderForm(rawValue: raw) {
            form = stored
        } else {
            form = .neutro
        }
    }

    /// Sincroniza desde el perfil remoto si lo hay. Best-effort: si falla,
    /// se conserva el valor en memoria.
    func sync(userID: String?, firestore: FirestoreService) async {
        guard let userID else {
            // Sesión cerrada: deja la última forma elegida (se borra al
            // desinstalar la app, no hace falta limpiar aquí).
            return
        }
        if let remote = try? await firestore.genderPreference(userID: userID) {
            applyLocal(form: remote)
        }
    }

    /// Cambia la forma. Persiste local y, si hay sesión, también en Firestore.
    /// Si Firestore falla, se conserva el cambio local (mismo criterio que RN).
    func update(form: GenderForm, userID: String?, firestore: FirestoreService) async {
        applyLocal(form: form)
        guard let userID else { return }
        try? await firestore.updateGenderPreference(userID: userID, form: form)
    }

    /// Resuelve un texto con flexión usando la forma actual.
    func resolve(_ text: GenderedText) -> String {
        switch form {
        case .femenino: return text.f
        case .masculino: return text.m
        case .neutro: return text.n
        }
    }

    private func applyLocal(form: GenderForm) {
        self.form = form
        UserDefaults.standard.set(form.rawValue, forKey: Self.storageKey)
    }
}
