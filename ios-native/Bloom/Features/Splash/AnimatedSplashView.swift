import SwiftUI

/// Splash animado de bienvenida — una flor que crece (tallo, hoja, pétalos,
/// centro) y el lockup "Bloom · Tu jardín de bienestar" que entra detrás.
/// Equivalente nativo de `src/components/ui/AnimatedSplash.tsx`.
///
/// Se muestra como overlay sobre el contenido principal hasta que `isReady`
/// es `true` y se han mostrado al menos `minDisplay` segundos. Tras eso, el
/// contenedor se desvanece y llama a `onFinish` para que el padre lo retire.
struct AnimatedSplashView: View {

    /// `true` cuando el resto de la app está lista (sesión resuelta). El
    /// splash espera al menos `minDisplay` segundos antes de salir.
    let isReady: Bool
    /// Callback al terminar la animación de salida. El padre debe ocultar el
    /// splash en respuesta.
    let onFinish: () -> Void

    // MARK: - Estado animable

    @State private var stemScale: CGFloat = 0
    @State private var leafProgress: CGFloat = 0
    @State private var petalProgress: [CGFloat] = Array(repeating: 0, count: 5)
    @State private var centerScale: CGFloat = 0
    @State private var titleOpacity: Double = 0
    @State private var titleOffset: CGFloat = 20
    @State private var subtitleOpacity: Double = 0
    @State private var subtitleOffset: CGFloat = 20
    @State private var containerOpacity: Double = 1
    @State private var containerScale: CGFloat = 1
    @State private var startTime = Date()
    @State private var exiting = false

    // MARK: - Geometría de la flor

    /// Ángulos de los 5 pétalos. Empiezan en -90° (arriba) y avanzan cada
    /// 72° en sentido horario para formar una estrella simétrica de 5 puntas.
    private static let petalAngles: [Double] = (0..<5).map { -90 + Double($0) * 72 }
    private static let petalW: CGFloat = 22
    private static let petalH: CGFloat = 48
    private static let petalSpread: CGFloat = 24
    private static let centerR: CGFloat = 12
    private static let stemW: CGFloat = 3
    private static let leafW: CGFloat = 22
    private static let leafH: CGFloat = 32

    /// Tamaño del lienzo de la flor en puntos.
    private static let canvasW: CGFloat = 200
    private static let canvasH: CGFloat = 220

    /// Posición vertical del centro de la flor (donde se encuentran los
    /// pétalos y el círculo dorado). El tallo se calcula a partir de aquí
    /// para que su punta toque exactamente este punto, sin huecos.
    private static let flowerCenterY: CGFloat = 110

    /// Altura del tallo: desde el borde inferior del lienzo hasta el centro
    /// de la flor.
    private static let stemH: CGFloat = canvasH - flowerCenterY

    /// Tiempo mínimo que se muestra el splash antes de poder salir, incluso si
    /// la app está lista antes. Evita un parpadeo cuando la sesión se resuelve
    /// instantáneamente.
    private static let minDisplay: TimeInterval = 1.6

    // MARK: - Cuerpo

    var body: some View {
        ZStack {
            Theme.Palette.background.ignoresSafeArea()

            VStack(spacing: 6) {
                flower
                Text(Strings.App.name)
                    .font(.custom("DMSerifDisplay-Regular", size: 36))
                    .foregroundStyle(Theme.Palette.primary400)
                    .opacity(titleOpacity)
                    .offset(y: titleOffset)
                    .padding(.top, 12)
                Text("Tu jardín de bienestar")
                    .font(.custom("DMSans-Regular", size: 15))
                    .foregroundStyle(Theme.Palette.neutral400)
                    .opacity(subtitleOpacity)
                    .offset(y: subtitleOffset)
            }
        }
        .opacity(containerOpacity)
        .scaleEffect(containerScale)
        .allowsHitTesting(false)
        .task { await runEntranceAnimation() }
        .onChange(of: isReady) { _, ready in
            if ready { Task { await scheduleExit() } }
        }
    }

    // MARK: - Flor

    /// Lienzo `canvasW × canvasH` con coordenadas absolutas. El centro
    /// horizontal está en `canvasW/2`. El tallo crece desde el borde inferior
    /// hasta `flowerCenterY` y los pétalos parten de ahí.
    private var flower: some View {
        ZStack(alignment: .topLeading) {
            stem
            leaf
            petalGroup
            center
        }
        .frame(width: Self.canvasW, height: Self.canvasH)
    }

    /// Tallo: cápsula sage que crece desde el borde inferior con `scaleY 0→1`.
    /// El tono coincide con el `#8BA888` del mark de marca v3.
    private var stem: some View {
        Capsule()
            .fill(Theme.Palette.secondary400)
            .frame(width: Self.stemW, height: Self.stemH)
            .scaleEffect(x: 1, y: stemScale, anchor: .bottom)
            .position(
                x: Self.canvasW / 2,
                y: Self.canvasH - Self.stemH / 2
            )
    }

    /// Hoja: gota verde-salvia que asoma a la derecha del tallo, hacia la mitad
    /// de su altura. Aparece con un spring que combina escala + rotación.
    private var leaf: some View {
        let rotation = -10 + 35 * Double(leafProgress)
        return SplashLeafShape()
            .fill(Theme.Palette.secondary400)
            .frame(width: Self.leafW, height: Self.leafH)
            .rotationEffect(.degrees(rotation), anchor: .bottomLeading)
            .scaleEffect(leafProgress, anchor: .bottomLeading)
            .opacity(leafProgress)
            .position(
                x: Self.canvasW / 2 + Self.stemW / 2 + Self.leafW / 2,
                y: Self.canvasH - Self.stemH * 0.55
            )
    }

    /// Cinco pétalos rosados anclados al centro de la flor, posicionados con
    /// los ángulos de `petalAngles` y un offset radial de `petalSpread`.
    private var petalGroup: some View {
        ZStack {
            ForEach(Array(Self.petalAngles.enumerated()), id: \.offset) { index, angleDeg in
                petal(angleDeg: angleDeg, progress: petalProgress[index])
            }
        }
        .frame(width: Self.canvasW, height: Self.canvasH)
    }

    /// Un único pétalo, anclado por su base al centro de la flor y rotado para
    /// apuntar hacia `angleDeg`. La animación de entrada combina escala +
    /// opacidad; el desplazamiento radial está implícito en el anclaje, no se
    /// necesita un offset extra.
    private func petal(angleDeg: Double, progress: CGFloat) -> some View {
        // Pétalo dibujado con la base abajo (anchor) y la punta arriba. El
        // anchor `.bottom` hace que la rotación pivote sobre el centro de la
        // flor, no sobre el centro geométrico del rect, así no hay huecos. El
        // tono terracota (`#C4725A`) coincide con los pétalos del símbolo v3.
        SplashPetalShape()
            .fill(Theme.Palette.primary400)
            .frame(width: Self.petalW, height: Self.petalH)
            // Pivota desde la base + rota hacia afuera. `angleDeg + 90` lleva
            // un pétalo "punta arriba" hacia el ángulo deseado.
            .scaleEffect(progress, anchor: .bottom)
            .opacity(progress)
            .rotationEffect(.degrees(angleDeg + 90), anchor: .bottom)
            // Posiciona la BASE del pétalo en el centro de la flor. El frame
            // mide `petalW × petalH` con el pétalo dibujado punta-arriba (la
            // base está en `local y = petalH`), y `.position` centra ese frame
            // en el punto dado — para que la base caiga en `flowerCenterY`,
            // el centro del frame queda `petalH/2` POR ENCIMA.
            .position(
                x: Self.canvasW / 2,
                y: Self.flowerCenterY - Self.petalH / 2
            )
    }

    /// Centro dorado: círculo en el corazón del grupo de pétalos. Aparece con
    /// un spring más rebotón que el resto.
    private var center: some View {
        Circle()
            .fill(Theme.Palette.accent400)
            .frame(width: Self.centerR * 2, height: Self.centerR * 2)
            .scaleEffect(centerScale)
            .position(x: Self.canvasW / 2, y: Self.flowerCenterY)
    }

    // MARK: - Coreografía

    /// Ejecuta la entrada respetando los delays y curvas del componente RN.
    private func runEntranceAnimation() async {
        startTime = Date()

        // Tallo (inmediato, 350ms ease-out cubic).
        withAnimation(.easeOut(duration: 0.35)) { stemScale = 1 }

        // Hoja (delay 150ms, spring).
        Task {
            try? await Task.sleep(nanoseconds: 150_000_000)
            withAnimation(.spring(response: 0.45, dampingFraction: 0.5)) {
                leafProgress = 1
            }
        }

        // Pétalos en stagger (200 + i * 70ms).
        for index in 0..<Self.petalAngles.count {
            let delay = 200 + index * 70
            Task {
                try? await Task.sleep(nanoseconds: UInt64(delay) * 1_000_000)
                withAnimation(.spring(response: 0.5, dampingFraction: 0.55)) {
                    petalProgress[index] = 1
                }
            }
        }

        // Centro (delay 500ms, spring más rebotón).
        Task {
            try? await Task.sleep(nanoseconds: 500_000_000)
            withAnimation(.spring(response: 0.5, dampingFraction: 0.4)) {
                centerScale = 1
            }
        }

        // Título (delay 650ms).
        Task {
            try? await Task.sleep(nanoseconds: 650_000_000)
            withAnimation(.easeOut(duration: 0.4)) {
                titleOpacity = 1
                titleOffset = 0
            }
        }

        // Subtítulo (delay 850ms).
        Task {
            try? await Task.sleep(nanoseconds: 850_000_000)
            withAnimation(.easeOut(duration: 0.4)) {
                subtitleOpacity = 1
                subtitleOffset = 0
            }
        }
    }

    /// Espera a que se cumpla el tiempo mínimo de exposición y lanza la
    /// animación de salida (fade + ligero scale 1.05). Al terminar, avisa al
    /// padre con `onFinish`.
    private func scheduleExit() async {
        guard !exiting else { return }
        exiting = true

        let elapsed = Date().timeIntervalSince(startTime)
        let remaining = max(0, Self.minDisplay - elapsed)
        if remaining > 0 {
            try? await Task.sleep(nanoseconds: UInt64(remaining * 1_000_000_000))
        }

        withAnimation(.easeIn(duration: 0.4)) {
            containerOpacity = 0
            containerScale = 1.05
        }
        try? await Task.sleep(nanoseconds: 400_000_000)
        onFinish()
    }
}

// MARK: - Formas

/// Pétalo en forma de gota: punta arriba, base abajo, lados convexos. Se
/// dibuja con dos curvas Bézier simétricas que arrancan en la base, suben
/// por los lados y se juntan en la punta.
private struct SplashPetalShape: Shape {
    func path(in rect: CGRect) -> Path {
        let w = rect.width
        let h = rect.height
        let tip = CGPoint(x: w / 2, y: 0)
        let baseLeft = CGPoint(x: 0, y: h)
        let baseRight = CGPoint(x: w, y: h)

        return Path { path in
            path.move(to: baseLeft)
            // Lado izquierdo: curva hacia la punta, control fuera del rect
            // para dar volumen al pétalo.
            path.addQuadCurve(to: tip, control: CGPoint(x: -w * 0.1, y: h * 0.25))
            // Lado derecho: simétrico.
            path.addQuadCurve(to: baseRight, control: CGPoint(x: w * 1.1, y: h * 0.25))
            // Cierra la base con una curva ligera (no un segmento recto)
            // para suavizar la unión con el centro.
            path.addQuadCurve(to: baseLeft, control: CGPoint(x: w / 2, y: h * 1.1))
            path.closeSubpath()
        }
    }
}

/// Hoja: gota asimétrica con el extremo superior-izquierdo afilado y el
/// inferior-derecho redondeado. Se ancla por la esquina inferior izquierda
/// (donde se une al tallo).
private struct SplashLeafShape: Shape {
    func path(in rect: CGRect) -> Path {
        let w = rect.width
        let h = rect.height
        let topTip = CGPoint(x: w * 0.15, y: 0)
        let bottomTip = CGPoint(x: w, y: h)

        return Path { path in
            path.move(to: topTip)
            path.addQuadCurve(
                to: bottomTip,
                control: CGPoint(x: w * 1.2, y: h * 0.2)
            )
            path.addQuadCurve(
                to: topTip,
                control: CGPoint(x: -w * 0.2, y: h * 0.8)
            )
            path.closeSubpath()
        }
    }
}

#Preview {
    AnimatedSplashView(isReady: false, onFinish: {})
}
