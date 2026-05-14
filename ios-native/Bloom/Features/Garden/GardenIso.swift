import SwiftUI

/// Proyección isométrica del jardín: conversión rejilla ↔ pantalla, límites,
/// geometría de baldosa y orden de dibujo. Portado de
/// `src/components/garden/gardenUtils.ts`.
///
/// La rejilla se proyecta en diamantes: `sx = (gx - gy)·26`, `sy = (gx + gy)·13`.
enum GardenIso {

    /// Las 4 esquinas de una baldosa-diamante en coordenadas de pantalla.
    struct TileCorners {
        let top: CGPoint
        let right: CGPoint
        let bottom: CGPoint
        let left: CGPoint
    }

    /// Coordenadas de rejilla → centro de la baldosa en pantalla.
    static func toScreen(gx: Int, gy: Int, offset: CGPoint = .zero) -> CGPoint {
        CGPoint(
            x: CGFloat(gx - gy) * (GardenGrid.tileW / 2) + offset.x,
            y: CGFloat(gx + gy) * (GardenGrid.tileH / 2) + offset.y
        )
    }

    /// Coordenadas de pantalla → celda de rejilla más cercana.
    static func toGrid(_ point: CGPoint, offset: CGPoint = .zero) -> GridPosition {
        let sx = point.x - offset.x
        let sy = point.y - offset.y
        let halfW = GardenGrid.tileW / 2
        let halfH = GardenGrid.tileH / 2
        let gxf = (sx / halfW + sy / halfH) / 2
        let gyf = (sy / halfH - sx / halfW) / 2
        return GridPosition(gx: Int(gxf.rounded()), gy: Int(gyf.rounded()))
    }

    /// `true` si la celda está dentro de la rejilla de lado `gridSize`.
    static func inBounds(gx: Int, gy: Int, gridSize: Int = GardenGrid.maxSize) -> Bool {
        gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize
    }

    /// `true` si la celda está en el "anillo de vista previa": la siguiente
    /// expansión de la rejilla, aún bloqueada.
    static func isPreviewTile(gx: Int, gy: Int, activeSize: Int) -> Bool {
        let previewSize = min(activeSize + 1, GardenGrid.maxSize)
        let inPreview = gx >= 0 && gx < previewSize && gy >= 0 && gy < previewSize
        let inActive = gx >= 0 && gx < activeSize && gy >= 0 && gy < activeSize
        return inPreview && !inActive
    }

    /// Las 4 esquinas del diamante de una baldosa.
    static func tileCorners(gx: Int, gy: Int, offset: CGPoint) -> TileCorners {
        let center = toScreen(gx: gx, gy: gy, offset: offset)
        let halfW = GardenGrid.tileW / 2
        let halfH = GardenGrid.tileH / 2
        return TileCorners(
            top: CGPoint(x: center.x, y: center.y - halfH),
            right: CGPoint(x: center.x + halfW, y: center.y),
            bottom: CGPoint(x: center.x, y: center.y + halfH),
            left: CGPoint(x: center.x - halfW, y: center.y)
        )
    }

    /// Tamaño de lienzo necesario para una rejilla completa, con margen extra
    /// arriba para el cielo y las plantas altas.
    static func canvasSize(gridSize: Int = GardenGrid.maxSize) -> CGSize {
        CGSize(
            width: CGFloat(gridSize) * GardenGrid.tileW + GardenGrid.tileW,
            height: CGFloat(gridSize) * GardenGrid.tileH + GardenGrid.tileH + 140
        )
    }

    /// Desplazamiento para centrar la rejilla dentro de un lienzo dado.
    static func centerOffset(canvasWidth: CGFloat, canvasHeight: CGFloat? = nil, gridSize: Int = GardenGrid.maxSize) -> CGPoint {
        let gridIsoH = CGFloat(gridSize) * GardenGrid.tileH + GardenGrid.tileH
        let plantExtraH: CGFloat = 80

        let offsetY: CGFloat
        if let canvasHeight, canvasHeight > gridIsoH + plantExtraH {
            offsetY = (canvasHeight - gridIsoH) / 2 + 10
        } else {
            offsetY = GardenGrid.tileH * 2 + 70
        }
        return CGPoint(x: canvasWidth / 2, y: offsetY)
    }

    /// Clave de orden para el algoritmo del pintor: las baldosas con menor
    /// `gx + gy` se dibujan primero (quedan "detrás").
    static func sortKey(gx: Int, gy: Int) -> Int { gx + gy }
}

extension Color {
    /// Interpola linealmente hacia otro color. `t` entre 0 (este color) y 1
    /// (`other`). Equivalente a `blendColors` de `gardenUtils.ts`.
    func blended(with other: Color, amount t: Double) -> Color {
        let a = resolvedComponents
        let b = other.resolvedComponents
        let clamped = min(max(t, 0), 1)
        return Color(
            .sRGB,
            red: a.r + (b.r - a.r) * clamped,
            green: a.g + (b.g - a.g) * clamped,
            blue: a.b + (b.b - a.b) * clamped,
            opacity: a.o + (b.o - a.o) * clamped
        )
    }

    /// Aclara el color hacia el blanco por un factor 0–1.
    func lightened(_ factor: Double) -> Color {
        let c = resolvedComponents
        let f = min(max(factor, 0), 1)
        return Color(
            .sRGB,
            red: c.r + (1 - c.r) * f,
            green: c.g + (1 - c.g) * f,
            blue: c.b + (1 - c.b) * f,
            opacity: c.o
        )
    }

    /// Oscurece el color hacia el negro por un factor 0–1.
    func darkened(_ factor: Double) -> Color {
        let c = resolvedComponents
        let f = min(max(factor, 0), 1)
        return Color(.sRGB, red: c.r * (1 - f), green: c.g * (1 - f), blue: c.b * (1 - f), opacity: c.o)
    }

    /// Componentes sRGB resueltos del color.
    private var resolvedComponents: (r: Double, g: Double, b: Double, o: Double) {
        let resolved = resolve(in: EnvironmentValues())
        return (Double(resolved.red), Double(resolved.green), Double(resolved.blue), Double(resolved.opacity))
    }
}
