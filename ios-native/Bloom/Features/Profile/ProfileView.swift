import SwiftUI
import FirebaseAuth

/// Destinos de navegación dentro de la pestaña "Tú".
enum ProfileRoute: Hashable {
    case insights
    case achievements
    case safetyPlan
    case premium
    case sharing
    case deleteAccount
    case privacyPolicy
}

/// Pestaña "Tú": perfil, estadísticas, accesos a otras secciones, cuenta y
/// cierre de sesión. Portado de `app/(tabs)/tu.tsx` de la app React Native.
///
/// Diverge de RN: Insights deja de ser una pestaña independiente y entra
/// como acceso desde aquí, manteniendo la canónica de 5 pestañas
/// (Hoy, Calendario, Registros, Habilidades, Tú).
///
/// Funciones de la pantalla RN que no se portan todavía porque dependen de
/// features aún ⬜ en `MIGRATION.md`: recordatorio diario (notificaciones),
/// exportar datos (premium + export PDF), selector de género (`GenderContext`
/// transversal), entradas Premium y Compartir cuenta.
struct ProfileView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore
    @Environment(PremiumService.self) private var premium

    @State private var totalCheckins = 0
    @State private var uniqueDays = 0
    @State private var streak = 0
    @State private var isLoading = true
    @State private var loggingOut = false
    @State private var showLogoutConfirm = false
    @State private var path: [ProfileRoute] = []

    var body: some View {
        NavigationStack(path: $path) {
            ScreenWrapper {
                profileHeader
                statsRow
                navCard
                accountCard
                aboutCard
                logoutButton
            }
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: ProfileRoute.self) { route in
                switch route {
                case .insights: InsightsView()
                case .achievements: AchievementsView()
                case .safetyPlan: SafetyPlanView()
                case .premium: PremiumView()
                case .sharing: SharingView()
                case .deleteAccount: DeleteAccountView()
                case .privacyPolicy: PrivacyPolicyView()
                }
            }
        }
        .task { await loadStats() }
        .confirmationDialog(
            Strings.Profile.logoutConfirmMessage,
            isPresented: $showLogoutConfirm,
            titleVisibility: .visible
        ) {
            Button(Strings.Profile.logout, role: .destructive) {
                performLogout()
            }
            Button(Strings.Common.cancel, role: .cancel) {}
        }
    }

    // MARK: - Secciones

    private var profileHeader: some View {
        VStack(spacing: Theme.Spacing.md) {
            ZStack {
                Circle()
                    .fill(Theme.Palette.primary400)
                    .frame(width: 80, height: 80)
                    .bloomShadow(.warm)
                Text(initial)
                    .font(.custom("DMSerifDisplay-Regular", size: 34))
                    .foregroundStyle(Theme.Palette.neutral50)
            }
            VStack(spacing: Theme.Spacing.xs) {
                Text(displayName)
                    .font(.displaySmall)
                    .foregroundStyle(Theme.Palette.neutral800)
                Text(email)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral400)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, Theme.Spacing.lg)
        .padding(.bottom, Theme.Spacing.md)
    }

    private var statsRow: some View {
        HStack(spacing: Theme.Spacing.sm) {
            StatCard(value: "\(totalCheckins)", label: Strings.Profile.checkinsStat)
            StatCard(value: "\(uniqueDays)", label: Strings.Profile.activeDaysStat)
            StatCard(value: "\(Streak.emoji(streak)) \(streak)", label: Strings.Profile.streakStat)
        }
    }

    private var navCard: some View {
        BloomCard {
            navRow(
                icon: "chart.line.uptrend.xyaxis",
                tint: Theme.Palette.primary400,
                label: Strings.Insights.title,
                description: Strings.Profile.insightsDesc,
                route: .insights
            )
            Divider().overlay(Theme.Palette.neutral100)
            navRow(
                icon: "trophy.fill",
                tint: Theme.Palette.accent500,
                label: Strings.Achievements.title,
                description: Strings.Profile.achievementsDesc,
                route: .achievements
            )
            Divider().overlay(Theme.Palette.neutral100)
            navRow(
                icon: "shield.fill",
                tint: Theme.Palette.secondary500,
                label: Strings.SafetyPlan.title,
                description: Strings.Profile.safetyPlanDesc,
                route: .safetyPlan
            )
            Divider().overlay(Theme.Palette.neutral100)
            navRow(
                icon: "sparkles",
                tint: Theme.Palette.accent500,
                label: Strings.Premium.entryLabel,
                description: Strings.Premium.entryDesc,
                route: .premium,
                badge: premium.isPremium ? Strings.Premium.activeBadge : nil
            )
            Divider().overlay(Theme.Palette.neutral100)
            navRow(
                icon: "person.2.fill",
                tint: Theme.Palette.info,
                label: Strings.Sharing.entryLabel,
                description: Strings.Sharing.entryDesc,
                route: .sharing,
                badge: premium.isPremium ? nil : Strings.Premium.entryLabel
            )
        }
    }

    private var accountCard: some View {
        BloomCard {
            Text(Strings.Profile.accountSection)
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.neutral700)
                .padding(.bottom, Theme.Spacing.md)

            Button {
                path.append(.deleteAccount)
            } label: {
                HStack(spacing: Theme.Spacing.sm) {
                    iconBadge(systemName: "trash.fill", tint: Theme.Palette.error, background: Theme.Palette.error.opacity(0.12))
                    Text(Strings.DeleteAccount.title)
                        .font(.bodyText)
                        .foregroundStyle(Theme.Palette.error)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.Palette.neutral300)
                }
                .padding(.vertical, Theme.Spacing.sm)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        }
    }

    private var aboutCard: some View {
        BloomCard {
            Text(Strings.Profile.aboutSection)
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.neutral700)
                .padding(.bottom, Theme.Spacing.sm)

            aboutRow(label: Strings.Profile.version, value: Strings.Profile.versionNumber)
            Divider().overlay(Theme.Palette.neutral100)

            Button {
                path.append(.privacyPolicy)
            } label: {
                HStack {
                    Text(Strings.PrivacyPolicy.link)
                        .font(.bodyText)
                        .foregroundStyle(Theme.Palette.neutral600)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.Palette.neutral300)
                }
                .padding(.vertical, Theme.Spacing.sm)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            Divider().overlay(Theme.Palette.neutral100)

            aboutRow(label: Strings.Profile.madeWith, value: Strings.Profile.madeWithValue)
            Divider().overlay(Theme.Palette.neutral100)

            Text(Strings.Profile.disclaimer)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral400)
                .lineSpacing(2)
                .padding(.top, Theme.Spacing.sm)
        }
    }

    private var logoutButton: some View {
        BloomButton(
            title: loggingOut ? Strings.Profile.loggingOut : Strings.Profile.logout,
            variant: .outline,
            size: .lg,
            loading: loggingOut,
            icon: loggingOut ? nil : Image(systemName: "rectangle.portrait.and.arrow.right")
        ) {
            showLogoutConfirm = true
        }
        .padding(.top, Theme.Spacing.sm)
        .padding(.bottom, Theme.Spacing.xl)
        .sensoryFeedback(.impact(weight: .light), trigger: showLogoutConfirm)
    }

    // MARK: - Sub-vistas

    private func navRow(
        icon: String,
        tint: Color,
        label: String,
        description: String,
        route: ProfileRoute,
        badge: String? = nil
    ) -> some View {
        Button {
            path.append(route)
        } label: {
            HStack(spacing: Theme.Spacing.sm) {
                iconBadge(systemName: icon, tint: tint, background: tint.opacity(0.12))
                VStack(alignment: .leading, spacing: 1) {
                    Text(label)
                        .font(.bodyText)
                        .foregroundStyle(Theme.Palette.neutral700)
                    Text(description)
                        .font(.smallText)
                        .foregroundStyle(Theme.Palette.neutral400)
                }
                Spacer()
                if let badge {
                    Text(badge)
                        .font(.tag)
                        .foregroundStyle(.white)
                        .padding(.horizontal, Theme.Spacing.sm)
                        .padding(.vertical, 2)
                        .background(Theme.Palette.accent500)
                        .clipShape(Capsule())
                }
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.Palette.neutral300)
            }
            .padding(.vertical, Theme.Spacing.sm + 2)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func iconBadge(systemName: String, tint: Color, background: Color) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 10)
                .fill(background)
                .frame(width: 34, height: 34)
            Image(systemName: systemName)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(tint)
        }
    }

    private func aboutRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral600)
            Spacer()
            Text(value)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral400)
        }
        .padding(.vertical, Theme.Spacing.sm)
    }

    // MARK: - Datos

    private var displayName: String {
        auth.currentDisplayName ?? Auth.auth().currentUser?.displayName ?? "Usuario"
    }

    private var email: String {
        Auth.auth().currentUser?.email ?? ""
    }

    private var initial: String {
        displayName.first.map { String($0).uppercased() } ?? "U"
    }

    private func loadStats() async {
        guard let userID = auth.currentUserID else {
            isLoading = false
            return
        }
        do {
            let checkins = try await firestore.allCheckins(userID: userID)
            totalCheckins = checkins.count
            let dates = checkins.map(\.date)
            uniqueDays = Set(dates).count
            streak = Streak.current(from: dates)
        } catch {
            // Best-effort: si falla, los stats quedan a cero
        }
        isLoading = false
    }

    private func performLogout() {
        loggingOut = true
        do {
            try auth.signOut()
            // El listener de sesión llevará a RootView → AuthView.
        } catch {
            loggingOut = false
        }
    }
}

/// Tarjeta cuadrada con cifra grande y etiqueta. Usado para los stats del
/// perfil (check-ins totales, días únicos, racha).
private struct StatCard: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.custom("DMSans-Bold", size: 20))
                .foregroundStyle(Theme.Palette.neutral800)
            Text(label)
                .font(.caption)
                .foregroundStyle(Theme.Palette.neutral400)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Theme.Spacing.md)
        .background(Theme.Palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.lg)
                .strokeBorder(Theme.Palette.neutral100, lineWidth: 1)
        )
        .bloomShadow(.sm)
    }
}

#Preview {
    ProfileView()
        .environment(AuthService())
        .environment(FirestoreService())
}
