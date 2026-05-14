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
/// Portado de `app/agenda.tsx`: la animación de RN (el libro se desplaza y
/// crece desde el mini-libro, la portada gira sobre su lomo y el contenido
/// aparece) se recrea con SwiftUI a partir de un único valor `progress` 0→1.
/// `originFrame` es el marco del mini-libro del home en coordenadas globales;
/// el libro arranca ahí y vuelve ahí al cerrarse.
struct DiaryBookView: View {

    @Binding var isPresented: Bool
    /// Marco del mini-libro del home en coordenadas `.global`.
    let originFrame: CGRect

    /// 0 = cerrado (en el mini-libro), 1 = abierto a pantalla completa.
    @State private var progress: CGFloat = 0

    var body: some View {
        GeometryReader { proxy in
            let screen = proxy.frame(in: .global)
            // Si aún no se ha medido el mini-libro, se cae a una posición
            // razonable (abajo a la derecha) para no dividir por cero.
            let origin = originFrame.width > 1
                ? originFrame
                : CGRect(x: screen.maxX - 96, y: screen.maxY - 180, width: 64, height: 82)

            ZStack {
                // Fondo oscuro que se va revelando
                Color.black
                    .opacity(interpolate(progress, [0, 0.4], [0, 0.45]))

                // El libro: se desplaza y crece desde el mini-libro
                bookStack
                    .scaleEffect(
                        x: interpolate(progress, [0, 0.55, 1],
                                       [origin.width / screen.width, 0.92, 1]),
                        y: interpolate(progress, [0, 0.55, 1],
                                       [origin.height / screen.height, 0.92, 1]),
                        anchor: .center
                    )
                    .offset(
                        x: interpolate(progress, [0, 0.45],
                                       [origin.midX - screen.midX, 0]),
                        y: interpolate(progress, [0, 0.45],
                                       [origin.midY - screen.midY, 0])
                    )
                    .opacity(progress > 0.02 ? 1 : 0)
            }
        }
        .ignoresSafeArea()
        .presentationBackground(.clear)
        .onAppear {
            withAnimation(.spring(response: 0.7, dampingFraction: 0.82)) {
                progress = 1
            }
        }
    }

    /// Contenido del diario con la portada que gira sobre el lomo encima.
    private var bookStack: some View {
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
    }

    /// Cierra el libro con la animación inversa (vuelve al mini-libro) y
    /// desmonta la presentación.
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
