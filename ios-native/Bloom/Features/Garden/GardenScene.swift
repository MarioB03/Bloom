import SwiftUI

/// La escena del jardín: un `Canvas` que dibuja cielo, rejilla isométrica,
/// plantas y decoraciones. Equivalente nativo de `GardenCanvas.tsx`.
///
/// El jardín se escala para caber entero y centrado dentro del espacio que le
/// dé el contenedor — sin scroll. La app RN scrollea el lienzo; aquí preferimos
/// ver el jardín completo de un vistazo, con el cielo rellenando el resto.
///
/// El `Canvas` va dentro de un `TimelineView(.animation)`: en cada frame se
/// pasa el tiempo absoluto al renderer, que anima el vaivén de las plantas, la
/// atmósfera (sol/luna, estrellas, nubes, mariposas, luciérnagas) y las
/// partículas estacionales.
///
/// Un toque sobre el lienzo se convierte en celda de rejilla invirtiendo la
/// transformada de escala/centrado que aplica la escena (ver `sceneGeometry`),
/// y se notifica vía `onTapCell` solo si cae dentro de la rejilla.
struct GardenScene: View {

    let layout: GardenLayout
    let gridSize: Int
    let season: Season
    let cosmetics: CosmeticOverrides
    /// Racha actual: condiciona cuántos elementos de atmósfera aparecen.
    let streak: Int
    /// Modo de interacción activo: condiciona las ayudas visuales del lienzo.
    let mode: InteractionMode
    /// Mascotas activas que deambulan por el jardín.
    let activePets: [PetType]
    /// Animaciones de riego en curso, una por celda regada hace poco.
    let waterEffects: [WaterEffect]
    /// Se invoca al tocar una celda dentro de la rejilla, ya en coordenadas
    /// de rejilla.
    let onTapCell: (Int, Int) -> Void

    /// Ampliación máxima: el jardín se dibuja a tamaño natural y solo se amplía
    /// hasta este factor si hay sitio de sobra. El espacio restante es cielo.
    private static let maxScale: CGFloat = 1.7
    private static let footer: CGFloat = 14

    /// Espacio sobre la rejilla para las plantas altas. Proporcional al tamaño
    /// de la rejilla: las rejillas grandes vienen de rachas largas y por tanto
    /// de plantas más crecidas y altas.
    private var headroom: CGFloat { CGFloat(gridSize) * 9 }

    /// Escala, origen y desplazamiento isométrico de la escena para un tamaño
    /// de lienzo dado. Se calcula una vez por `GeometryReader` y lo comparten
    /// el dibujo y la conversión toque → celda.
    private struct SceneGeometry {
        let scale: CGFloat
        let origin: CGPoint
        let offset: CGPoint
    }

    var body: some View {
        GeometryReader { geo in
            let geometry = sceneGeometry(for: geo.size)
            TimelineView(.animation) { timeline in
                Canvas { context, size in
                    draw(
                        in: context,
                        size: size,
                        geometry: geometry,
                        time: timeline.date.timeIntervalSinceReferenceDate
                    )
                } symbols: {
                    // Iconos botánicos para cada tipo de decoración. El
                    // renderer los resuelve con `context.resolveSymbol(id:)`
                    // y los dibuja con `context.draw(_:at:)` en orden
                    // isométrico — no se puede usar `Image(_:)` directo
                    // dentro del Canvas.
                    ForEach(DecorationType.allCases, id: \.rawValue) { type in
                        BloomIconView(.decoration(id: type.rawValue), size: 38)
                            .tag(type.rawValue)
                    }
                    // Acentos centrales de plantas (sol, llama, chispa,
                    // corazón) que se muestran al alcanzar floración.
                    BloomIconView(.plantAccent(.sun), size: 18).tag("accent-sun")
                    BloomIconView(.plantAccent(.flame), size: 18).tag("accent-flame")
                    BloomIconView(.plantAccent(.sparkle), size: 18).tag("accent-sparkle")
                    BloomIconView(.plantAccent(.heart), size: 18).tag("accent-heart")
                    // SVG botánica de cada emoción (Girasol, Sauce, Cactus,
                    // Lavanda…). El renderer las dibuja como cabeza de la flor
                    // a partir de etapa 3, en sustitución de los pétalos
                    // procedurales genéricos. Se publican en su tamaño
                    // máximo y luego se rescalan en cada celda.
                    ForEach(EmotionID.allCases) { id in
                        BloomIconView(.emotion(id), size: 38)
                            .tag("plant-\(id.rawValue)")
                    }
                }
            }
            .contentShape(Rectangle())
            .onTapGesture(coordinateSpace: .local) { location in
                notify(at: location, geometry: geometry, action: onTapCell)
            }
        }
    }

    /// Convierte un punto de pantalla en celda y, si cae dentro de la rejilla,
    /// invoca `action` con sus coordenadas.
    private func notify(at location: CGPoint, geometry: SceneGeometry, action: (Int, Int) -> Void) {
        let cell = GardenIso.toGrid(scenePoint(location, geometry), offset: geometry.offset)
        if GardenIso.inBounds(gx: cell.gx, gy: cell.gy, gridSize: gridSize) {
            action(cell.gx, cell.gy)
        }
    }

    // MARK: - Dibujo

    private func draw(in context: GraphicsContext, size: CGSize, geometry: SceneGeometry, time: Double) {
        // El cielo cubre todo el marco; el jardín escalado va centrado.
        GardenRenderer.drawSky(in: context, size: size, season: season, cosmetics: cosmetics)

        // Atmósfera de fondo, en coordenadas de pantalla (sin escalar).
        GardenRenderer.drawStars(in: context, size: size, streak: streak, time: time)
        GardenRenderer.drawCelestial(in: context, size: size, streak: streak, time: time)
        GardenRenderer.drawClouds(in: context, size: size, streak: streak, time: time)

        var scene = context
        scene.translateBy(x: geometry.origin.x, y: geometry.origin.y)
        scene.scaleBy(x: geometry.scale, y: geometry.scale)

        let offset = geometry.offset
        GardenRenderer.drawTiles(in: scene, offset: offset, gridSize: gridSize, season: season, cosmetics: cosmetics)
        GardenRenderer.drawFence(in: scene, offset: offset, gridSize: gridSize, streak: streak, cosmetics: cosmetics)

        // En modo regar, señala las plantas aún sin regar.
        if mode == .water {
            GardenRenderer.drawWaterTargets(plants: layout.plants, in: scene, offset: offset, time: time)
        }

        // Plantas y decoraciones se dibujan juntas en orden isométrico
        // (algoritmo del pintor): las celdas "de atrás" primero.
        for drawable in sortedDrawables {
            switch drawable {
            case .plant(let plant):
                GardenRenderer.drawPlant(plant, in: scene, offset: offset, season: season, time: time)
            case .decoration(let decoration):
                GardenRenderer.drawDecoration(decoration, in: scene, offset: offset)
            }
        }

        // Animaciones de riego sobre las plantas recién regadas.
        for effect in waterEffects {
            GardenRenderer.drawWaterEffect(effect, in: scene, offset: offset, time: time)
        }

        // Visitantes, mascotas y partículas estacionales: primer plano, sin escalar.
        GardenRenderer.drawCreatures(in: context, size: size, streak: streak, cosmetics: cosmetics, time: time)
        GardenRenderer.drawPets(activePets, in: context, size: size, time: time)
        GardenRenderer.drawSeasonalParticles(in: context, size: size, season: season, time: time)
    }

    // MARK: - Geometría e interacción

    /// Calcula escala, origen y desplazamiento de la escena para un tamaño dado.
    private func sceneGeometry(for size: CGSize) -> SceneGeometry {
        let natural = naturalSize
        let scale = min(
            size.width / natural.width,
            size.height / natural.height,
            Self.maxScale
        )
        let origin = CGPoint(
            x: (size.width - natural.width * scale) / 2,
            y: (size.height - natural.height * scale) / 2
        )
        let offset = CGPoint(x: natural.width / 2, y: headroom + GardenGrid.tileH)
        return SceneGeometry(scale: scale, origin: origin, offset: offset)
    }

    /// Invierte la transformada de centrado y escala: punto de pantalla →
    /// punto en el espacio sin escalar del jardín.
    private func scenePoint(_ location: CGPoint, _ geometry: SceneGeometry) -> CGPoint {
        CGPoint(
            x: (location.x - geometry.origin.x) / geometry.scale,
            y: (location.y - geometry.origin.y) / geometry.scale
        )
    }

    /// Tamaño "natural" del dibujo del jardín antes de escalar: ancho de la
    /// rejilla isométrica más el espacio para plantas altas y un pie.
    private var naturalSize: CGSize {
        CGSize(
            width: CGFloat(gridSize) * GardenGrid.tileW,
            height: CGFloat(gridSize - 1) * GardenGrid.tileH
                + headroom + GardenGrid.tileH + GardenGrid.tileH / 2 + Self.footer
        )
    }

    /// Un elemento dibujable de la escena, con su clave de orden isométrico.
    private enum Drawable {
        case plant(PlantPlacement)
        case decoration(DecorationPlacement)

        var sortKey: Int {
            switch self {
            case .plant(let plant): GardenIso.sortKey(gx: plant.gx, gy: plant.gy)
            case .decoration(let decoration): GardenIso.sortKey(gx: decoration.gx, gy: decoration.gy)
            }
        }
    }

    /// Plantas y decoraciones combinadas y ordenadas para el dibujo isométrico.
    private var sortedDrawables: [Drawable] {
        let plants = layout.plants.map(Drawable.plant)
        let decorations = layout.decorations.map(Drawable.decoration)
        return (plants + decorations).sorted { $0.sortKey < $1.sortKey }
    }
}
