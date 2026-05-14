import SwiftUI

/// Pantalla de logros: un resumen del progreso y dos rejillas de tarjetas, una
/// con los logros de app y otra con los del jardín. Portado de `app/logros.tsx`.
///
/// Punto de entrada: en la app RN vive en la pestaña de perfil (aún no portada);
/// aquí se accede desde el botón 🏆 de la cabecera del home.
struct AchievementsView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore

    @State private var appUnlocked: Set<String> = []
    @State private var gardenUnlocked: Set<String> = []
    @State private var timestamps: [String: Date] = [:]
    @State private var achievementData: AppAchievementData?
    @State private var isLoading = true

    private let columns = [
        GridItem(.flexible(), spacing: Theme.Spacing.sm),
        GridItem(.flexible(), spacing: Theme.Spacing.sm),
    ]

    private var totalUnlocked: Int {
        appUnlocked.count + gardenUnlocked.count
    }

    private var totalAchievements: Int {
        AppAchievementCatalog.all.count + GardenAchievement.all.count
    }

    var body: some View {
        ScreenWrapper {
            if isLoading {
                ProgressView()
                    .tint(Theme.Palette.primary400)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Theme.Spacing.xxl)
            } else {
                summaryCard
                appSection
                gardenSection
            }
        }
        .navigationTitle(Strings.Achievements.title)
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Resumen

    private var summaryCard: some View {
        HStack(spacing: Theme.Spacing.md) {
            Text("🏆")
                .font(.system(size: 36))
            VStack(alignment: .leading, spacing: 2) {
                Text(Strings.Achievements.summaryCount(unlocked: totalUnlocked, total: totalAchievements))
                    .font(.custom("DMSans-Bold", size: 22))
                    .foregroundStyle(Theme.Palette.neutral800)
                Text(Strings.Achievements.subtitle)
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.neutral500)
            }
            Spacer()
        }
        .padding(Theme.Spacing.lg)
        .background(Theme.Palette.accent50)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.xl)
                .strokeBorder(Theme.Palette.accent100, lineWidth: 1)
        )
    }

    // MARK: - Logros de app

    private var appSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text(Strings.Achievements.sectionApp)
                .font(.heading3)
                .foregroundStyle(Theme.Palette.neutral700)

            LazyVGrid(columns: columns, spacing: Theme.Spacing.sm) {
                ForEach(AppAchievementCatalog.all) { achievement in
                    appCard(achievement)
                }
            }
        }
        .padding(.top, Theme.Spacing.sm)
    }

    private func appCard(_ achievement: AppAchievement) -> some View {
        let isUnlocked = appUnlocked.contains(achievement.id)
        let progress = achievementData.map {
            AppAchievementCatalog.progress(for: achievement, data: $0)
        } ?? 0
        return achievementCard(
            emoji: achievement.emoji,
            title: achievement.title,
            isUnlocked: isUnlocked
        ) {
            if isUnlocked, let date = timestamps[achievement.id] {
                Text(Self.dateFormatter.string(from: date))
                    .font(.smallText)
                    .foregroundStyle(Theme.Palette.accent500)
            } else if !isUnlocked {
                Text("\(progress)/\(achievement.threshold)")
                    .font(.smallText)
                    .foregroundStyle(Theme.Palette.neutral400)
            }
        }
    }

    // MARK: - Logros del jardín

    private var gardenSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text(Strings.Achievements.sectionGarden)
                .font(.heading3)
                .foregroundStyle(Theme.Palette.neutral700)

            LazyVGrid(columns: columns, spacing: Theme.Spacing.sm) {
                ForEach(GardenAchievement.all) { achievement in
                    gardenCard(achievement)
                }
            }
        }
        .padding(.top, Theme.Spacing.sm)
    }

    private func gardenCard(_ achievement: GardenAchievement) -> some View {
        let isUnlocked = gardenUnlocked.contains(achievement.id)
        return achievementCard(
            emoji: achievement.emoji,
            title: achievement.title,
            isUnlocked: isUnlocked
        ) {
            Text(achievement.description)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral500)
                .multilineTextAlignment(.center)
                .lineLimit(2)
        }
    }

    // MARK: - Tarjeta común

    private func achievementCard<Footer: View>(
        emoji: String,
        title: String,
        isUnlocked: Bool,
        @ViewBuilder footer: () -> Footer
    ) -> some View {
        VStack(spacing: Theme.Spacing.xs) {
            Text(isUnlocked ? emoji : "🔒")
                .font(.system(size: 28))
            Text(title)
                .font(.bodyBold)
                .foregroundStyle(isUnlocked ? Theme.Palette.neutral700 : Theme.Palette.neutral400)
                .multilineTextAlignment(.center)
            footer()
        }
        .frame(maxWidth: .infinity, minHeight: 124)
        .padding(Theme.Spacing.md)
        .background(isUnlocked ? Theme.Palette.accent50 : Theme.Palette.neutral100)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.lg)
                .strokeBorder(
                    isUnlocked ? Theme.Palette.accent200 : .clear,
                    lineWidth: 1
                )
        )
    }

    // MARK: - Datos

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "es_ES")
        formatter.dateFormat = "d MMM"
        return formatter
    }()

    private func load() async {
        appUnlocked = Set(AppAchievementPersistence.loadUnlocked())
        gardenUnlocked = Set(GardenPersistence.loadUnlockedAchievements())
        timestamps = AppAchievementPersistence.loadTimestamps()

        if let userID = auth.currentUserID {
            achievementData = try? await AppAchievements.buildData(userID: userID, firestore: firestore)
        }
        isLoading = false
    }
}

#Preview {
    NavigationStack {
        AchievementsView()
    }
    .environment(AuthService())
    .environment(FirestoreService())
}
