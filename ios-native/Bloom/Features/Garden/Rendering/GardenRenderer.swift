import SwiftUI

/// Dibujo de la escena del jardín sobre un `GraphicsContext`. Equivalente
/// nativo (estático, sin animación) del lienzo Skia de
/// `src/components/garden/GardenCanvas.tsx`.
///
/// Las funciones son puras: reciben el contexto y los datos y dibujan. La
/// animación (vaivén, partículas, atmósfera) llegará en una fase posterior.
enum GardenRenderer {

    // MARK: - Cielo

    /// Dibuja el gradiente de cielo de fondo, según estación, hora y cosméticos.
    static func drawSky(
        in context: GraphicsContext,
        size: CGSize,
        season: Season,
        cosmetics: CosmeticOverrides,
        now: Date = Date()
    ) {
        let theme = season.theme
        let hour = Calendar.current.component(.hour, from: now)
        let isNight = hour < 6 || hour >= 20

        let colors: [Color]
        if cosmetics.sunsetSky {
            colors = [CosmeticOverrides.sunsetSky.top, CosmeticOverrides.sunsetSky.bottom]
        } else if isNight {
            colors = [theme.skyTopNight, theme.skyBottomNight]
        } else {
            colors = [theme.skyTopDay, theme.skyBottomDay]
        }

        context.fill(
            Path(CGRect(origin: .zero, size: size)),
            with: .linearGradient(
                Gradient(colors: colors),
                startPoint: .zero,
                endPoint: CGPoint(x: 0, y: size.height)
            )
        )
    }

    // MARK: - Baldosas

    /// Dibuja la rejilla isométrica de baldosas-diamante, alternando dos tonos
    /// como un tablero. Las celdas del anillo de vista previa van translúcidas.
    static func drawTiles(
        in context: GraphicsContext,
        offset: CGPoint,
        gridSize: Int,
        season: Season
    ) {
        let theme = season.theme

        for gy in 0..<gridSize {
            for gx in 0..<gridSize {
                let corners = GardenIso.tileCorners(gx: gx, gy: gy, offset: offset)
                var path = Path()
                path.move(to: corners.top)
                path.addLine(to: corners.right)
                path.addLine(to: corners.bottom)
                path.addLine(to: corners.left)
                path.closeSubpath()

                let base = (gx + gy).isMultiple(of: 2) ? theme.tileBase1 : theme.tileBase2
                context.fill(path, with: .color(base))
                context.stroke(path, with: .color(theme.groundColor.darkened(0.08)), lineWidth: 0.5)
            }
        }
    }

    // MARK: - Plantas

    /// Dibuja una planta completa (sombra, tallo, hojas y flor) en su celda.
    /// El aspecto depende de la emoción (morfología) y la etapa de crecimiento;
    /// `time` (segundos) anima el vaivén suave del tallo.
    static func drawPlant(
        _ plant: PlantPlacement,
        in context: GraphicsContext,
        offset: CGPoint,
        season: Season,
        time: Double
    ) {
        let base = GardenIso.toScreen(gx: plant.gx, gy: plant.gy, offset: offset)
        let morphology = plant.emotion.plantMorphology
        let stage = plant.growthStage
        let bloomColor = plant.emotion.config.color
        let leafColor = season.theme.leafTint

        // Sombra en el suelo — no se balancea.
        let shadow = Path(ellipseIn: CGRect(x: base.x - 11, y: base.y - 3, width: 22, height: 7))
        context.fill(shadow, with: .color(.black.opacity(0.12)))

        // Etapa 0: solo un montículo de semilla, sin vaivén.
        guard stage >= 1 else {
            let seed = Path(ellipseIn: CGRect(x: base.x - 4, y: base.y - 6, width: 8, height: 6))
            context.fill(seed, with: .color(Color(hex: "8B6F47")))
            return
        }

        // Vaivén: tallo, hojas y flor oscilan alrededor de la base. La fase
        // depende de la celda para que cada planta se mueva distinto.
        let swayPhase = Double(plant.gx) * 1.7 + Double(plant.gy) * 2.3
        let swayAngle = sin(time * 1.05 + swayPhase) * 0.05
        var ctx = context
        ctx.translateBy(x: base.x, y: base.y)
        ctx.rotate(by: .radians(swayAngle))
        ctx.translateBy(x: -base.x, y: -base.y)

        // Tallo — su altura crece con la etapa y la intensidad de la emoción.
        let intensityFactor = 0.7 + Double(plant.intensity) * 0.06
        let fullStem = (morphology.stemHeight.lowerBound
            + (morphology.stemHeight.upperBound - morphology.stemHeight.lowerBound)
            * CGFloat(intensityFactor))
        let stemFraction: CGFloat = [0, 0.35, 0.6, 0.8, 0.92, 1.0][min(stage, 5)]
        let stemHeight = fullStem * stemFraction
        let stemTop = CGPoint(x: base.x, y: base.y - stemHeight)

        var stem = Path()
        stem.move(to: base)
        stem.addLine(to: stemTop)
        ctx.stroke(stem, with: .color(leafColor), style: StrokeStyle(lineWidth: 2.5, lineCap: .round))

        // Hojas — 1 en etapa 1, 2 en etapa 2, todas a partir de la 3.
        let visibleLeaves = stage == 1 ? 1 : (stage == 2 ? 2 : morphology.leafCount)
        for index in 0..<visibleLeaves {
            let t = CGFloat(index + 1) / CGFloat(morphology.leafCount + 1)
            let leafY = base.y - stemHeight * t
            let side: CGFloat = index.isMultiple(of: 2) ? 1 : -1
            let leafCenter = CGPoint(x: base.x + side * morphology.leafSize.width * 0.7, y: leafY)
            var leaf = Path(ellipseIn: CGRect(
                x: -morphology.leafSize.width / 2,
                y: -morphology.leafSize.height / 2,
                width: morphology.leafSize.width,
                height: morphology.leafSize.height
            ))
            leaf = leaf.applying(
                CGAffineTransform(rotationAngle: side * 0.6)
                    .concatenating(CGAffineTransform(translationX: leafCenter.x, y: leafCenter.y))
            )
            ctx.fill(leaf, with: .color(leafColor.lightened(0.1)))
        }

        // Flor — aparece a partir de la etapa 3, con cada vez más pétalos.
        guard stage >= 3 else { return }
        let petalFraction: CGFloat = [0, 0, 0, 0.4, 0.7, 1.0][min(stage, 5)]
        let visiblePetals = max(1, Int((CGFloat(morphology.petalCount) * petalFraction).rounded()))
        let petalSize = morphology.petalSize * CGFloat(intensityFactor)

        for index in 0..<visiblePetals {
            let angle = (2 * .pi * Double(index) / Double(morphology.petalCount)) - .pi / 2
            let petalCenter = CGPoint(
                x: stemTop.x + cos(angle) * morphology.petalSpread,
                y: stemTop.y + sin(angle) * morphology.petalSpread
            )
            let petal = petalPath(shape: morphology.petalShape, size: petalSize)
                .applying(
                    CGAffineTransform(rotationAngle: angle + .pi / 2)
                        .concatenating(CGAffineTransform(translationX: petalCenter.x, y: petalCenter.y))
                )
            ctx.fill(petal, with: .color(bloomColor))
        }

        // Centro de la flor.
        let centerRadius = petalSize * 0.7
        let center = Path(ellipseIn: CGRect(
            x: stemTop.x - centerRadius,
            y: stemTop.y - centerRadius,
            width: centerRadius * 2,
            height: centerRadius * 2
        ))
        ctx.fill(center, with: .color(bloomColor.darkened(0.2)))

        // Emoji central — solo en floración completa.
        if stage >= 5, let emoji = morphology.centerEmoji {
            ctx.draw(
                Text(emoji).font(.system(size: petalSize * 1.6)),
                at: stemTop
            )
        }
    }

    /// Forma de un pétalo centrada en el origen, según su tipo.
    private static func petalPath(shape: PetalShape, size: CGFloat) -> Path {
        switch shape {
        case .round:
            return Path(ellipseIn: CGRect(x: -size * 0.65, y: -size * 0.65, width: size * 1.3, height: size * 1.3))
        case .elongated:
            return Path(ellipseIn: CGRect(x: -size * 0.4, y: -size * 0.9, width: size * 0.8, height: size * 1.8))
        case .pointed:
            var path = Path()
            let w = size * 0.7
            let h = size * 1.6
            path.move(to: CGPoint(x: 0, y: -h))
            path.addQuadCurve(to: CGPoint(x: 0, y: h * 0.4), control: CGPoint(x: w, y: 0))
            path.addQuadCurve(to: CGPoint(x: 0, y: -h), control: CGPoint(x: -w, y: 0))
            path.closeSubpath()
            return path
        }
    }

    // MARK: - Decoraciones

    /// Dibuja una decoración en su celda. Por ahora se representa con su emoji;
    /// las formas Skia personalizadas de la app RN se portarán más adelante.
    static func drawDecoration(
        _ decoration: DecorationPlacement,
        in context: GraphicsContext,
        offset: CGPoint
    ) {
        let base = GardenIso.toScreen(gx: decoration.gx, gy: decoration.gy, offset: offset)

        let shadow = Path(ellipseIn: CGRect(x: base.x - 11, y: base.y - 3, width: 22, height: 7))
        context.fill(shadow, with: .color(.black.opacity(0.12)))

        context.draw(
            Text(decoration.type.config.emoji).font(.system(size: 26)),
            at: CGPoint(x: base.x, y: base.y - 12)
        )
    }

    // MARK: - Atmósfera

    /// `true` si es de noche (antes de las 6h o desde las 20h).
    static func isNight(_ now: Date = Date()) -> Bool {
        let hour = Calendar.current.component(.hour, from: now)
        return hour < 6 || hour >= 20
    }

    /// Sol pulsante (de día, racha ≥ 2) o luna (de noche) en la esquina superior.
    static func drawCelestial(
        in context: GraphicsContext,
        size: CGSize,
        streak: Int,
        time: Double,
        now: Date = Date()
    ) {
        let center = CGPoint(x: size.width - 45, y: 38)

        if isNight(now) {
            fillCircle(in: context, center: center, radius: 14,
                       color: Color(.sRGB, red: 220 / 255, green: 220 / 255, blue: 240 / 255, opacity: 0.12))
            fillCircle(in: context, center: center, radius: 10, color: Color(hex: "E8E0E8"))
            return
        }

        guard streak >= 2 else { return }
        let p = time / 10
        let baseR = 14 + Double(min(streak, 10))
        let r = baseR + sin(p * .pi * 4) * 2
        let glowR = baseR + 8 + sin(p * .pi * 2) * 3
        fillCircle(in: context, center: center, radius: glowR,
                   color: Color(.sRGB, red: 248 / 255, green: 200 / 255, blue: 80 / 255, opacity: 0.08))
        fillCircle(in: context, center: center, radius: r, color: Color(hex: "F5D48A"))
        fillCircle(in: context, center: center, radius: r * 0.75, color: Color(hex: "FCEBC4"))
    }

    /// Estrellas titilantes — solo de noche y con racha ≥ 5.
    static func drawStars(
        in context: GraphicsContext,
        size: CGSize,
        streak: Int,
        time: Double,
        now: Date = Date()
    ) {
        guard isNight(now), streak >= 5 else { return }
        let count = min(streak, 30)
        for i in 0..<count {
            let cx = (Double(i) * 137.508).truncatingRemainder(dividingBy: size.width)
            let cy = (Double(i) * 97.3).truncatingRemainder(dividingBy: size.height * 0.35) + 5
            let radius = 0.8 + Double(i % 3) * 0.4
            let phase = Double(i) * 2.3
            let opacity = 0.25 + sin(time * 1.2 + phase) * 0.25 + 0.1
            fillCircle(
                in: context,
                center: CGPoint(x: cx, y: cy),
                radius: radius,
                color: Color(.sRGB, red: 1, green: 1, blue: 240 / 255, opacity: opacity)
            )
        }
    }

    /// Nubes que se desplazan despacio — aparecen con racha ≥ 3.
    static func drawClouds(
        in context: GraphicsContext,
        size: CGSize,
        streak: Int,
        time: Double,
        now: Date = Date()
    ) {
        guard streak >= 3 else { return }
        let count = streak >= 10 ? 3 : (streak >= 5 ? 2 : 1)
        let color = isNight(now)
            ? Color(.sRGB, red: 180 / 255, green: 180 / 255, blue: 210 / 255, opacity: 0.08)
            : Color(white: 1, opacity: 0.18)
        let width = Double(size.width)
        let range = width + 120

        for i in 0..<count {
            let baseX = width * (0.1 + Double(i) * 0.35)
            let baseY = 22 + Double(i) * 14
            let scale = 0.55 + Double(i) * 0.15
            let speed = 0.3 + Double(i) * 0.15
            // `time` es monótono: el desplazamiento es continuo, sin saltos.
            let x = (baseX + time * speed * width / 10)
                .truncatingRemainder(dividingBy: range) - 60
            let y = baseY + sin(time / 10 * speed * 3 + baseX * 0.01) * 4

            var path = Path()
            path.addEllipse(in: CGRect(x: x - 20 * scale, y: y - 6 * scale, width: 40 * scale, height: 12 * scale))
            path.addEllipse(in: CGRect(x: x - 12 * scale, y: y - 14 * scale, width: 28 * scale, height: 16 * scale))
            path.addEllipse(in: CGRect(x: x + 5 * scale, y: y - 9 * scale, width: 18 * scale, height: 10 * scale))
            context.fill(path, with: .color(color))
        }
    }

    /// Visitantes animados: mariposas de día, luciérnagas de noche.
    static func drawCreatures(
        in context: GraphicsContext,
        size: CGSize,
        streak: Int,
        time: Double,
        now: Date = Date()
    ) {
        if isNight(now) {
            guard streak >= 10 else { return }
            let count = streak >= 21 ? 8 : (streak >= 14 ? 5 : 3)
            for i in 0..<count {
                let phase = Double(i) * 1.7
                let t = time * 0.08 + phase
                let cx = (sin(t * 1.7 + phase * 3) * 0.4 + 0.5) * size.width
                let cy = size.height * 0.35 + sin(t * 2.3 + phase) * size.height * 0.25
                let glowR = 3 + sin(time * 0.8 + phase * 7) * 2
                let opacity = 0.3 + sin(time * 0.6 + phase * 5) * 0.3
                let center = CGPoint(x: cx, y: cy)
                fillCircle(in: context, center: center, radius: glowR,
                           color: Color(.sRGB, red: 240 / 255, green: 220 / 255, blue: 100 / 255, opacity: 0.15 * opacity))
                fillCircle(in: context, center: center, radius: 1.5,
                           color: Color(.sRGB, red: 240 / 255, green: 220 / 255, blue: 100 / 255, opacity: 0.8 * opacity))
            }
            return
        }

        guard streak >= 2 else { return }
        let count = streak >= 18 ? 5 : (streak >= 10 ? 3 : (streak >= 5 ? 2 : 1))
        let wingColors: [Color] = [
            Color(.sRGB, red: 200 / 255, green: 120 / 255, blue: 160 / 255, opacity: 0.7),
            Color(.sRGB, red: 120 / 255, green: 160 / 255, blue: 220 / 255, opacity: 0.7),
            Color(.sRGB, red: 220 / 255, green: 180 / 255, blue: 80 / 255, opacity: 0.7),
            Color(.sRGB, red: 140 / 255, green: 200 / 255, blue: 140 / 255, opacity: 0.7),
            Color(.sRGB, red: 180 / 255, green: 140 / 255, blue: 220 / 255, opacity: 0.7),
        ]
        for i in 0..<count {
            let yZone = 0.1 + Double(i) / Double(count) * 0.7
            let speed = 0.6 + Double(i) * 0.15
            let phase = Double(i) * 2.1
            let t = time / 10 * speed + phase
            let cx = (sin(t * 1.3) * 0.35 + 0.5) * size.width
            let cy = size.height * (0.3 + yZone * 0.5) + sin(t * 2.1) * size.height * 0.1
            // Aleteo: la envergadura se comprime y expande rápido en X.
            let wingScale = 0.3 + abs(sin(time * 3 + phase * 5)) * 0.7

            var wings = Path()
            wings.move(to: .zero)
            wings.addCurve(to: CGPoint(x: -6, y: 1),
                           control1: CGPoint(x: -5, y: -5), control2: CGPoint(x: -8, y: -3))
            wings.addCurve(to: .zero,
                           control1: CGPoint(x: -8, y: 4), control2: CGPoint(x: -4, y: 5))
            wings.move(to: .zero)
            wings.addCurve(to: CGPoint(x: 6, y: 1),
                           control1: CGPoint(x: 5, y: -5), control2: CGPoint(x: 8, y: -3))
            wings.addCurve(to: .zero,
                           control1: CGPoint(x: 8, y: 4), control2: CGPoint(x: 4, y: 5))
            let transformed = wings.applying(
                CGAffineTransform(scaleX: wingScale, y: 1)
                    .concatenating(CGAffineTransform(translationX: cx, y: cy))
            )
            context.fill(transformed, with: .color(wingColors[i % wingColors.count]))
            context.fill(
                Path(CGRect(x: cx - 0.5, y: cy - 2, width: 1, height: 4)),
                with: .color(Color(.sRGB, red: 60 / 255, green: 50 / 255, blue: 40 / 255, opacity: 0.7))
            )
        }
    }

    /// Partículas estacionales que caen: pétalos en primavera, hojas en otoño,
    /// nieve en invierno. El verano no tiene partículas.
    static func drawSeasonalParticles(
        in context: GraphicsContext,
        size: CGSize,
        season: Season,
        time: Double
    ) {
        let theme = season.theme
        guard theme.particleCount > 0, theme.particleType != .none else { return }
        let p = time / 10

        for i in 0..<theme.particleCount {
            let startX = (Double(i) * 97.3 + 23).truncatingRemainder(dividingBy: size.width)
            let phase = Double(i) * 0.7 + (Double(i * i) * 0.13).truncatingRemainder(dividingBy: 1)
            let baseSpeed = 0.3 + (Double(i) * 0.37).truncatingRemainder(dividingBy: 0.4)
            let particleSize = 2 + Double(i % 3)
            let drift = Double((i * 53) % 40) - 20

            let speed: Double
            let driftFactor: Double
            let driftFreq: Double
            switch theme.particleType {
            case .blossom: speed = baseSpeed;       driftFactor = 1.0; driftFreq = 3.0
            case .leaf:    speed = baseSpeed * 0.7;  driftFactor = 1.5; driftFreq = 2.5
            case .snow:    speed = baseSpeed * 0.5;  driftFactor = 0.8; driftFreq = 2.0
            case .none:    continue
            }

            let t = (p * speed + phase).truncatingRemainder(dividingBy: 1)
            let cx = startX + sin(t * .pi * driftFreq) * drift * driftFactor
            let cy = -10 + t * (size.height + 20)
            let fade: Double = t < 0.05 ? t * 14 : (t > 0.9 ? (1 - t) * 8 : 0.55)
            let color = theme.particleColor.opacity(fade)
            let center = CGPoint(x: cx, y: cy)

            switch theme.particleType {
            case .snow:
                fillCircle(in: context, center: center, radius: particleSize * 0.6, color: color)
            case .blossom, .leaf:
                // Pétalo/hoja: un óvalo que voltea al caer.
                let rotation = t * .pi * (theme.particleType == .leaf ? 6 : 4)
                let oval = Path(ellipseIn: CGRect(
                    x: -particleSize * 0.6, y: -particleSize * 0.8,
                    width: particleSize * 1.2, height: particleSize * 1.6
                ))
                .applying(
                    CGAffineTransform(rotationAngle: rotation)
                        .concatenating(CGAffineTransform(translationX: cx, y: cy))
                )
                context.fill(oval, with: .color(color))
            case .none:
                break
            }
        }
    }

    // MARK: - Mascotas

    /// Dibuja las mascotas activas deambulando por el jardín, en coordenadas de
    /// pantalla (sin escalar), igual que los visitantes y las partículas.
    /// Portado de `GardenPet` / `GardenPets` de `src/components/garden/GardenPet.tsx`.
    ///
    /// Cada mascota tiene su propio recorrido y ritmo. `time` (segundos) es
    /// monótono: se usa `p = time / 10` como análogo continuo del `progress`
    /// 0→1 de la app RN, para un movimiento sin saltos.
    static func drawPets(
        _ pets: [PetType],
        in context: GraphicsContext,
        size: CGSize,
        time: Double
    ) {
        guard !pets.isEmpty else { return }
        let p = time / 10
        let groundY = size.height * 0.55

        for pet in pets {
            switch pet {
            case .cat: drawCat(in: context, size: size, groundY: groundY, p: p)
            case .bunny: drawBunny(in: context, size: size, groundY: groundY, p: p)
            case .bird: drawBird(in: context, size: size, groundY: groundY, p: p)
            case .goldenButterfly: drawGoldenButterfly(in: context, size: size, groundY: groundY, p: p)
            case .hedgehog: drawHedgehog(in: context, size: size, groundY: groundY, p: p)
            }
        }
    }

    /// Gato que pasea con un trazado en ocho, meneando la cola y cabeceando.
    private static func drawCat(in context: GraphicsContext, size: CGSize, groundY: Double, p: Double) {
        let w = Double(size.width)
        let t = p * 0.4
        let cx = w * 0.25 + sin(t * 1.1) * w * 0.25
        let cy = groundY + 10 + sin(t * 2.2) * 12
        let facing: Double = cos(t * 1.1) > 0 ? 1 : -1
        let tailAngle = sin(p * .pi * 8) * 0.4
        let headBob = sin(p * .pi * 4) * 1.5

        var body = context
        body.translateBy(x: cx, y: cy)
        body.scaleBy(x: facing, y: 1)

        // Sombra.
        fillOval(in: body, x: -7, y: 4, w: 14, h: 4, color: .black.opacity(0.06))

        // Cola — translada y rota sobre su base.
        var tail = body
        tail.translateBy(x: -9, y: -2)
        tail.rotate(by: .radians(tailAngle))
        var tailPath = Path()
        tailPath.move(to: .zero)
        tailPath.addCurve(to: CGPoint(x: -8, y: -12),
                          control1: CGPoint(x: -6, y: -8), control2: CGPoint(x: -10, y: -6))
        tail.stroke(tailPath, with: .color(Color(hex: "8B7355")),
                    style: StrokeStyle(lineWidth: 2, lineCap: .round))

        // Cuerpo y barriga.
        fillOval(in: body, x: -8, y: -5, w: 16, h: 10, color: Color(hex: "A89070"))
        fillOval(in: body, x: -4, y: -2, w: 8, h: 6, color: Color(hex: "C4B8A0"))

        // Patas.
        for leg in [(-5.0, 3.0), (-2.0, 4.0), (3.0, 4.0), (6.0, 3.0)] {
            var legPath = Path()
            legPath.move(to: CGPoint(x: leg.0, y: leg.1))
            legPath.addLine(to: CGPoint(x: leg.0, y: leg.1 + 5))
            body.stroke(legPath, with: .color(Color(hex: "8B7355")),
                        style: StrokeStyle(lineWidth: 1.8, lineCap: .round))
        }

        // Cabeza — cabecea suavemente.
        var head = body
        head.translateBy(x: 0, y: headBob - 7)
        fillCircle(in: head, center: CGPoint(x: 3, y: 0), radius: 6, color: Color(hex: "A89070"))
        head.fill(triangle((-5, -8), (-8, -15), (-2, -10)), with: .color(Color(hex: "A89070")))
        head.fill(triangle((5, -8), (8, -15), (2, -10)), with: .color(Color(hex: "A89070")))
        head.fill(triangle((-4.5, -8.5), (-6.5, -13), (-2.5, -10)), with: .color(Color(hex: "D4A0A0")))
        head.fill(triangle((4.5, -8.5), (6.5, -13), (2.5, -10)), with: .color(Color(hex: "D4A0A0")))
        fillCircle(in: head, center: CGPoint(x: 0.5, y: -1), radius: 1.2, color: Color(hex: "3A3020"))
        fillCircle(in: head, center: CGPoint(x: 5.5, y: -1), radius: 1.2, color: Color(hex: "3A3020"))
        fillCircle(in: head, center: CGPoint(x: 1, y: -1.5), radius: 0.5, color: .white.opacity(0.7))
        fillCircle(in: head, center: CGPoint(x: 6, y: -1.5), radius: 0.5, color: .white.opacity(0.7))
        fillCircle(in: head, center: CGPoint(x: 3, y: 1), radius: 0.8, color: Color(hex: "D4A0A0"))
        let whiskers: [(Double, Double, Double, Double)] = [
            (-2, 0.5, -7, -0.5), (-2, 1.5, -7, 2), (8, 0.5, 13, -0.5), (8, 1.5, 13, 2),
        ]
        for whisker in whiskers {
            var path = Path()
            path.move(to: CGPoint(x: whisker.0, y: whisker.1))
            path.addLine(to: CGPoint(x: whisker.2, y: whisker.3))
            head.stroke(path, with: .color(Color(.sRGB, red: 80 / 255, green: 60 / 255, blue: 40 / 255, opacity: 0.3)),
                        lineWidth: 0.5)
        }
    }

    /// Conejo que da saltitos por el jardín.
    private static func drawBunny(in context: GraphicsContext, size: CGSize, groundY: Double, p: Double) {
        let w = Double(size.width)
        let t = p * 0.35
        let cx = w * 0.6 + sin(t * 1.5) * w * 0.2
        let hop = abs(sin(t * 8)) * 8
        let cy = groundY + 15 + sin(t * 1.8) * 10 - hop
        let facing: Double = cos(t * 1.5) > 0 ? 1 : -1

        var body = context
        body.translateBy(x: cx, y: cy)
        body.scaleBy(x: facing, y: 1)

        fillOval(in: body, x: -5, y: 3, w: 10, h: 3, color: .black.opacity(0.05))
        fillOval(in: body, x: -6, y: -4, w: 12, h: 8, color: Color(hex: "E0D4C0"))
        fillCircle(in: body, center: CGPoint(x: 5, y: -5), radius: 4.5, color: Color(hex: "E8DCD0"))

        var ear1 = Path()
        ear1.move(to: CGPoint(x: 3, y: -8))
        ear1.addCurve(to: CGPoint(x: 5, y: -18),
                      control1: CGPoint(x: 2, y: -18), control2: CGPoint(x: 4, y: -20))
        ear1.addLine(to: CGPoint(x: 5, y: -8))
        ear1.closeSubpath()
        body.fill(ear1, with: .color(Color(hex: "E8DCD0")))

        var ear2 = Path()
        ear2.move(to: CGPoint(x: 6, y: -8))
        ear2.addCurve(to: CGPoint(x: 8, y: -17),
                      control1: CGPoint(x: 7, y: -17), control2: CGPoint(x: 9, y: -19))
        ear2.addLine(to: CGPoint(x: 7, y: -8))
        ear2.closeSubpath()
        body.fill(ear2, with: .color(Color(hex: "E8DCD0")))

        var innerEar = Path()
        innerEar.move(to: CGPoint(x: 3.5, y: -9))
        innerEar.addCurve(to: CGPoint(x: 4.5, y: -16),
                          control1: CGPoint(x: 3, y: -16), control2: CGPoint(x: 4.5, y: -17))
        innerEar.addLine(to: CGPoint(x: 4.5, y: -9))
        innerEar.closeSubpath()
        body.fill(innerEar, with: .color(Color(hex: "E0B0B0")))

        fillCircle(in: body, center: CGPoint(x: 3.5, y: -5.5), radius: 1, color: Color(hex: "3A3020"))
        fillCircle(in: body, center: CGPoint(x: 6.5, y: -5.5), radius: 1, color: Color(hex: "3A3020"))
        fillCircle(in: body, center: CGPoint(x: 5, y: -3.5), radius: 0.7, color: Color(hex: "E0B0B0"))
        fillCircle(in: body, center: CGPoint(x: -6, y: -1), radius: 2.5, color: Color(hex: "F0E8E0"))
    }

    /// Pájaro que revolotea entre las flores aleteando.
    private static func drawBird(in context: GraphicsContext, size: CGSize, groundY: Double, p: Double) {
        let w = Double(size.width)
        let t = p * 0.6
        let cx = w * 0.4 + sin(t * 1.3) * w * 0.3
        let cy = groundY - 20 + sin(t * 2.5) * 15
        let facing: Double = cos(t * 1.3) > 0 ? 1 : -1
        let wingFlap = sin(p * 25) * 0.6

        var body = context
        body.translateBy(x: cx, y: cy)
        body.scaleBy(x: facing, y: 1)

        fillOval(in: body, x: -4, y: -3, w: 8, h: 6, color: Color(hex: "6BA3D0"))

        // Ala — aletea rotando sobre la base del cuerpo.
        var wing = body
        wing.rotate(by: .radians(wingFlap))
        var wingPath = Path()
        wingPath.move(to: .zero)
        wingPath.addCurve(to: CGPoint(x: -7, y: 0),
                          control1: CGPoint(x: -3, y: -6), control2: CGPoint(x: -8, y: -5))
        wingPath.closeSubpath()
        wing.fill(wingPath, with: .color(Color(hex: "5090C0")))

        fillCircle(in: body, center: CGPoint(x: 4, y: -3), radius: 3, color: Color(hex: "6BA3D0"))
        fillCircle(in: body, center: CGPoint(x: 5, y: -3.5), radius: 0.8, color: Color(hex: "2A2020"))
        fillCircle(in: body, center: CGPoint(x: 5.3, y: -3.8), radius: 0.3, color: .white.opacity(0.6))
        body.fill(triangle((7, -3), (10, -2.5), (7, -2)), with: .color(Color(hex: "E8A040")))
        body.fill(triangle((-4, -1), (-8, -3), (-7, 0)), with: .color(Color(hex: "5090C0")))
    }

    /// Mariposa dorada de vuelo lento y centelleante.
    private static func drawGoldenButterfly(in context: GraphicsContext, size: CGSize, groundY: Double, p: Double) {
        let w = Double(size.width)
        let h = Double(size.height)
        let t = p * 0.3
        let cx = w * 0.5 + sin(t * 1.7) * w * 0.3
        let cy = groundY - 10 + sin(t * 2.3) * h * 0.08
        let wingScale = 0.3 + abs(sin(p * 20)) * 0.7
        let sparkleOpacity = 0.3 + sin(p * 15) * 0.3

        var ctx = context
        ctx.translateBy(x: cx, y: cy)
        ctx.scaleBy(x: wingScale, y: 1)

        var wings = Path()
        wings.move(to: .zero)
        wings.addCurve(to: CGPoint(x: -8, y: 2),
                       control1: CGPoint(x: -7, y: -7), control2: CGPoint(x: -11, y: -4))
        wings.addCurve(to: .zero,
                       control1: CGPoint(x: -10, y: 6), control2: CGPoint(x: -5, y: 7))
        wings.move(to: .zero)
        wings.addCurve(to: CGPoint(x: 8, y: 2),
                       control1: CGPoint(x: 7, y: -7), control2: CGPoint(x: 11, y: -4))
        wings.addCurve(to: .zero,
                       control1: CGPoint(x: 10, y: 6), control2: CGPoint(x: 5, y: 7))
        ctx.fill(wings, with: .color(Color(.sRGB, red: 240 / 255, green: 200 / 255, blue: 60 / 255, opacity: 0.75)))

        ctx.fill(Path(CGRect(x: -0.7, y: -3, width: 1.4, height: 6)),
                 with: .color(Color(.sRGB, red: 80 / 255, green: 60 / 255, blue: 20 / 255, opacity: 0.7)))

        let sparkle = Color(.sRGB, red: 1, green: 220 / 255, blue: 80 / 255, opacity: max(0, sparkleOpacity))
        fillCircle(in: ctx, center: CGPoint(x: -3, y: -2), radius: 1, color: sparkle)
        fillCircle(in: ctx, center: CGPoint(x: 3, y: -2), radius: 1, color: sparkle)
    }

    /// Erizo que camina despacio contoneándose.
    private static func drawHedgehog(in context: GraphicsContext, size: CGSize, groundY: Double, p: Double) {
        let w = Double(size.width)
        let t = p * 0.25
        let cx = w * 0.3 + sin(t * 0.9) * w * 0.15
        let cy = groundY + 20 + sin(t * 1.6) * 6
        let facing: Double = cos(t * 0.9) > 0 ? 1 : -1
        let waddle = sin(p * 12) * 0.08

        var body = context
        body.translateBy(x: cx, y: cy)
        body.scaleBy(x: facing, y: 1)
        body.rotate(by: .radians(waddle))

        fillOval(in: body, x: -6, y: 2, w: 12, h: 3, color: .black.opacity(0.05))
        fillOval(in: body, x: -7, y: -6, w: 12, h: 10, color: Color(hex: "8B6B40"))

        for spine in [(-4.0, -5.0), (-2.0, -6.0), (0.0, -5.5), (2.0, -5.0), (-3.0, -3.0), (1.0, -3.0)] {
            var path = Path()
            path.move(to: CGPoint(x: spine.0, y: spine.1))
            path.addLine(to: CGPoint(x: spine.0 - 1, y: spine.1 - 2.5))
            body.stroke(path, with: .color(Color(hex: "6B5030")),
                        style: StrokeStyle(lineWidth: 1, lineCap: .round))
        }

        fillOval(in: body, x: 2, y: -4, w: 7, h: 6, color: Color(hex: "D8C8A8"))
        fillCircle(in: body, center: CGPoint(x: 6, y: -2), radius: 0.9, color: Color(hex: "2A2020"))
        fillCircle(in: body, center: CGPoint(x: 6.3, y: -2.3), radius: 0.3, color: .white.opacity(0.6))
        fillCircle(in: body, center: CGPoint(x: 8, y: -0.5), radius: 0.7, color: Color(hex: "3A3020"))

        for leg in [(-3.0, 2.0), (1.0, 2.5), (4.0, 2.0)] {
            var path = Path()
            path.move(to: CGPoint(x: leg.0, y: leg.1))
            path.addLine(to: CGPoint(x: leg.0, y: leg.1 + 3))
            body.stroke(path, with: .color(Color(hex: "8B7355")),
                        style: StrokeStyle(lineWidth: 1.5, lineCap: .round))
        }
    }

    /// Atajo para rellenar un óvalo dado por su rectángulo contenedor.
    private static func fillOval(
        in context: GraphicsContext,
        x: Double, y: Double, w: Double, h: Double,
        color: Color
    ) {
        context.fill(Path(ellipseIn: CGRect(x: x, y: y, width: w, height: h)), with: .color(color))
    }

    /// Triángulo cerrado por sus tres vértices.
    private static func triangle(
        _ a: (Double, Double), _ b: (Double, Double), _ c: (Double, Double)
    ) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: a.0, y: a.1))
        path.addLine(to: CGPoint(x: b.0, y: b.1))
        path.addLine(to: CGPoint(x: c.0, y: c.1))
        path.closeSubpath()
        return path
    }

    // MARK: - Interacción

    /// Anillo azul pulsante bajo cada planta sin regar — solo en modo regar,
    /// para señalar qué celdas responden al toque.
    static func drawWaterTargets(
        plants: [PlantPlacement],
        in context: GraphicsContext,
        offset: CGPoint,
        time: Double
    ) {
        let pulse = 0.5 + sin(time * 2.5) * 0.5
        for plant in plants where !plant.wateredToday {
            let base = GardenIso.toScreen(gx: plant.gx, gy: plant.gy, offset: offset)
            let r = 13.0 + pulse * 3
            let ring = Path(ellipseIn: CGRect(
                x: Double(base.x) - r, y: Double(base.y) - r * 0.5,
                width: r * 2, height: r
            ))
            context.stroke(
                ring,
                with: .color(Color(.sRGB, red: 100 / 255, green: 170 / 255, blue: 220 / 255,
                                   opacity: 0.35 + pulse * 0.35)),
                lineWidth: 1.5
            )
        }
    }

    /// Animación de riego sobre una celda: gotas que caen, anillos de
    /// salpicadura en la base y partículas que saltan. Portado de `WaterSplash`
    /// (`FallingDrop` / `SplashRing` / `SprayDrop`) de `GardenCanvas.tsx`.
    ///
    /// El ciclo de cada partícula usa `time` monótono (como nubes y partículas
    /// estacionales); una envolvente entra y desvanece el efecto completo
    /// dentro de su ventana de `GardenStore.waterEffectDuration` segundos.
    static func drawWaterEffect(
        _ effect: WaterEffect,
        in context: GraphicsContext,
        offset: CGPoint,
        time: Double
    ) {
        let duration = GardenStore.waterEffectDuration
        let elapsed = time - effect.startTime.timeIntervalSinceReferenceDate
        guard elapsed >= 0, elapsed <= duration else { return }

        let envelope: Double
        if elapsed < 0.2 {
            envelope = elapsed / 0.2
        } else if elapsed > duration - 0.6 {
            envelope = (duration - elapsed) / 0.6
        } else {
            envelope = 1
        }

        let base = GardenIso.toScreen(gx: effect.gx, gy: effect.gy, offset: offset)
        let bx = Double(base.x)
        let by = Double(base.y)
        let p = time / 10

        // Gotas de lluvia que caen sobre la planta, escalonadas.
        let rainPhases: [Double] = [0, 0.2, 0.4, 0.6, 0.8]
        let rainOffsets: [Double] = [-4, 2, -1, 3, 0]
        let topY = by - 55
        let fallDist = by - topY + 25
        for i in rainPhases.indices {
            let t = (p * 6 + rainPhases[i]).truncatingRemainder(dividingBy: 1)
            let cy = topY - 25 + t * fallDist
            let fade = t < 0.1 ? t * 10 : (t > 0.85 ? (1 - t) * 6.5 : 0.85)
            fillCircle(
                in: context,
                center: CGPoint(x: bx + rainOffsets[i], y: cy),
                radius: 1.8,
                color: Color(.sRGB, red: 90 / 255, green: 170 / 255, blue: 230 / 255,
                             opacity: 0.9 * fade * envelope)
            )
        }

        // Anillos de salpicadura que se expanden en la base.
        let ringPhases: [Double] = [0, 0.33, 0.66]
        for phase in ringPhases {
            let t = (p * 3 + phase).truncatingRemainder(dividingBy: 1)
            let r = t * 16
            let ring = Path(ellipseIn: CGRect(
                x: bx - r, y: by - r * 0.45, width: r * 2, height: r * 0.9
            ))
            context.stroke(
                ring,
                with: .color(Color(.sRGB, red: 90 / 255, green: 170 / 255, blue: 230 / 255,
                                   opacity: (1 - t) * 0.45 * envelope)),
                lineWidth: 1.5
            )
        }

        // Partículas que saltan en arco hacia arriba y vuelven a caer.
        let sprayAngles: [Double] = [0.3, 1.2, 2.1, 3.0, 3.9, 4.8]
        for angle in sprayAngles {
            let t = (p * 5 + angle * 0.15).truncatingRemainder(dividingBy: 1)
            let cx = bx + cos(angle) * t * 14
            let cy = by - t * 18 + t * t * 24
            fillCircle(
                in: context,
                center: CGPoint(x: cx, y: cy),
                radius: 1.3,
                color: Color(.sRGB, red: 120 / 255, green: 190 / 255, blue: 240 / 255,
                             opacity: (1 - t) * 0.75 * envelope)
            )
        }
    }

    /// Atajo para rellenar un círculo centrado en un punto.
    private static func fillCircle(
        in context: GraphicsContext,
        center: CGPoint,
        radius: Double,
        color: Color
    ) {
        context.fill(
            Path(ellipseIn: CGRect(
                x: center.x - radius, y: center.y - radius,
                width: radius * 2, height: radius * 2
            )),
            with: .color(color)
        )
    }
}
