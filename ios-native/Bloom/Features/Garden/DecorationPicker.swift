import SwiftUI

/// Paleta de decoraciones del modo Decorar. Equivalente nativo de
/// `src/components/garden/DecorationPicker.tsx`.
///
/// Se presenta como hoja modal: aquí se *elige* el "pincel" (puede tapar el
/// jardín sin problema, no se coloca mientras se elige); al seleccionar una
/// decoración la hoja se cierra y el jardín queda entero para *colocar*.
///
/// Es una `List` de dos secciones —gratuitas por racha y premium— con el mismo
/// patrón de fila que `GardenShop`. Elegir una decoración usable la deja como
/// pincel activo; tocar una premium no comprada ofrece comprarla.
struct DecorationPicker: View {

    @Bindable var store: GardenStore

    @Environment(\.dismiss) private var dismiss

    @State private var pendingPurchase: DecorationConfig?
    @State private var showInsufficient = false

    private var freeConfigs: [DecorationConfig] {
        DecorationConfig.ordered.filter { !$0.isPremium }
    }

    private var premiumConfigs: [DecorationConfig] {
        DecorationConfig.ordered.filter(\.isPremium)
    }

    var body: some View {
        NavigationStack {
            List {
                Section(Strings.Garden.decorationsStreakSection) {
                    ForEach(freeConfigs, id: \.type) { row($0) }
                }
                Section(Strings.Garden.decorationsPremiumSection) {
                    ForEach(premiumConfigs, id: \.type) { row($0) }
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background(Theme.Palette.background)
            .navigationTitle(Strings.Garden.decorationsTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { balanceBadge }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(Strings.Common.done) { dismiss() }
                }
            }
        }
        .presentationDragIndicator(.visible)
        .alert(
            Strings.Shop.confirmTitle,
            isPresented: Binding(
                get: { pendingPurchase != nil },
                set: { if !$0 { pendingPurchase = nil } }
            ),
            presenting: pendingPurchase
        ) { config in
            Button(Strings.Shop.buyButton) {
                let bought = store.purchaseDecoration(config.type)
                pendingPurchase = nil
                if bought { dismiss() }
            }
            Button(Strings.Common.cancel, role: .cancel) { pendingPurchase = nil }
        } message: { config in
            Text("\(config.emoji) \(config.label)\n\(config.cost ?? 0) \(Strings.Shop.seedUnit)")
        }
        .alert(Strings.Shop.insufficientTitle, isPresented: $showInsufficient) {
            Button(Strings.Common.close, role: .cancel) {}
        } message: {
            Text(Strings.Shop.insufficientMessage)
        }
    }

    // MARK: - Saldo

    private var balanceBadge: some View {
        Text("\(store.seedBalance.total) \(Strings.Shop.seedUnit)")
            .font(.system(size: 13, weight: .bold, design: .rounded))
            .foregroundStyle(Theme.Palette.accent600)
            .fixedSize()
            .padding(.horizontal, Theme.Spacing.sm)
            .padding(.vertical, 3)
            .background(Theme.Palette.accent50, in: Capsule())
    }

    // MARK: - Fila

    private func row(_ config: DecorationConfig) -> some View {
        let owned = config.isPremium && store.purchasedIDs.contains(config.type.rawValue)
        let streakLocked = !config.isPremium && store.streak < config.unlockStreak
        let selected = store.selectedDecorationType == config.type

        return Button {
            handleTap(config, owned: owned, streakLocked: streakLocked)
        } label: {
            HStack(spacing: Theme.Spacing.md) {
                Text(streakLocked ? "🔒" : config.emoji)
                    .font(.system(size: 24))
                    .frame(width: 40, height: 40)
                    .background(Theme.Palette.accent50, in: RoundedRectangle(cornerRadius: Theme.Radius.sm))

                Text(config.label)
                    .font(.bodyBold)
                    .foregroundStyle(streakLocked ? Theme.Palette.neutral400 : Theme.Palette.neutral800)

                Spacer(minLength: Theme.Spacing.sm)

                trailing(config, owned: owned, streakLocked: streakLocked, selected: selected)
            }
            .padding(.vertical, 4)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(streakLocked)
    }

    @ViewBuilder
    private func trailing(
        _ config: DecorationConfig,
        owned: Bool,
        streakLocked: Bool,
        selected: Bool
    ) -> some View {
        if selected {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 18))
                .foregroundStyle(Theme.Palette.accent500)
        } else if streakLocked {
            Text(Strings.Garden.decorationStreakNeeded(config.unlockStreak))
                .font(.caption)
                .foregroundStyle(Theme.Palette.neutral400)
        } else if owned {
            HStack(spacing: 3) {
                Image(systemName: "checkmark.circle.fill")
                Text(Strings.Garden.decorationOwned)
            }
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(Theme.Palette.success)
        } else if config.isPremium {
            let canAfford = store.seedBalance.total >= (config.cost ?? 0)
            Text("\(config.cost ?? 0) \(Strings.Shop.seedUnit)")
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(canAfford ? Theme.Palette.accent600 : Theme.Palette.neutral400)
                .padding(.horizontal, Theme.Spacing.sm + 2)
                .padding(.vertical, 5)
                .background(
                    canAfford ? Theme.Palette.accent50 : Theme.Palette.neutral100,
                    in: Capsule()
                )
        }
    }

    // MARK: - Selección

    private func handleTap(_ config: DecorationConfig, owned: Bool, streakLocked: Bool) {
        if streakLocked { return }

        if config.isPremium && !owned {
            if store.seedBalance.total >= (config.cost ?? 0) {
                pendingPurchase = config
            } else {
                showInsufficient = true
            }
            return
        }

        store.selectedDecorationType = config.type
        dismiss()
    }
}
