import SwiftUI

/// Sección activa de la pestaña Compartido.
enum SharedSection: CaseIterable {
    case today, calendar, summary

    var label: String {
        switch self {
        case .today: Strings.Sharing.todaySection
        case .calendar: Strings.Sharing.calendarSection
        case .summary: Strings.Sharing.summarySection
        }
    }
}

/// Destinos de navegación dentro de la pestaña Compartido.
enum SharedRoute: Hashable {
    case day(date: String)
    case checkin(id: String)
    case register(id: String)
}

/// Pestaña "Compartido": vista en solo lectura del jardín de la cuenta a la
/// que tengo acceso. Portado de `app/compartido-view.tsx`.
///
/// Sólo aparece en `MainTabView` cuando `SharingService.sharedAccount` no es
/// nil. Tiene tres sub-secciones: el día de hoy (check-ins + registros
/// emocionales marcados como visibles), el calendario mensual y un resumen
/// con totales y emociones frecuentes.
struct SharedTabView: View {

    @Environment(SharingService.self) private var sharing
    @Environment(FirestoreService.self) private var firestore

    @State private var path = NavigationPath()
    @State private var section: SharedSection = .today

    // Hoy
    @State private var todayCheckins: [CheckinEntry] = []
    @State private var todayRegisters: [EmotionalRegisterEntry] = []
    @State private var loadingToday = true

    // Calendario
    @State private var displayedMonth = BloomDate.startOfMonth(Date())
    @State private var calendarData: [String: DayData] = [:]

    // Resumen
    @State private var allCheckins: [CheckinEntry] = []
    @State private var loadingSummary = true

    var body: some View {
        NavigationStack(path: $path) {
            content
                .toolbar(.hidden, for: .navigationBar)
                .navigationDestination(for: SharedRoute.self) { route in
                    switch route {
                    case .day(let date):
                        if let ownerID = sharing.sharedAccount?.ownerId {
                            DayDetailView(date: date, ownerID: ownerID)
                        }
                    case .checkin(let id):
                        if let ownerID = sharing.sharedAccount?.ownerId {
                            CheckInDetailView(id: id, ownerID: ownerID) {}
                        }
                    case .register(let id):
                        if let ownerID = sharing.sharedAccount?.ownerId {
                            EmotionalRegisterDetailView(id: id, ownerID: ownerID) {}
                        }
                    }
                }
        }
        .task(id: sharing.sharedAccount?.ownerId) { await loadForCurrentSection() }
        .task(id: BloomDate.dateKey(displayedMonth)) {
            if section == .calendar { await loadCalendar() }
        }
    }

    @ViewBuilder
    private var content: some View {
        if let shared = sharing.sharedAccount {
            ScreenWrapper {
                ownerHeader(shared)
                segmentPicker
                sectionContent(shared)
            }
        } else {
            ScreenWrapper {
                EmptyState(
                    emoji: "🔗",
                    message: "\(Strings.Sharing.noLink)\n\(Strings.Sharing.noLinkHint)"
                )
                .padding(.top, Theme.Spacing.xl)
            }
        }
    }

    // MARK: - Cabecera

    private func ownerHeader(_ link: SharingLink) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(Strings.Sharing.viewingGarden)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral400)
                Text(link.ownerDisplayName)
                    .font(.displaySmall)
                    .foregroundStyle(Theme.Palette.neutral800)
            }
            Spacer()
            Badge(label: Strings.Sharing.readOnly, color: Theme.Palette.info)
        }
    }

    private var segmentPicker: some View {
        HStack(spacing: 3) {
            ForEach(SharedSection.allCases, id: \.self) { option in
                let isActive = section == option
                Button {
                    section = option
                    Task { await loadForCurrentSection() }
                } label: {
                    Text(option.label)
                        .font(.smallText)
                        .fontWeight(isActive ? .bold : .medium)
                        .foregroundStyle(isActive ? Theme.Palette.neutral700 : Theme.Palette.neutral400)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Theme.Spacing.sm)
                        .background(
                            RoundedRectangle(cornerRadius: Theme.Radius.md)
                                .fill(isActive ? Theme.Palette.surface : .clear)
                        )
                }
                .buttonStyle(.plain)
                .sensoryFeedback(.selection, trigger: section)
            }
        }
        .padding(3)
        .background(Theme.Palette.neutral100)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
    }

    // MARK: - Secciones

    @ViewBuilder
    private func sectionContent(_ link: SharingLink) -> some View {
        switch section {
        case .today: todayContent
        case .calendar: calendarContent
        case .summary: summaryContent
        }
    }

    @ViewBuilder
    private var todayContent: some View {
        if loadingToday {
            ProgressView()
                .tint(Theme.Palette.primary400)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Theme.Spacing.xxl)
        } else if todayCheckins.isEmpty && todayRegisters.isEmpty {
            EmptyState(emoji: "🌤️", message: Strings.Sharing.emptyToday)
        } else {
            if !todayCheckins.isEmpty {
                Text(Strings.CheckIn.sectionDaily)
                    .font(.heading3)
                    .foregroundStyle(Theme.Palette.neutral700)
                ForEach(todayCheckins) { checkin in
                    NavigationLink(value: SharedRoute.checkin(id: checkin.id ?? "")) {
                        CheckinCard(checkin: checkin)
                    }
                    .buttonStyle(.plain)
                }
            }
            if !todayRegisters.isEmpty {
                Text(Strings.EmotionalRegister.sectionEmotional)
                    .font(.heading3)
                    .foregroundStyle(Theme.Palette.neutral700)
                    .padding(.top, todayCheckins.isEmpty ? 0 : Theme.Spacing.sm)
                ForEach(todayRegisters) { register in
                    NavigationLink(value: SharedRoute.register(id: register.id ?? "")) {
                        EmotionalRegisterCard(register: register)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var calendarContent: some View {
        VStack(spacing: Theme.Spacing.md) {
            MonthNavigator(
                month: displayedMonth,
                onPrev: { changeMonth(by: -1) },
                onNext: { changeMonth(by: 1) }
            )
            MonthGrid(
                month: displayedMonth,
                data: calendarData,
                today: BloomDate.dateKey(Date()),
                onDayPress: { path.append(SharedRoute.day(date: $0)) }
            )
        }
    }

    @ViewBuilder
    private var summaryContent: some View {
        if loadingSummary {
            ProgressView()
                .tint(Theme.Palette.primary400)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Theme.Spacing.xxl)
        } else {
            BloomCard {
                HStack {
                    summaryStat(value: "\(allCheckins.count)", label: Strings.Sharing.totalCheckins)
                    Rectangle()
                        .fill(Theme.Palette.neutral200)
                        .frame(width: 1, height: 40)
                    summaryStat(value: "\(uniqueDayCount)", label: Strings.Sharing.uniqueDays)
                }
            }

            if let top = topEmotion {
                BloomCard {
                    Text(Strings.Sharing.topEmotion)
                        .font(.bodyBold)
                        .foregroundStyle(Theme.Palette.neutral700)
                        .padding(.bottom, Theme.Spacing.md)
                    HStack(spacing: Theme.Spacing.sm) {
                        Text(top.emoji).font(.system(size: 36))
                        Text(top.label)
                            .font(.displaySmall)
                            .foregroundStyle(top.color)
                    }
                }
            }

            if !allCheckins.isEmpty {
                BloomCard {
                    Text(Strings.Sharing.frequentEmotions)
                        .font(.bodyBold)
                        .foregroundStyle(Theme.Palette.neutral700)
                        .padding(.bottom, Theme.Spacing.md)
                    VStack(spacing: Theme.Spacing.sm) {
                        ForEach(topFiveEmotions, id: \.config.id) { entry in
                            emotionBar(config: entry.config, count: entry.count, total: allCheckins.count)
                        }
                    }
                }
            }
        }
    }

    private func summaryStat(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.custom("DMSans-Bold", size: 28))
                .foregroundStyle(Theme.Palette.neutral800)
            Text(label)
                .font(.caption)
                .foregroundStyle(Theme.Palette.neutral400)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Theme.Spacing.sm)
    }

    private func emotionBar(config: EmotionConfig, count: Int, total: Int) -> some View {
        let pct = Double(count) / Double(total)
        return HStack(spacing: Theme.Spacing.sm) {
            BloomIconView(config.icon, size: 22)
                .frame(width: 24, alignment: .center)
            Text(config.label)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral600)
                .frame(width: 80, alignment: .leading)
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Theme.Palette.neutral100)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(config.color)
                        .frame(width: proxy.size.width * pct)
                }
            }
            .frame(height: 8)
            Text("\(Int((pct * 100).rounded()))%")
                .font(.caption)
                .foregroundStyle(Theme.Palette.neutral400)
                .frame(width: 36, alignment: .trailing)
        }
    }

    // MARK: - Datos

    private func loadForCurrentSection() async {
        switch section {
        case .today: await loadToday()
        case .calendar: await loadCalendar()
        case .summary: await loadSummary()
        }
    }

    private func loadToday() async {
        guard let ownerID = sharing.sharedAccount?.ownerId else {
            loadingToday = false
            return
        }
        loadingToday = true
        let today = BloomDate.dateKey(Date())
        do {
            let checkins = try await firestore.checkins(byDate: today, userID: ownerID)
            let registers = try await firestore.emotionalRegisters(
                byDate: today,
                userID: ownerID,
                sharedOnly: true
            )
            todayCheckins = checkins
            todayRegisters = registers
        } catch {
            todayCheckins = []
            todayRegisters = []
        }
        loadingToday = false
    }

    private func loadCalendar() async {
        guard let ownerID = sharing.sharedAccount?.ownerId else { return }
        let calendar = Calendar.current
        guard
            let range = calendar.range(of: .day, in: .month, for: displayedMonth),
            let lastDay = calendar.date(byAdding: .day, value: range.count - 1, to: displayedMonth)
        else { return }

        let startKey = BloomDate.dateKey(displayedMonth)
        let endKey = BloomDate.dateKey(lastDay)

        do {
            let checkins = try await firestore.checkins(byDateRange: startKey, to: endKey, userID: ownerID)
            var grouped: [String: [CheckinEntry]] = [:]
            for checkin in checkins {
                grouped[checkin.date, default: []].append(checkin)
            }
            var result: [String: DayData] = [:]
            for (date, entries) in grouped {
                var counts: [EmotionID: Int] = [:]
                for entry in entries { counts[entry.emotion, default: 0] += 1 }
                let dominant = counts.max { $0.value < $1.value }?.key
                result[date] = DayData(emotion: dominant, count: entries.count)
            }
            calendarData = result
        } catch {
            // Se mantiene el último estado conocido.
        }
    }

    private func loadSummary() async {
        guard let ownerID = sharing.sharedAccount?.ownerId else {
            loadingSummary = false
            return
        }
        loadingSummary = true
        do {
            allCheckins = try await firestore.allCheckins(userID: ownerID)
        } catch {
            allCheckins = []
        }
        loadingSummary = false
    }

    private func changeMonth(by value: Int) {
        guard let new = Calendar.current.date(byAdding: .month, value: value, to: displayedMonth) else {
            return
        }
        displayedMonth = BloomDate.startOfMonth(new)
    }

    // MARK: - Cálculos del resumen

    private var uniqueDayCount: Int {
        Set(allCheckins.map(\.date)).count
    }

    private var emotionCounts: [EmotionID: Int] {
        var counts: [EmotionID: Int] = [:]
        for entry in allCheckins { counts[entry.emotion, default: 0] += 1 }
        return counts
    }

    private var topEmotion: EmotionConfig? {
        emotionCounts.max { $0.value < $1.value }?.key.config
    }

    private var topFiveEmotions: [(config: EmotionConfig, count: Int)] {
        emotionCounts
            .sorted { $0.value > $1.value }
            .prefix(5)
            .map { ($0.key.config, $0.value) }
    }
}
