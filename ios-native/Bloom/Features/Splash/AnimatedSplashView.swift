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

    // MARK: - Geometría de la flor (portada de RN)

    private static let petalAngles: [Double] = [-90, -18, 54, 126, 198]
    private static let petalW: CGFloat = 22
    private static let petalH: CGFloat = 50
    private static let petalSpread: CGFloat = 28
    private static let centerR: CGFloat = 14
    private static let stemH: CGFloat = 80
    private static let stemW: CGFloat = 3
    private static let leafW: CGFloat = 20
    private static let leafH: CGFloat = 36

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
                    .padding(.top, 20)
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

    /// Container de 140×200 con la flor compuesta de tallo, hoja, pétalos y
    /// centro. Cada pieza usa `offset` desde el centro del container.
    private var flower: some View {
        ZStack {
            stem
            leaf
            petals
            center
        }
        .frame(width: 140, height: 200)
    }

    /// Tallo: rectángulo marrón que crece desde abajo (`scaleY 0→1`).
    private var stem: some View {
        Rectangle()
            .fill(Color(hex: "8B7A6B"))
            .frame(width: Self.stemW, height: Self.stemH)
            .clipShape(Capsule())
            .scaleEffect(x: 1, y: stemScale, anchor: .bottom)
            // Ancla el tallo a la parte inferior del container.
            .offset(y: (200 - Self.stemH) / 2)
    }

    /// Hoja: gota verde-salvia que aparece a la izquierda del tallo, hacia su
    /// base. Aparece con un spring que combina escala + rotación (-20°→35°).
    private var leaf: some View {
        SplashLeafShape()
            .fill(Theme.Palette.secondary300)
            .frame(width: Self.leafW, height: Self.leafH)
            .rotationEffect(.degrees(-20 + (35 - -20) * Double(leafProgress)), anchor: .bottomLeading)
            .scaleEffect(leafProgress, anchor: .bottomLeading)
            .opacity(leafProgress)
            // Posición: a la derecha del tallo (50% + margen 2), 30pt sobre la base.
            .offset(x: 2 + Self.leafW / 2, y: 200 / 2 - 30 - Self.leafH / 2)
    }

    /// Cinco pétalos rosados anclados al centro de la flor, posicionados con
    /// los ángulos de `petalAngles` y un offset radial de `petalSpread`.
    private var petals: some View {
        ZStack {
            ForEach(Array(Self.petalAngles.enumerated()), id: \.offset) { index, angleDeg in
                let progress = petalProgress[index]
                let radians = angleDeg * .pi / 180
                let tx = CGFloat(cos(radians)) * Self.petalSpread
                let ty = CGFloat(sin(radians)) * Self.petalSpread

                SplashPetalShape()
                    .fill(Color(hex: "F0B8B8"))
                    .frame(width: Self.petalW, height: Self.petalH)
                    .rotationEffect(.degrees(angleDeg + 90))
                    .scaleEffect(progress)
                    .opacity(progress)
                    .offset(x: tx * progress, y: ty * progress)
            }
        }
        .frame(width: Self.petalSpread * 2 + Self.petalW, height: Self.petalSpread * 2 + Self.petalH)
        // Pétalos anclados arriba (top: 20 en RN).
        .offset(y: -((200 - (Self.petalSpread * 2 + Self.petalH)) / 2) + 20)
    }

    /// Centro dorado: círculo en el corazón del grupo de pétalos. Aparece con
    /// un spring más rebotón que el resto.
    private var center: some View {
        Circle()
            .fill(Theme.Palette.accent400)
            .frame(width: Self.centerR * 2, height: Self.centerR * 2)
            .scaleEffect(centerScale)
            // Centrado en la zona de pétalos: top 20 + spread + petalH/2 (RN).
            .offset(y: -((200 - (Self.petalSpread * 2 + Self.petalH)) / 2) + 20
                       + Self.petalSpread + Self.petalH / 2 - Self.centerR)
    }

    // MARK: - Coreografía

    /// Ejecuta la entrada respetando los delays y curvas del componente RN.
    /// Cada pieza se anima por su lado para no acoplarlas en una sola
    /// secuencia (los pétalos se solapan con la hoja y el centro).
    private func runEntranceAnimation() async {
        startTime = Date()

        // Tallo (inmediato, 350ms ease-out cubic ≈ `.easeOut(duration: 0.35)`).
        withAnimation(.easeOut(duration: 0.35)) { stemScale = 1 }

        // Hoja (delay 150ms, spring damping 10 / stiffness 130).
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

        // Título (delay 650ms, 400ms ease-out).
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

/// Pétalo: rectángulo con esquinas superiores muy redondeadas e inferiores
/// poco redondeadas. Equivalente a los `borderRadius` asimétricos de RN.
private struct SplashPetalShape: Shape {
    func path(in rect: CGRect) -> Path {
        let topRadius = rect.height * 0.8
        let bottomRadius = rect.height * 0.15
        return Path { path in
            path.move(to: CGPoint(x: rect.minX, y: rect.maxY - bottomRadius))
            path.addQuadCurve(
                to: CGPoint(x: rect.minX + bottomRadius, y: rect.maxY),
                control: CGPoint(x: rect.minX, y: rect.maxY)
            )
            path.addLine(to: CGPoint(x: rect.maxX - bottomRadius, y: rect.maxY))
            path.addQuadCurve(
                to: CGPoint(x: rect.maxX, y: rect.maxY - bottomRadius),
                control: CGPoint(x: rect.maxX, y: rect.maxY)
            )
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY + topRadius))
            path.addQuadCurve(
                to: CGPoint(x: rect.maxX - topRadius, y: rect.minY),
                control: CGPoint(x: rect.maxX, y: rect.minY)
            )
            path.addLine(to: CGPoint(x: rect.minX + topRadius, y: rect.minY))
            path.addQuadCurve(
                to: CGPoint(x: rect.minX, y: rect.minY + topRadius),
                control: CGPoint(x: rect.minX, y: rect.minY)
            )
            path.closeSubpath()
        }
    }
}

/// Hoja: gota con borde superior-izquierdo e inferior-derecho muy
/// redondeados. Mismo asimétrico que `LEAF_H * 0.8` / `0.15` en RN.
private struct SplashLeafShape: Shape {
    func path(in rect: CGRect) -> Path {
        let big = rect.height * 0.8
        let small = rect.height * 0.15
        return Path { path in
            path.move(to: CGPoint(x: rect.minX, y: rect.minY + big))
            path.addQuadCurve(
                to: CGPoint(x: rect.minX + big, y: rect.minY),
                control: CGPoint(x: rect.minX, y: rect.minY)
            )
            path.addLine(to: CGPoint(x: rect.maxX - small, y: rect.minY))
            path.addQuadCurve(
                to: CGPoint(x: rect.maxX, y: rect.minY + small),
                control: CGPoint(x: rect.maxX, y: rect.minY)
            )
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - big))
            path.addQuadCurve(
                to: CGPoint(x: rect.maxX - big, y: rect.maxY),
                control: CGPoint(x: rect.maxX, y: rect.maxY)
            )
            path.addLine(to: CGPoint(x: rect.minX + small, y: rect.maxY))
            path.addQuadCurve(
                to: CGPoint(x: rect.minX, y: rect.maxY - small),
                control: CGPoint(x: rect.minX, y: rect.maxY)
            )
            path.closeSubpath()
        }
    }
}

#Preview {
    AnimatedSplashView(isReady: false, onFinish: {})
}
