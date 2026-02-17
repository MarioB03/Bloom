//
//  BloomWidget.swift
//  BloomWidget
//
//  Created by Mario Belenguer Urpinell on 17/2/26.
//

import WidgetKit
import SwiftUI

// MARK: - Data Model

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
}

// MARK: - Timeline Provider

struct BloomProvider: TimelineProvider {
    private let appGroupID = "group.com.akemi01.bloom"

    func placeholder(in context: Context) -> BloomEntry {
        BloomEntry(date: Date(), data: WidgetData(
            streak: 5, streakEmoji: "🌻", streakMessage: "5 días seguidos",
            gardenLevel: 2, gardenName: "Brote", seedBalance: 42,
            totalPlants: 8, lastCheckinDate: "", updatedAt: ""
        ))
    }

    func getSnapshot(in context: Context, completion: @escaping (BloomEntry) -> Void) {
        completion(BloomEntry(date: Date(), data: loadWidgetData()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BloomEntry>) -> Void) {
        let entry = BloomEntry(date: Date(), data: loadWidgetData())
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadWidgetData() -> WidgetData {
        guard let defaults = UserDefaults(suiteName: appGroupID),
              let jsonString = defaults.string(forKey: "widgetData"),
              let jsonData = jsonString.data(using: .utf8),
              let data = try? JSONDecoder().decode(WidgetData.self, from: jsonData) else {
            return WidgetData(
                streak: 0, streakEmoji: "🌱", streakMessage: "Empieza tu racha hoy",
                gardenLevel: 1, gardenName: "Semillero", seedBalance: 0,
                totalPlants: 0, lastCheckinDate: "", updatedAt: ""
            )
        }
        return data
    }
}

// MARK: - Timeline Entry

struct BloomEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

// MARK: - Small Widget View

struct BloomWidgetSmallView: View {
    let entry: BloomEntry

    var body: some View {
        VStack(spacing: 6) {
            Text(entry.data.streakEmoji)
                .font(.system(size: 32))
            Text("\(entry.data.streak)")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundColor(Color(red: 0.78, green: 0.55, blue: 0.34))
            Text("días")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Medium Widget View

struct BloomWidgetMediumView: View {
    let entry: BloomEntry

    var body: some View {
        HStack(spacing: 16) {
            VStack(spacing: 4) {
                Text(entry.data.streakEmoji)
                    .font(.system(size: 28))
                Text("\(entry.data.streak)")
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .foregroundColor(Color(red: 0.78, green: 0.55, blue: 0.34))
                Text("días")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.secondary)
            }
            .frame(width: 80)

            Rectangle()
                .fill(Color.secondary.opacity(0.2))
                .frame(width: 1)
                .padding(.vertical, 8)

            VStack(alignment: .leading, spacing: 6) {
                Text(entry.data.streakMessage)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.primary)
                    .lineLimit(1)

                HStack(spacing: 12) {
                    Label("Nv.\(entry.data.gardenLevel)", systemImage: "leaf.fill")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(Color(red: 0.55, green: 0.66, blue: 0.53))

                    Text("🌰 \(entry.data.seedBalance)")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(Color(red: 0.91, green: 0.66, blue: 0.28))
                }

                Text("\(entry.data.totalPlants) plantas")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 12)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Widget Configuration

struct BloomWidget: Widget {
    let kind = "BloomWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BloomProvider()) { entry in
            BloomWidgetEntryView(entry: entry)
                .containerBackground(Color(red: 0.98, green: 0.96, blue: 0.94), for: .widget)
        }
        .configurationDisplayName("Bloom")
        .description("Tu racha y jardín emocional")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct BloomWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
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

#Preview(as: .systemSmall) {
    BloomWidget()
} timeline: {
    BloomEntry(date: .now, data: WidgetData(
        streak: 7, streakEmoji: "🌻", streakMessage: "7 días · ¡Vas genial!",
        gardenLevel: 3, gardenName: "Jardín joven", seedBalance: 85,
        totalPlants: 12, lastCheckinDate: "2026-02-17", updatedAt: ""
    ))
}

#Preview(as: .systemMedium) {
    BloomWidget()
} timeline: {
    BloomEntry(date: .now, data: WidgetData(
        streak: 14, streakEmoji: "🌳", streakMessage: "14 días · ¡Increíble!",
        gardenLevel: 4, gardenName: "Jardín floreciente", seedBalance: 120,
        totalPlants: 22, lastCheckinDate: "2026-02-17", updatedAt: ""
    ))
}
