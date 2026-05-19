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
    @Environment(GenderService.self) private var gender
    @Environment(NotificationsService.self) private var notifications

    @State private var totalCheckins = 0
    @State private var uniqueDays = 0
    @State private var streak = 0
    @State private var isLoading = true
    @State private var loggingOut = false
    @State private var showLogoutConfirm = false
    @State private var showPermissionAlert = false
    @State private var editingReminderTime = false
    @State private var showExportPremiumAlert = false
    @State private var showPaywall = false
    @State private var exporting = false
    @State private var exportError: String?
    @State private var exportShareItem: ExportShareItem?
    @State private var path: [ProfileRoute] = []

    var body: some View {
        NavigationStack(path: $path) {
            Group {
                if isLoading {
                    ScrollView {
                        SkeletonProfile()
                    }
                    .scrollIndicators(.hidden)
                    .background(Theme.Palette.background)
                } else {
                    ScreenWrapper {
                        profileHeader
                        statsRow
                        navCard
                        settingsCard
                        accountCard
                        aboutCard
                        #if DEBUG
                        devCard
                        #endif
                        logoutButton
                    }
                }
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
            gender.resolve(Strings.Profile.logoutConfirmMessage),
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

    private var settingsCard: some View {
        BloomCard {
            Text(Strings.Profile.settingsSection)
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.neutral700)
                .padding(.bottom, Theme.Spacing.md)

            reminderRow
            Divider().overlay(Theme.Palette.neutral100)
            exportRow
        }
        .sheet(isPresented: $editingReminderTime) {
            ReminderTimeSheet(
                hour: notifications.settings.hour,
                minute: notifications.settings.minute
            ) { hour, minute in
                Task {
                    var updated = notifications.settings
                    updated.hour = hour
                    updated.minute = minute
                    await notifications.update(updated)
                }
            }
            .presentationDetents([.medium])
            .presentationDragIndicator(.visible)
        }
        .alert(Strings.Profile.reminderPermissionTitle, isPresented: $showPermissionAlert) {
            Button(Strings.Common.close, role: .cancel) {}
        } message: {
            Text(Strings.Profile.reminderPermissionMessage)
        }
        .alert(Strings.Profile.exportPremiumTitle, isPresented: $showExportPremiumAlert) {
            Button(Strings.Profile.exportPremiumGoToPremium) { showPaywall = true }
            Button(Strings.Common.close, role: .cancel) {}
        } message: {
            Text(Strings.Profile.exportPremiumMessage)
        }
        .errorAlert($exportError)
        .sheet(isPresented: $showPaywall) {
            NavigationStack { PremiumView() }
        }
        .sheet(item: $exportShareItem) { item in
            ExportShareSheet(url: item.url)
        }
    }

    /// Fila "Exportar datos" del bloque de Ajustes. Si el usuario no es
    /// Premium, abre la alerta con CTA al paywall; si lo es, lanza la
    /// generación del PDF y abre la hoja de compartir del sistema.
    private var exportRow: some View {
        Button {
            if !premium.isPremium {
                showExportPremiumAlert = true
            } else {
                Task { await exportPDF() }
            }
        } label: {
            HStack(spacing: Theme.Spacing.sm) {
                iconBadge(
                    systemName: "square.and.arrow.up.fill",
                    tint: Theme.Palette.secondary500,
                    background: Theme.Palette.secondary500.opacity(0.12)
                )
                VStack(alignment: .leading, spacing: 1) {
                    Text(Strings.Profile.exportTitle)
                        .font(.bodyText)
                        .foregroundStyle(Theme.Palette.neutral700)
                    Text(exporting ? Strings.Profile.exporting : Strings.Profile.exportDesc)
                        .font(.smallText)
                        .foregroundStyle(Theme.Palette.neutral400)
                }
                Spacer()
                if exporting {
                    ProgressView().tint(Theme.Palette.neutral300)
                } else if !premium.isPremium {
                    Text(Strings.Premium.entryLabel)
                        .font(.tag)
                        .foregroundStyle(.white)
                        .padding(.horizontal, Theme.Spacing.sm)
                        .padding(.vertical, 2)
                        .background(Theme.Palette.accent500)
                        .clipShape(Capsule())
                } else {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.Palette.neutral300)
                }
            }
            .padding(.vertical, Theme.Spacing.sm)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(exporting)
    }

    /// Carga todos los check-ins y genera el PDF en segundo plano. Si hay
    /// resultado, lo presenta a través del share sheet del sistema.
    private func exportPDF() async {
        guard let userID = auth.currentUserID else { return }
        exporting = true
        defer { exporting = false }
        do {
            let checkins = try await firestore.allCheckins(userID: userID)
            guard !checkins.isEmpty else {
                exportError = Strings.Profile.exportEmpty
                return
            }
            let url = try ExportService.exportCheckinsPdf(checkins, userName: displayName)
            exportShareItem = ExportShareItem(url: url)
        } catch {
            exportError = Strings.Profile.exportError
        }
    }

    /// Fila del recordatorio diario: icono, título, subtítulo con la hora si
    /// está activo, y switch. Al activarse pide permiso; si se deniega el
    /// switch se revierte y aparece una alerta con instrucciones.
    private var reminderRow: some View {
        let binding = Binding<Bool>(
            get: { notifications.settings.enabled },
            set: { newValue in
                Task {
                    var updated = notifications.settings
                    updated.enabled = newValue
                    let granted = await notifications.update(updated)
                    if newValue && !granted {
                        showPermissionAlert = true
                    }
                }
            }
        )

        return Button {
            // Tocar la fila edita la hora (solo si el recordatorio está activo).
            if notifications.settings.enabled {
                editingReminderTime = true
            }
        } label: {
            HStack(spacing: Theme.Spacing.sm) {
                iconBadge(
                    systemName: "bell.fill",
                    tint: Theme.Palette.primary400,
                    background: Theme.Palette.primary400.opacity(0.12)
                )
                VStack(alignment: .leading, spacing: 1) {
                    Text(Strings.Profile.reminderTitle)
                        .font(.bodyText)
                        .foregroundStyle(Theme.Palette.neutral700)
                    Text(reminderSubtitle)
                        .font(.smallText)
                        .foregroundStyle(Theme.Palette.neutral400)
                }
                Spacer()
                Toggle("", isOn: binding)
                    .labelsHidden()
                    .tint(Theme.Palette.primary400)
            }
            .padding(.vertical, Theme.Spacing.sm)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private var reminderSubtitle: String {
        notifications.settings.enabled
            ? Strings.Profile.reminderTime(
                hour: notifications.settings.hour,
                minute: notifications.settings.minute
            )
            : Strings.Profile.reminderDisabled
    }

    private var accountCard: some View {
        BloomCard {
            Text(Strings.Profile.accountSection)
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.neutral700)
                .padding(.bottom, Theme.Spacing.md)

            Menu {
                Button(Strings.Auth.genderFeminine) { setGender(.femenino) }
                Button(Strings.Auth.genderMasculine) { setGender(.masculino) }
                Button(Strings.Auth.genderNeutral) { setGender(.neutro) }
            } label: {
                HStack(spacing: Theme.Spacing.sm) {
                    iconBadge(systemName: "person.text.rectangle", tint: Theme.Palette.primary400, background: Theme.Palette.primary400.opacity(0.12))
                    VStack(alignment: .leading, spacing: 1) {
                        Text(Strings.Profile.genderSection)
                            .font(.bodyText)
                            .foregroundStyle(Theme.Palette.neutral700)
                        Text(currentGenderLabel)
                            .font(.smallText)
                            .foregroundStyle(Theme.Palette.neutral400)
                    }
                    Spacer()
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Theme.Palette.neutral300)
                }
                .padding(.vertical, Theme.Spacing.sm)
                .contentShape(Rectangle())
            }
            .menuStyle(.borderlessButton)
            .menuOrder(.fixed)

            Divider().overlay(Theme.Palette.neutral100)

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

    private var currentGenderLabel: String {
        switch gender.form {
        case .femenino: Strings.Auth.genderFeminine
        case .masculino: Strings.Auth.genderMasculine
        case .neutro: Strings.Auth.genderNeutral
        }
    }

    private func setGender(_ form: GenderForm) {
        Task { await gender.update(form: form, userID: auth.currentUserID, firestore: firestore) }
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

            Text(Strings.Profile.disclaimer)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral400)
                .lineSpacing(2)
                .padding(.top, Theme.Spacing.sm)
        }
    }

    #if DEBUG
    /// Sección de desarrollo — toggle local del Premium para probar el gating
    /// sin pasar por App Store ni Firestore Console. Escribe el mismo formato
    /// que `setAdminPremium` de la app RN (gift code "ADMIN", 365 días). Solo
    /// se compila en builds de debug.
    private var devCard: some View {
        let binding = Binding<Bool>(
            get: { premium.isPremium },
            set: { newValue in
                guard let userID = auth.currentUserID else { return }
                Task {
                    try? await firestore.setAdminPremium(userID: userID, active: newValue)
                    await premium.refresh(userID: userID, firestore: firestore)
                }
            }
        )

        return BloomCard {
            Text("Desarrollo")
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.neutral700)
                .padding(.bottom, Theme.Spacing.md)

            HStack(spacing: Theme.Spacing.sm) {
                iconBadge(
                    systemName: "hammer.fill",
                    tint: Theme.Palette.accent500,
                    background: Theme.Palette.accent500.opacity(0.12)
                )
                VStack(alignment: .leading, spacing: 1) {
                    Text("Premium (dev)")
                        .font(.bodyText)
                        .foregroundStyle(Theme.Palette.neutral700)
                    Text(premium.isPremium ? "Activo · gift code ADMIN" : "Inactivo")
                        .font(.smallText)
                        .foregroundStyle(Theme.Palette.neutral400)
                }
                Spacer()
                Toggle("", isOn: binding)
                    .labelsHidden()
                    .tint(Theme.Palette.accent500)
            }
            .padding(.vertical, Theme.Spacing.sm)
        }
    }
    #endif

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

/// Hoja para elegir la hora del recordatorio diario. Sustituye al
/// `setHours/setMinutes` manual del RN por el `DatePicker` (rueda) del sistema.
private struct ReminderTimeSheet: View {
    let hour: Int
    let minute: Int
    let onSave: (Int, Int) -> Void

    @State private var date: Date
    @Environment(\.dismiss) private var dismiss

    init(hour: Int, minute: Int, onSave: @escaping (Int, Int) -> Void) {
        self.hour = hour
        self.minute = minute
        self.onSave = onSave
        var components = DateComponents()
        components.hour = hour
        components.minute = minute
        let calendar = Calendar.current
        let date = calendar.date(from: components) ?? Date()
        _date = State(initialValue: date)
    }

    var body: some View {
        NavigationStack {
            VStack {
                DatePicker(
                    Strings.Profile.reminderTitle,
                    selection: $date,
                    displayedComponents: .hourAndMinute
                )
                .datePickerStyle(.wheel)
                .labelsHidden()
                .padding()
                Spacer()
            }
            .navigationTitle(Strings.Profile.reminderTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(Strings.Common.cancel) { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(Strings.Common.save) {
                        let comps = Calendar.current.dateComponents([.hour, .minute], from: date)
                        onSave(comps.hour ?? 20, comps.minute ?? 0)
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

/// URL del PDF generado, envuelta para usarse como `item` de `.sheet`.
private struct ExportShareItem: Identifiable {
    let id = UUID()
    let url: URL
}

/// Envoltorio de `UIActivityViewController` para compartir el PDF generado.
private struct ExportShareSheet: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: [url], applicationActivities: nil)
    }

    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}

#Preview {
    ProfileView()
        .environment(AuthService())
        .environment(FirestoreService())
        .environment(PremiumService())
        .environment(GenderService())
        .environment(NotificationsService())
}
