import SwiftUI

/// Interpolación lineal a tramos con los extremos fijados (clamp).
/// Recrea el `interpolate` de `react-native-reanimated` usado en `agenda.tsx`.
private func interpolate(_ x: CGFloat, _ stops: [CGFloat], _ values: [CGFloat]) -> CGFloat {
    if x <= stops[0] { return values[0] }
    if x >= stops[stops.count - 1] { return values[values.count - 1] }
    for index in 1..<stops.count where x <= stops[index] {
        let t = (x - stops[index - 1]) / (stops[index] - stops[index - 1])
        return values[index - 1] + t * (values[index] - values[index - 1])
    }
    return values[values.count - 1]
}

/// Diario a pantalla completa con animación de "libro que se abre", presentado
/// desde el mini-libro del home.
///
/// Portado de `app/agenda.tsx`: la animación de RN (el libro crece, la portada
/// gira sobre su lomo y el contenido aparece) se recrea con SwiftUI a partir de
/// un único valor `progress` 0→1. Divergencia: no se mide la posición exacta
/// del mini-libro; el libro crece centrado, que lee igual de bien.
struct DiaryBookView: View {

    @Binding var isPresented: Bool

    /// 0 = cerrado, 1 = abierto a pantalla completa.
    @State private var progress: CGFloat = 0

    var body: some View {
        ZStack {
            // Fondo oscuro que se va revelando
            Color.black
                .opacity(interpolate(progress, [0, 0.4], [0, 0.45]))
                .ignoresSafeArea()

            // El libro: contenido del diario + portada que gira sobre el lomo
            ZStack {
                NavigationStack {
                    DiaryView(onClose: close)
                        .toolbar(.hidden, for: .navigationBar)
                }
                .opacity(interpolate(progress, [0.7, 1], [0, 1]))

                BookCoverView()
                    .opacity(interpolate(progress, [0.2, 0.5, 0.75], [1, 0.7, 0]))
                    .rotation3DEffect(
                        .degrees(interpolate(progress, [0.2, 0.75], [0, -115])),
                        axis: (x: 0, y: 1, z: 0),
                        anchor: .leading,
                        perspective: 0.6
                    )
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .scaleEffect(interpolate(progress, [0, 0.55, 1], [0.25, 0.92, 1]))
            .opacity(progress > 0.02 ? 1 : 0)
        }
        .presentationBackground(.clear)
        .onAppear {
            withAnimation(.spring(response: 0.7, dampingFraction: 0.82)) {
                progress = 1
            }
        }
    }

    /// Cierra el libro con la animación inversa y desmonta la presentación.
    private func close() {
        withAnimation(.easeInOut(duration: 0.45)) {
            progress = 0
        } completion: {
            var transaction = Transaction()
            transaction.disablesAnimations = true
            withTransaction(transaction) { isPresented = false }
        }
    }
}
