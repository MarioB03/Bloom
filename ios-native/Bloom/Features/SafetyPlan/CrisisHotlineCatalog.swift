import Foundation

/// Catálogo estático de líneas de crisis, agrupable por país.
/// Portado de `CRISIS_HOTLINES` en `src/constants/crisisHotlines.ts`.
enum CrisisHotlineCatalog {

    /// Todas las líneas de crisis disponibles, en el orden canónico de la app.
    static let all: [CrisisHotline] = [
        CrisisHotline(name: "Teléfono de la Esperanza", phone: "717003717", country: "España", emoji: "🇪🇸"),
        CrisisHotline(name: "Línea 024", phone: "024", country: "España", emoji: "🇪🇸"),
        CrisisHotline(name: "SAPTEL", phone: "5552598121", country: "México", emoji: "🇲🇽"),
        CrisisHotline(name: "Centro de Asistencia al Suicida", phone: "135", country: "Argentina", emoji: "🇦🇷"),
        CrisisHotline(name: "Línea 106", phone: "106", country: "Perú", emoji: "🇵🇪"),
        CrisisHotline(name: "Línea 600", phone: "6003607777", country: "Chile", emoji: "🇨🇱"),
    ]

    /// Las líneas agrupadas por país, conservando el orden de aparición.
    static let groupedByCountry: [(country: String, hotlines: [CrisisHotline])] = {
        var order: [String] = []
        var groups: [String: [CrisisHotline]] = [:]
        for hotline in all {
            if groups[hotline.country] == nil {
                order.append(hotline.country)
                groups[hotline.country] = []
            }
            groups[hotline.country]?.append(hotline)
        }
        return order.map { (country: $0, hotlines: groups[$0] ?? []) }
    }()
}
