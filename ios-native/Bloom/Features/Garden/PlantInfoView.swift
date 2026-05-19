import SwiftUI

/// Hoja de detalle de una planta del jardín: especie, emoción de origen, fecha
/// de plantado, intensidad, etapa de crecimiento y acción de regar.
/// Portado de `src/components/garden/PlantInfoModal.tsx`.
///
/// Se presenta como `sheet` nativa con detente fija: el indicador de arrastre
/// y el toque fuera sustituyen a la X de cierre custom de la versión RN.
struct PlantInfoView: View {

    let plant: PlantPlacement
    /// Se invoca al pulsar "Regar planta". La hoja se cierra a continuación.
    let onWater: () -> Void

    @Environment(\.dismiss) private var dismiss

    private var emotion: EmotionConfig { plant.emotion.config }
    private var morphology: PlantMorphology { plant.emotion.plantMorphology }

    private var plantedDate: String {
        guard let date = BloomDate.date(fromKey: plant.date) else { return plant.date }
        return BloomDate.displayDate(date)
    }

    private var canWater: Bool { !plant.wateredToday }

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
            colorBar
            header
            infoGrid
            progressBar
            waterSection
        }
        .padding(Theme.Spacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .presentationDetents([.height(360)])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Secciones

    private var colorBar: some View {
        Capsule()
            .fill(emotion.color)
            .frame(width: 40, height: 4)
            .frame(maxWidth: .infinity, alignment: .center)
    }

    private var header: some View {
        HStack(spacing: Theme.Spacing.md) {
            BloomIconView(emotion.icon, size: 44)
            VStack(alignment: .leading, spacing: 1) {
                Text(morphology.name)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)
                Text(emotion.label)
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.neutral500)
            }
            Spacer()
        }
    }

    private var infoGrid: some View {
        HStack(spacing: 0) {
            infoItem(value: plantedDate, label: Strings.Garden.plantPlanted)
            infoDivider
            infoItem(
                value: Strings.CheckIn.intensityLabel(plant.intensity),
                label: Strings.Garden.plantIntensity
            )
            infoDivider
            infoItem(
                value: Strings.Garden.growthLabel(plant.growthStage),
                label: Strings.Garden.plantGrowth
            )
        }
    }

    private func infoItem(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(Theme.Palette.neutral700)
                .multilineTextAlignment(.center)
            Text(label)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral400)
        }
        .frame(maxWidth: .infinity)
    }

    private var infoDivider: some View {
        Rectangle()
            .fill(Theme.Palette.neutral200)
            .frame(width: 1, height: 28)
    }

    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Theme.Palette.neutral200)
                Capsule()
                    .fill(emotion.color)
                    .frame(width: geo.size.width * CGFloat(plant.growthStage) / 5)
            }
        }
        .frame(height: 6)
    }

    @ViewBuilder
    private var waterSection: some View {
        if canWater {
            Button {
                onWater()
                dismiss()
            } label: {
                HStack(spacing: Theme.Spacing.sm) {
                    Text("💧")
                        .font(.system(size: 18))
                    VStack(spacing: 1) {
                        Text(Strings.Garden.plantWater)
                            .font(.bodyBold)
                        if plant.growthStage < 5 {
                            Text(Strings.Garden.plantWaterHint)
                                .font(.system(size: 11))
                                .foregroundStyle(.white.opacity(0.7))
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, Theme.Spacing.sm + 2)
                .foregroundStyle(.white)
                .background(Theme.Palette.info)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
            }
            .buttonStyle(.plain)
        } else {
            Text("✓ \(Strings.Garden.plantWateredToday)")
                .font(.caption)
                .foregroundStyle(Theme.Palette.secondary500)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Theme.Spacing.sm)
        }
    }
}
