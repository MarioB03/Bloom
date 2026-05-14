import SwiftUI

/// Tarjeta de estadísticas bajo la escena del jardín: flores plantadas,
/// emoción/planta dominante y vitalidad (porcentaje de plantas regadas hoy)
/// con su barra de progreso. Equivalente nativo de `GardenStats.tsx`.
struct GardenStatsView: View {
    let plants: [PlantPlacement]

    private var totalPlants: Int { plants.count }
    private var wateredCount: Int { plants.filter(\.wateredToday).count }

    /// Emoción más frecuente entre las plantas, o `nil` si no hay ninguna.
    private var topEmotion: EmotionID? {
        var counts: [EmotionID: Int] = [:]
        for plant in plants { counts[plant.emotion, default: 0] += 1 }
        return counts.max { $0.value < $1.value }?.key
    }

    /// Porcentaje de plantas regadas hoy (0–100).
    private var vitality: Int {
        guard totalPlants > 0 else { return 0 }
        return Int((Double(wateredCount) / Double(totalPlants) * 100).rounded())
    }

    private var vitalityColor: Color {
        if vitality >= 80 { Theme.Palette.secondary500 }
        else if vitality >= 40 { Theme.Palette.accent400 }
        else { Theme.Palette.neutral400 }
    }

    private var vitalityLabel: String {
        if vitality == 100 { Strings.Garden.vitalityFull }
        else if vitality >= 80 { Strings.Garden.vitalityHealthy }
        else if vitality >= 40 { Strings.Garden.vitalityThirsty }
        else { Strings.Garden.vitalityDry }
    }

    var body: some View {
        if plants.isEmpty {
            EmptyView()
        } else {
            content
        }
    }

    private var content: some View {
        VStack(spacing: Theme.Spacing.sm) {
            HStack(spacing: 0) {
                stat(value: "\(totalPlants)", label: Strings.Garden.flowersPlanted)
                divider
                topEmotionStat
                if totalPlants > 0 {
                    divider
                    stat(value: "\(vitality)%", label: vitalityLabel, valueColor: vitalityColor)
                }
            }
            if totalPlants > 0 {
                vitalityBar
            }
        }
        .padding(Theme.Spacing.md)
        .background(Theme.Palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .bloomShadow(.sm)
    }

    @ViewBuilder
    private var topEmotionStat: some View {
        VStack(spacing: 2) {
            if let topEmotion {
                HStack(spacing: 4) {
                    Circle()
                        .fill(topEmotion.config.color)
                        .frame(width: 10, height: 10)
                    Text(topEmotion.config.emoji)
                        .font(.system(size: 18))
                }
                Text(topEmotion.plantMorphology.name)
                    .font(.smallText)
                    .foregroundStyle(Theme.Palette.neutral500)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func stat(
        value: String,
        label: String,
        valueColor: Color = Theme.Palette.neutral700
    ) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(valueColor)
            Text(label)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral500)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }

    private var divider: some View {
        Rectangle()
            .fill(Theme.Palette.neutral200)
            .frame(width: 1, height: 36)
    }

    private var vitalityBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Theme.Palette.neutral200)
                Capsule()
                    .fill(vitalityColor)
                    .frame(width: geo.size.width * CGFloat(vitality) / 100)
            }
        }
        .frame(height: 4)
    }
}
