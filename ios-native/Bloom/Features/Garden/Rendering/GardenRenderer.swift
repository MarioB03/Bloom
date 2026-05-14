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
    /// El aspecto depende de la emoción (morfología) y la etapa de crecimiento.
    static func drawPlant(
        _ plant: PlantPlacement,
        in context: GraphicsContext,
        offset: CGPoint,
        season: Season
    ) {
        let base = GardenIso.toScreen(gx: plant.gx, gy: plant.gy, offset: offset)
        let morphology = plant.emotion.plantMorphology
        let stage = plant.growthStage
        let bloomColor = plant.emotion.config.color
        let leafColor = season.theme.leafTint

        // Sombra en el suelo.
        let shadow = Path(ellipseIn: CGRect(x: base.x - 11, y: base.y - 3, width: 22, height: 7))
        context.fill(shadow, with: .color(.black.opacity(0.12)))

        // Etapa 0: solo un montículo de semilla.
        guard stage >= 1 else {
            let seed = Path(ellipseIn: CGRect(x: base.x - 4, y: base.y - 6, width: 8, height: 6))
            context.fill(seed, with: .color(Color(hex: "8B6F47")))
            return
        }

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
        context.stroke(stem, with: .color(leafColor), style: StrokeStyle(lineWidth: 2.5, lineCap: .round))

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
            context.fill(leaf, with: .color(leafColor.lightened(0.1)))
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
            context.fill(petal, with: .color(bloomColor))
        }

        // Centro de la flor.
        let centerRadius = petalSize * 0.7
        let center = Path(ellipseIn: CGRect(
            x: stemTop.x - centerRadius,
            y: stemTop.y - centerRadius,
            width: centerRadius * 2,
            height: centerRadius * 2
        ))
        context.fill(center, with: .color(bloomColor.darkened(0.2)))

        // Emoji central — solo en floración completa.
        if stage >= 5, let emoji = morphology.centerEmoji {
            context.draw(
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
}
