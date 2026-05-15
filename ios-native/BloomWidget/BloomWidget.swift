import WidgetKit
import SwiftUI

// MARK: - Modelo compartido con la app

/// Snapshot del estado que la app principal escribe en el App Group para que
/// el widget lo lea. Debe coincidir con `WidgetSyncService.WidgetData`.
struct WidgetData: Codable {
    let streak: Int
    let streakEmoji: String
    let streakMessage: String
    let gardenLevel: Int
    let gardenName: String
    let seedBalance: Int
    let totalPlants: Int
    let lastCheckinDate: String
    let updatedAt: String

    static let empty = WidgetData(
        streak: 0, streakEmoji: "🌱",
        streakMessage: "Empieza tu racha hoy",
        gardenLevel: 1, gardenName: "Semillero",
        seedBalance: 0, totalPlants: 0,
        lastCheckinDate: "", updatedAt: ""
    )

    static let sample = WidgetData(
        streak: 7, streakEmoji: "🌻",
        streakMessage: "7 días · ¡Vas genial!",
        gardenLevel: 3, gardenName: "Jardín joven",
        seedBalance: 85, totalPlants: 12,
        lastCheckinDate: "2026-05-15", updatedAt: ""
    )
}

// MARK: - Provider

struct BloomProvider: TimelineProvider {
    private let appGroupID = "group.com.akemi01.bloom"
    private let storageKey = "widgetData"

    func placeholder(in context: Context) -> BloomEntry {
        BloomEntry(date: Date(), data: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (BloomEntry) -> Void) {
        completion(BloomEntry(date: Date(), data: loadWidgetData()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BloomEntry>) -> Void) {
        let entry = BloomEntry(date: Date(), data: loadWidgetData())
        // La app refresca el widget cuando cambia algo relevante
        // (`WidgetSyncService.refresh()`). El polling de 30 min es solo un
        // safety net por si la app no se abre en mucho tiempo.
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadWidgetData() -> WidgetData {
        guard let defaults = UserDefaults(suiteName: appGroupID),
              let jsonString = defaults.string(forKey: storageKey),
              let jsonData = jsonString.data(using: .utf8),
              let data = try? JSONDecoder().decode(WidgetData.self, from: jsonData) else {
            return .empty
        }
        return data
    }
}

struct BloomEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

// MARK: - Paleta del widget

private enum WidgetPalette {
    static let background = Color(red: 0.98, green: 0.96, blue: 0.94)
    static let terracotta = Color(red: 0.78, green: 0.55, blue: 0.34)
    static let sage = Color(red: 0.55, green: 0.66, blue: 0.53)
    static let amber = Color(red: 0.91, green: 0.66, blue: 0.28)
}

// MARK: - Vistas

private struct BloomWidgetSmallView: View {
    let entry: BloomEntry

    var body: some View {
        VStack(spacing: 6) {
            Text(entry.data.streakEmoji)
                .font(.system(size: 32))
            Text("\(entry.data.streak)")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(WidgetPalette.terracotta)
            Text(entry.data.streak == 1 ? "día" : "días")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct BloomWidgetMediumView: View {
    let entry: BloomEntry

    var body: some View {
        HStack(spacing: 16) {
            VStack(spacing: 4) {
                Text(entry.data.streakEmoji)
                    .font(.system(size: 28))
                Text("\(entry.data.streak)")
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .foregroundStyle(WidgetPalette.terracotta)
                Text(entry.data.streak == 1 ? "día" : "días")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            .frame(width: 80)

            Rectangle()
                .fill(Color.secondary.opacity(0.2))
                .frame(width: 1)
                .padding(.vertical, 8)

            VStack(alignment: .leading, spacing: 6) {
                Text(entry.data.streakMessage)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                    .minimumScaleFactor(0.85)

                HStack(spacing: 12) {
                    Label("Nv.\(entry.data.gardenLevel)", systemImage: "leaf.fill")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(WidgetPalette.sage)

                    Text("🌰 \(entry.data.seedBalance)")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(WidgetPalette.amber)
                }

                Text("\(entry.data.totalPlants) \(entry.data.totalPlants == 1 ? "planta" : "plantas")")
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 12)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct BloomWidgetEntryView: View {
    @Environment(\.widgetFamily) private var family
    let entry: BloomEntry

    var body: some View {
        switch family {
        case .systemMedium:
            BloomWidgetMediumView(entry: entry)
        default:
            BloomWidgetSmallView(entry: entry)
        }
    }
}

// MARK: - Widget

struct BloomWidget: Widget {
    let kind = "BloomWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BloomProvider()) { entry in
            BloomWidgetEntryView(entry: entry)
                .containerBackground(WidgetPalette.background, for: .widget)
        }
        .configurationDisplayName("Bloom")
        .description("Tu racha y jardín emocional")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Previews

#Preview("Pequeño", as: .systemSmall) {
    BloomWidget()
} timeline: {
    BloomEntry(date: .now, data: .sample)
}

#Preview("Mediano", as: .systemMedium) {
    BloomWidget()
} timeline: {
    BloomEntry(date: .now, data: WidgetData(
        streak: 14, streakEmoji: "🌳",
        streakMessage: "14 días · ¡Increíble!",
        gardenLevel: 4, gardenName: "Jardín floreciente",
        seedBalance: 120, totalPlants: 22,
        lastCheckinDate: "2026-05-15", updatedAt: ""
    ))
}
