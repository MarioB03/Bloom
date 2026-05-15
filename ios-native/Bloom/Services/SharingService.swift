import Foundation

/// Estado observable del flujo de compartir cuenta.
/// Equivalente nativo de `SharingContext` en `src/contexts/SharingContext.tsx`.
///
/// Carga los dos lados del vínculo —el viewer al que dejo ver mis datos y la
/// cuenta a la que yo puedo acceder— y los expone como propiedades reactivas
/// para que la `MainTabView` muestre la pestaña Compartido solo cuando hay
/// vínculo, y para que `SharingView` repinte tras canjear o revocar un código.
@Observable
@MainActor
final class SharingService {

    /// La persona que ve mis datos (soy el owner). `nil` si no he compartido.
    private(set) var viewer: SharingLink?

    /// La persona cuyos datos puedo ver (soy el viewer). `nil` si nadie me ha
    /// compartido.
    private(set) var sharedAccount: SharingLink?

    private(set) var isLoading = true

    /// Refresca los dos vínculos. Si no hay sesión, deja el estado a `nil`.
    func refresh(userID: String?, firestore: FirestoreService) async {
        guard let userID else {
            viewer = nil
            sharedAccount = nil
            isLoading = false
            return
        }
        // Awaits secuenciales (no `async let`): los modelos de Firestore no
        // son `Sendable`, así que no pueden cruzar fronteras de tarea.
        viewer = try? await firestore.myViewer(ownerID: userID)
        sharedAccount = try? await firestore.mySharedAccount(viewerID: userID)
        isLoading = false
    }
}
