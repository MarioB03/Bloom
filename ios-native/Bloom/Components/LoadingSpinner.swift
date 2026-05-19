import SwiftUI

/// Indicador de carga a pantalla completa sobre el fondo de la app.
/// Portado de `src/components/ui/LoadingSpinner.tsx`.
struct LoadingSpinner: View {
    var body: some View {
        ZStack {
            Theme.Palette.background
                .ignoresSafeArea()
            ProgressView()
                .controlSize(.large)
                .tint(Theme.Palette.primary500)
        }
    }
}
