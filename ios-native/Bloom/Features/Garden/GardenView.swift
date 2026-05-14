import SwiftUI

/// Pantalla del jardín de bienestar: cabecera, tarjeta de progreso (racha,
/// plantas, semillas) y la escena isométrica con las plantas que han brotado
/// de los check-ins. Equivalente a `app/jardin.tsx` en la app React Native.
///
/// De momento la escena es estática y solo se muestra: la interacción (regar,
/// decorar, tienda) y la animación llegan en fases posteriores.
struct GardenView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore

    @State private var store = GardenStore()

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
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
                    scene
                }
            }
        }
        .padding(.horizontal, Theme.Spacing.md)
        .padding(.top, Theme.Spacing.md)
        .padding(.bottom, Theme.Spacing.md)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.Palette.background)
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
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
            streak: store.streak
        )
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .bloomShadow(.sm)
    }

    // MARK: - Datos

    private func load() async {
        guard let userID = auth.currentUserID else { return }
        await store.load(firestore: firestore, userID: userID)
    }
}
