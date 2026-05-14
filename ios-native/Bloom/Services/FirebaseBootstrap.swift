import FirebaseCore

/// Arranque de Firebase. Se llama una sola vez al inicio de la app,
/// antes de instanciar cualquier servicio que dependa de Firebase.
enum FirebaseBootstrap {
    static func configure() {
        FirebaseApp.configure()
    }
}
