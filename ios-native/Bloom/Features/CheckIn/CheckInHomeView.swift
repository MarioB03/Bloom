import SwiftUI

/// Rutas de navegación del módulo de check-in.
enum CheckInRoute: Hashable {
    case detail(id: String)
    case garden
}

/// Pantalla principal: saludo, racha y check-ins del día de hoy.
/// Equivalente a `app/(tabs)/index.tsx`.
///
/// La versión RN incluye además promo premium, toasts de logros y el diario
/// flotante; esas piezas llegarán con sus respectivas features. Aquí se portan
/// el check-in diario y el CTA del diario de gratitud.
struct CheckInHomeView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore

    @State private var checkins: [CheckinEntry] = []
    @State private var streak = 0
    @State private var gratitudeDoneToday = false
    @State private var isLoading = true
    @State private var showingForm = false
    @State private var showingGratitude = false
    @State private var showingDiary = false
    /// Marco del mini-libro en coordenadas globales — origen de la animación
    /// de apertura del diario.
    @State private var miniBookFrame: CGRect = .zero

    var body: some View {
        NavigationStack {
            ScreenWrapper {
                header
                streakCard
                newCheckinCard
                gratitudeCard
                recordsSection
            }
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: CheckInRoute.self) { route in
                switch route {
                case .detail(let id):
                    CheckInDetailView(id: id, onChanged: {
                        Task { await load() }
                    })
                case .garden:
                    GardenView()
                }
            }
        }
        .overlay(alignment: .bottomTrailing) {
            Button {
                presentDiary()
            } label: {
                MiniDiaryBook()
                    .background {
                        GeometryReader { proxy in
                            Color.clear
                                .onAppear { miniBookFrame = proxy.frame(in: .global) }
                                .onChange(of: proxy.frame(in: .global)) { _, newValue in
                                    miniBookFrame = newValue
                                }
                        }
                    }
            }
            .buttonStyle(.plain)
            .opacity(showingDiary ? 0 : 1)
            .padding(.trailing, Theme.Spacing.md + 4)
            .padding(.bottom, Theme.Spacing.md)
            .sensoryFeedback(.impact(weight: .medium), trigger: showingDiary)
        }
        .sheet(isPresented: $showingForm) {
            CheckInFormView {
                Task { await load() }
            }
        }
        .sheet(isPresented: $showingGratitude) {
            GratitudeView {
                Task { await load() }
            }
        }
        .fullScreenCover(isPresented: $showingDiary) {
            DiaryBookView(isPresented: $showingDiary, originFrame: miniBookFrame)
        }
        .task { await load() }
    }

    /// Presenta el diario sin la animación por defecto del `fullScreenCover`:
    /// la animación de "libro que se abre" la conduce `DiaryBookView`.
    private func presentDiary() {
        var transaction = Transaction()
        transaction.disablesAnimations = true
        withTransaction(transaction) { showingDiary = true }
    }

    // MARK: - Cabecera

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(BloomDate.greeting())
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral400)
            Text(auth.currentDisplayName ?? "")
                .font(.displaySmall)
                .foregroundStyle(Theme.Palette.neutral800)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Racha

    /// La tarjeta de racha es la puerta al jardín: tocarla lo abre, igual que
    /// en la app RN (el jardín se abre desde el home, no es una pestaña).
    private var streakCard: some View {
        NavigationLink(value: CheckInRoute.garden) {
            HStack(spacing: Theme.Spacing.sm) {
                Text(Streak.emoji(streak))
                    .font(.system(size: 28))
                VStack(alignment: .leading, spacing: 1) {
                    Text(Streak.countLabel(streak))
                        .font(.bodyBold)
                        .foregroundStyle(Theme.Palette.neutral700)
                    Text(Streak.message(streak))
                        .font(.caption)
                        .foregroundStyle(Theme.Palette.neutral500)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.Palette.accent400)
            }
            .padding(.vertical, Theme.Spacing.sm + 4)
            .padding(.horizontal, Theme.Spacing.md)
            .background(Theme.Palette.accent50)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.lg)
                    .strokeBorder(Theme.Palette.accent100, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - CTA de nuevo check-in

    private var newCheckinCard: some View {
        Button {
            showingForm = true
        } label: {
            HStack(spacing: Theme.Spacing.md) {
                Text("🌿")
                    .font(.system(size: 22))
                    .frame(width: 44, height: 44)
                    .background(Color.white.opacity(0.2))
                    .clipShape(Circle())
                VStack(alignment: .leading, spacing: 2) {
                    Text(Strings.CheckIn.newCheckin)
                        .font(.bodyBold)
                        .foregroundStyle(.white)
                    Text(Strings.CheckIn.newCheckinSubtitle)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.85))
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.85))
            }
            .padding(Theme.Spacing.md)
            .background(Theme.Palette.secondary400)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
            .bloomShadow(.md)
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.impact(weight: .medium), trigger: showingForm)
    }

    // MARK: - CTA del diario de gratitud

    private var gratitudeCard: some View {
        Button {
            showingGratitude = true
        } label: {
            HStack(spacing: Theme.Spacing.md) {
                Text("🙏")
                    .font(.system(size: 22))
                    .frame(width: 44, height: 44)
                    .background(Color.white.opacity(0.2))
                    .clipShape(Circle())
                VStack(alignment: .leading, spacing: 2) {
                    Text(gratitudeDoneToday ? Strings.Gratitude.ctaDone : Strings.Gratitude.ctaTitle)
                        .font(.bodyBold)
                        .foregroundStyle(.white)
                    Text(gratitudeDoneToday ? Strings.Gratitude.ctaDoneSubtitle : Strings.Gratitude.ctaSubtitle)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.85))
                }
                Spacer()
                Image(systemName: gratitudeDoneToday ? "checkmark.circle.fill" : "chevron.right")
                    .font(.system(size: gratitudeDoneToday ? 18 : 14, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.85))
            }
            .padding(Theme.Spacing.md)
            .background(Theme.Palette.accent400)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
            .bloomShadow(.md)
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.impact(weight: .medium), trigger: showingGratitude)
    }

    // MARK: - Registros de hoy

    @ViewBuilder
    private var recordsSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text(Strings.CheckIn.todayRecords)
                .font(.heading3)
                .foregroundStyle(Theme.Palette.neutral700)

            if isLoading {
                ProgressView()
                    .tint(Theme.Palette.primary400)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Theme.Spacing.xl)
            } else if checkins.isEmpty {
                EmptyState(emoji: "📝", message: Strings.CheckIn.noRecordsToday)
            } else {
                ForEach(checkins) { checkin in
                    NavigationLink(value: CheckInRoute.detail(id: checkin.id ?? "")) {
                        CheckinCard(checkin: checkin)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.top, Theme.Spacing.sm)
    }

    // MARK: - Datos

    private func load() async {
        guard let userID = auth.currentUserID else {
            isLoading = false
            return
        }
        do {
            let today = BloomDate.dateKey(Date())
            checkins = try await firestore.checkins(byDate: today, userID: userID)
            let dates = try await firestore.checkinDates(lastDays: 30, userID: userID)
            streak = Streak.current(from: dates)
            gratitudeDoneToday = try await firestore.gratitude(byDate: today, userID: userID) != nil
        } catch {
            // Se conserva el último estado conocido ante un fallo de red.
        }
        isLoading = false
    }
}
