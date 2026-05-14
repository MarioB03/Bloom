import SwiftUI

/// La escena del jardín: un `Canvas` que dibuja cielo, rejilla isométrica,
/// plantas y decoraciones. Equivalente nativo de `GardenCanvas.tsx`.
///
/// El jardín se escala para caber entero y centrado dentro del espacio que le
/// dé el contenedor — sin scroll. La app RN scrollea el lienzo; aquí preferimos
/// ver el jardín completo de un vistazo, con el cielo rellenando el resto.
///
/// De momento es estática. La animación (vaivén de plantas, partículas
/// estacionales, atmósfera, efectos de riego) llegará en una fase posterior
/// envolviendo este `Canvas` en un `TimelineView(.animation)`.
struct GardenScene: View {

    let layout: GardenLayout
    let gridSize: Int
    let season: Season
    let cosmetics: CosmeticOverrides

    /// Ampliación máxima: el jardín se dibuja a tamaño natural y solo se amplía
    /// hasta este factor si hay sitio de sobra. El espacio restante es cielo.
    private static let maxScale: CGFloat = 1.7
    private static let footer: CGFloat = 14

    /// Espacio sobre la rejilla para las plantas altas. Proporcional al tamaño
    /// de la rejilla: las rejillas grandes vienen de rachas largas y por tanto
    /// de plantas más crecidas y altas.
    private var headroom: CGFloat { CGFloat(gridSize) * 9 }

    var body: some View {
        Canvas { context, size in
            let natural = naturalSize
            let scale = min(
                size.width / natural.width,
                size.height / natural.height,
                Self.maxScale
            )
            let originX = (size.width - natural.width * scale) / 2
            let originY = (size.height - natural.height * scale) / 2

            // El cielo cubre todo el marco; el jardín escalado va centrado.
            GardenRenderer.drawSky(in: context, size: size, season: season, cosmetics: cosmetics)

            var scene = context
            scene.translateBy(x: originX, y: originY)
            scene.scaleBy(x: scale, y: scale)

            let offset = CGPoint(x: natural.width / 2, y: headroom + GardenGrid.tileH)
            GardenRenderer.drawTiles(in: scene, offset: offset, gridSize: gridSize, season: season)

            // Plantas y decoraciones se dibujan juntas en orden isométrico
            // (algoritmo del pintor): las celdas "de atrás" primero.
            for drawable in sortedDrawables {
                switch drawable {
                case .plant(let plant):
                    GardenRenderer.drawPlant(plant, in: scene, offset: offset, season: season)
                case .decoration(let decoration):
                    GardenRenderer.drawDecoration(decoration, in: scene, offset: offset)
                }
            }
        }
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
