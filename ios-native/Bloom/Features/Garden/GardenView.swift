import SwiftUI

/// Pantalla del jardín de bienestar: cabecera, tarjeta de progreso (racha,
/// plantas, semillas) y la escena isométrica con las plantas que han brotado
/// de los check-ins. Equivalente a `app/jardin.tsx` en la app React Native.
///
/// La escena está animada y es interactiva: en modo "mirar" un toque sobre una
/// planta abre su detalle; en "regar" la riega; en "decorar" coloca la
/// decoración elegida en una celda libre o quita la que ya hubiera.
///
/// El modo Decorar separa *elegir* de *colocar*: un chip compacto bajo la barra
/// de modos muestra la decoración activa y abre la paleta (`DecorationPicker`)
/// como hoja modal; el jardín queda entero y libre para colocar. La tienda
/// (`GardenShop`) también es una hoja, desde el toolbar.
struct GardenView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore

    @State private var store = GardenStore()
    @State private var shopPresented = false
    @State private var decorationPickerPresented = false

    var body: some View {
        @Bindable var store = store
        return VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            header
            statsCard

            Group {
                if store.loading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if store.layout.plants.isEmpty {
                    EmptyState(emoji: "🌱", message: Strings.Garden.emptyMessage)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    VStack(spacing: Theme.Spacing.sm) {
                        modeToolbar
                        if store.mode == .decorate {
                            decorationChip
                        }
                        modeHint
                        scene
                    }
                }
            }
        }
        .padding(.horizontal, Theme.Spacing.md)
        .padding(.top, Theme.Spacing.md)
        .padding(.bottom, Theme.Spacing.md)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.Palette.background)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    shopPresented = true
                } label: {
                    Image(systemName: "bag")
                }
                .accessibilityLabel(Strings.Garden.shopButton)
                .disabled(store.loading)
            }
        }
        .task { await load() }
        .sheet(item: $store.selectedPlant) { plant in
            PlantInfoView(plant: plant) {
                store.waterPlant(gx: plant.gx, gy: plant.gy)
            }
        }
        .sheet(isPresented: $shopPresented) {
            GardenShop(store: store)
        }
    }

    // MARK: - Barra de modos

    private var modeToolbar: some View {
        HStack(spacing: Theme.Spacing.sm) {
            modeButton(.view, icon: "eye", label: Strings.Garden.modeView)
            modeButton(.water, icon: "drop", label: Strings.Garden.modeWater)
            modeButton(.decorate, icon: "paintpalette", label: Strings.Garden.modeDecorate)
        }
    }

    private func modeButton(_ mode: InteractionMode, icon: String, label: String) -> some View {
        let isActive = store.mode == mode
        return Button {
            withAnimation(.snappy(duration: 0.3)) {
                store.mode = mode
                if mode != .decorate { store.selectedDecorationType = nil }
            }
            // Entrar a Decorar sin pincel elegido abre la paleta directamente.
            if mode == .decorate, store.selectedDecorationType == nil {
                decorationPickerPresented = true
            }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                Text(label)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                if mode == .water {
                    let watered = store.layout.plants.filter(\.wateredToday).count
                    Text("\(watered)/\(store.layout.plants.count)")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(isActive ? Theme.Palette.surface : Theme.Palette.neutral400)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 1)
                        .background(isActive ? Color.white.opacity(0.2) : Theme.Palette.neutral100)
                        .clipShape(Capsule())
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.sm)
            .foregroundStyle(isActive ? Theme.Palette.surface : Theme.Palette.neutral500)
            .background(isActive ? Theme.Palette.primary400 : Theme.Palette.surface)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.md)
                    .strokeBorder(isActive ? .clear : Theme.Palette.neutral200, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
        }
        .buttonStyle(.plain)
    }

    private var modeHint: some View {
        Text(hintText)
            .font(.smallText)
            .foregroundStyle(Theme.Palette.neutral400)
            .frame(maxWidth: .infinity, alignment: .center)
    }

    private var hintText: String {
        switch store.mode {
        case .water: Strings.Garden.modeWaterHint
        case .decorate: Strings.Garden.modeDecorateHint
        case .view, .move: Strings.Garden.modeViewHint
        }
    }

    // MARK: - Chip de decoración activa

    /// Muestra la decoración seleccionada (el "pincel" del modo Decorar) y abre
    /// la paleta al tocarlo. Si no hay ninguna elegida, invita a elegir.
    private var decorationChip: some View {
        Button {
            decorationPickerPresented = true
        } label: {
            HStack(spacing: Theme.Spacing.sm) {
                if let type = store.selectedDecorationType {
                    Text(type.config.emoji)
                        .font(.system(size: 18))
                    Text(type.config.label)
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .foregroundStyle(Theme.Palette.neutral800)
                    Spacer()
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Theme.Palette.neutral400)
                } else {
                    Image(systemName: "paintpalette")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.Palette.primary400)
                    Text(Strings.Garden.decoratePickPrompt)
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .foregroundStyle(Theme.Palette.primary500)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Theme.Palette.primary300)
                }
            }
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.vertical, Theme.Spacing.sm + 2)
            .background(Theme.Palette.surface)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.md)
                    .strokeBorder(Theme.Palette.neutral200, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
        }
        .buttonStyle(.plain)
    }

    // MARK: - Cabecera

    private var header: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            Text(Strings.Garden.title)
                .font(.displayMedium)
                .foregroundStyle(Theme.Palette.neutral800)
            Text(Strings.Garden.subtitle)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Tarjeta de progreso

    private var statsCard: some View {
        BloomCard {
            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                HStack(spacing: 6) {
                    Text(Strings.Garden.levelLabel.uppercased())
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .tracking(0.8)
                        .foregroundStyle(Theme.Palette.neutral500)
                    Text(store.level.name)
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(Theme.Palette.primary500)
                }

                HStack(spacing: 0) {
                    stat(
                        value: "\(Streak.emoji(store.streak)) \(store.streak)",
                        label: Strings.Garden.streakLabel
                    )
                    divider
                    stat(
                        value: "\(store.layout.plants.count)",
                        label: Strings.Garden.plantCount(store.layout.plants.count)
                    )
                    divider
                    stat(
                        value: "🌱 \(store.seedBalance.total)",
                        label: Strings.Garden.seedsLabel
                    )
                }
            }
        }
    }

    private func stat(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundStyle(Theme.Palette.neutral800)
            Text(label)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral500)
        }
        .frame(maxWidth: .infinity)
    }

    private var divider: some View {
        Rectangle()
            .fill(Theme.Palette.neutral200)
            .frame(width: 1, height: 32)
    }

    // MARK: - Escena

    private var scene: some View {
        GardenScene(
            layout: store.layout,
            gridSize: store.gridSize,
            season: store.season,
            cosmetics: store.cosmetics,
            streak: store.streak,
            mode: store.mode,
            activePets: store.activePets,
            waterEffects: store.waterEffects,
            onTapCell: { gx, gy in store.handleCellTap(gx: gx, gy: gy) }
        )
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .bloomShadow(.sm)
        .sheet(isPresented: $decorationPickerPresented) {
            DecorationPicker(store: store)
        }
    }

    // MARK: - Datos

    private func load() async {
        guard let userID = auth.currentUserID else { return }
        await store.load(firestore: firestore, userID: userID)
    }
}
