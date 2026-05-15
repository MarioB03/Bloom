import SwiftUI

/// Insights y correlaciones a partir de los check-ins: resumen emocional,
/// actividad semanal, emociones más frecuentes, medias y correlaciones
/// (sueño, hambre, ciclo, día de la semana, tendencia semanal).
/// Equivalente a `app/insights.tsx` en la app React Native.
///
/// Las medias, el consejo y las correlaciones van detrás del muro de
/// Premium —igual que en RN—; los usuarios sin Premium ven el resumen
/// emocional, la actividad semanal y las emociones más frecuentes, y un
/// candado que abre el paywall como hoja modal.
struct InsightsView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore
    @Environment(PremiumService.self) private var premium

    @State private var checkins: [CheckinEntry] = []
    @State private var isLoading = true
    @State private var showPaywall = false

    private static let positiveEmotions: Set<EmotionID> = [.alegria, .calma, .gratitud]
    private static let weekDayLabels = ["L", "M", "X", "J", "V", "S", "D"]

    var body: some View {
        ScreenWrapper {
            header

            if isLoading {
                ProgressView()
                    .tint(Theme.Palette.primary400)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Theme.Spacing.xxl)
            } else if checkins.isEmpty {
                EmptyState(emoji: "📊", message: Strings.Insights.emptyMessage)
            } else {
                statsRow
                weeklyActivityCard
                topEmotionsCard
                if premium.isPremium {
                    averagesRow
                    tipBanner
                    if enoughData {
                        correlationsSection
                    } else {
                        banner(emoji: "📊", text: Strings.Insights.needMoreData)
                    }
                } else {
                    premiumLockCard
                }
            }
        }
        .task { await load() }
        .sheet(isPresented: $showPaywall) {
            NavigationStack { PremiumView() }
        }
    }

    // MARK: - Candado Premium

    /// Bloque promocional que sustituye a medias y correlaciones para los
    /// usuarios sin Premium. Al tocarlo abre el paywall como hoja modal.
    /// Equivalente al `premiumLock` de `app/insights.tsx`.
    private var premiumLockCard: some View {
        Button {
            showPaywall = true
        } label: {
            VStack(spacing: Theme.Spacing.sm) {
                Image(systemName: "lock.fill")
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundStyle(Theme.Palette.accent500)
                Text(Strings.Insights.premiumLockTitle)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)
                Text(Strings.Insights.premiumLockText)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral500)
                    .multilineTextAlignment(.center)
                    .lineSpacing(2)
                Text(Strings.Insights.premiumLockBadge)
                    .font(.tag)
                    .foregroundStyle(.white)
                    .padding(.horizontal, Theme.Spacing.md)
                    .padding(.vertical, 5)
                    .background(Theme.Palette.accent500)
                    .clipShape(Capsule())
                    .padding(.top, Theme.Spacing.xs)
            }
            .frame(maxWidth: .infinity)
            .padding(Theme.Spacing.lg)
            .background(Theme.Palette.accent50)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.xl)
                    .strokeBorder(Theme.Palette.accent100, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.impact(weight: .light), trigger: showPaywall)
    }

    // MARK: - Cabecera

    private var header: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            Text(Strings.Insights.title)
                .font(.displayMedium)
                .foregroundStyle(Theme.Palette.neutral800)
            Text(Strings.Insights.subtitle)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Resumen (3 tarjetas)

    private var statsRow: some View {
        HStack(spacing: Theme.Spacing.sm) {
            statCard(value: "\(totalCheckins)", label: Strings.Insights.checkinsLabel)
            statCard(value: "\(uniqueDays)", label: Strings.Insights.activeDaysLabel)
            statCard(value: "\(Streak.emoji(streak)) \(streak)", label: Strings.Insights.streakLabel)
        }
    }

    private func statCard(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(Theme.Palette.neutral800)
            Text(label)
                .font(.smallText)
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

    // MARK: - Actividad semanal

    private var weeklyActivityCard: some View {
        BloomCard {
            sectionTitle("📅 \(Strings.Insights.weeklyActivity)")
            HStack(alignment: .bottom, spacing: Theme.Spacing.xs) {
                ForEach(weekActivity, id: \.date) { day in
                    VStack(spacing: 4) {
                        ZStack(alignment: .bottom) {
                            Color.clear.frame(height: 84)
                            Capsule()
                                .fill(day.count > 0 ? Theme.Palette.secondary300 : Theme.Palette.neutral200)
                                .frame(
                                    height: day.count > 0
                                        ? max(CGFloat(day.count) / CGFloat(maxWeekCount) * 80, 12)
                                        : 4
                                )
                        }
                        Text(day.label)
                            .font(.system(size: 11, weight: day.isToday ? .bold : .regular, design: .rounded))
                            .foregroundStyle(day.isToday ? Theme.Palette.primary400 : Theme.Palette.neutral400)
                        Text(day.count > 0 ? "\(day.count)" : " ")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundStyle(Theme.Palette.secondary500)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }

    // MARK: - Emociones más frecuentes

    private var topEmotionsCard: some View {
        BloomCard {
            sectionTitle("🌿 \(Strings.Insights.topEmotions)")
            VStack(spacing: Theme.Spacing.sm + 2) {
                ForEach(topEmotions) { stat in
                    let config = stat.id.config
                    HStack(spacing: Theme.Spacing.sm) {
                        HStack(spacing: Theme.Spacing.sm) {
                            BloomIconView(config.icon, size: 24)
                            Text(config.label)
                                .font(.bodyText)
                                .foregroundStyle(Theme.Palette.neutral700)
                                .lineLimit(1)
                                .minimumScaleFactor(0.8)
                        }
                        .frame(width: 124, alignment: .leading)

                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(Theme.Palette.neutral100)
                                Capsule()
                                    .fill(config.color)
                                    .frame(width: geo.size.width * CGFloat(stat.percentage) / 100)
                            }
                        }
                        .frame(height: 8)

                        Text("\(stat.percentage)%")
                            .font(.caption)
                            .foregroundStyle(Theme.Palette.neutral500)
                            .frame(width: 36, alignment: .trailing)
                    }
                }
            }
        }
    }

    // MARK: - Medias

    private var averagesRow: some View {
        HStack(spacing: Theme.Spacing.sm) {
            averageCard(emoji: "⚡", value: avgIntensity, label: Strings.Insights.avgIntensity)
            averageCard(emoji: "😴", value: avgSleep, label: Strings.Insights.avgSleep)
        }
    }

    private func averageCard(emoji: String, value: Double, label: String) -> some View {
        VStack(spacing: Theme.Spacing.xs) {
            Text(emoji).font(.system(size: 28))
            Text(value, format: .number.precision(.fractionLength(1)))
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(Theme.Palette.neutral800)
            Text(label)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral400)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Theme.Spacing.lg)
        .background(Theme.Palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.lg)
                .strokeBorder(Theme.Palette.neutral200, lineWidth: 1)
        )
    }

    // MARK: - Consejo

    private var tipBanner: some View {
        banner(emoji: "💡", text: tipText)
    }

    private var tipText: String {
        guard let top = topEmotions.first else { return Strings.Insights.tipDefault }
        let label = top.id.config.label.lowercased()
        return avgSleep < 3
            ? Strings.Insights.tipLowSleep(label)
            : Strings.Insights.tipFrequentEmotion(label)
    }

    // MARK: - Correlaciones

    @ViewBuilder
    private var correlationsSection: some View {
        Text("🔗 \(Strings.Insights.correlations)")
            .font(.heading3)
            .foregroundStyle(Theme.Palette.neutral700)
            .padding(.top, Theme.Spacing.sm)
            .frame(maxWidth: .infinity, alignment: .leading)

        if let sleepCorr, sleepCorr.badSleepEmotion != nil || sleepCorr.goodSleepEmotion != nil {
            BloomCard {
                sectionTitle("😴 \(Strings.Insights.sleepCorrelation)")
                if let bad = sleepCorr.badSleepEmotion {
                    correlationRow(label: Strings.Insights.whenSleepBad, emotion: bad)
                }
                if let good = sleepCorr.goodSleepEmotion {
                    correlationRow(label: Strings.Insights.whenSleepGood, emotion: good)
                }
            }
        }

        if let hungerCorr, hungerCorr.hungryEmotion != nil || hungerCorr.fedEmotion != nil {
            BloomCard {
                sectionTitle("🍽️ \(Strings.Insights.hungerCorrelation)")
                if let hungry = hungerCorr.hungryEmotion {
                    correlationRow(label: Strings.Insights.whenHungry, emotion: hungry)
                }
                if let fed = hungerCorr.fedEmotion {
                    correlationRow(label: Strings.Insights.whenFed, emotion: fed)
                }
            }
        }

        if !cyclePatterns.isEmpty {
            BloomCard {
                sectionTitle("🌙 \(Strings.Insights.cyclePatterns)")
                ForEach(cyclePatterns) { pattern in
                    if let top = pattern.topEmotion {
                        correlationRow(label: Strings.CheckIn.cycleLabel(pattern.phase), emotion: top)
                    }
                }
            }
        }

        if let bestDay, let hardestDay {
            dayOfWeekCard(bestDay: bestDay, hardestDay: hardestDay)
        }

        if let weeklyTrend, weeklyTrend.moreOf != nil || weeklyTrend.lessOf != nil {
            weeklyTrendCard(weeklyTrend)
        }
    }

    private func dayOfWeekCard(bestDay: DayOfWeekPattern, hardestDay: DayOfWeekPattern) -> some View {
        BloomCard {
            sectionTitle("📆 \(Strings.Insights.dayOfWeek)")
            HStack(spacing: 0) {
                ForEach(dayPatterns) { day in
                    VStack(spacing: 3) {
                        Text(day.label.prefix(3))
                            .font(.system(size: 10, weight: .regular, design: .rounded))
                            .foregroundStyle(Theme.Palette.neutral400)
                        if let top = day.topEmotion {
                            BloomIconView(top.id.config.icon, size: 22)
                        } else {
                            Text("·")
                                .font(.system(size: 18))
                                .foregroundStyle(Theme.Palette.neutral300)
                        }
                        Text("\(day.count)")
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundStyle(Theme.Palette.neutral400)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(.bottom, Theme.Spacing.md)

            HStack(spacing: Theme.Spacing.sm) {
                if let top = bestDay.topEmotion {
                    dayInsightChip(
                        label: Strings.Insights.bestDay,
                        value: bestDay.label,
                        emotion: top.id.config
                    )
                }
                if let top = hardestDay.topEmotion {
                    dayInsightChip(
                        label: Strings.Insights.hardestDay,
                        value: hardestDay.label,
                        emotion: top.id.config
                    )
                }
            }
        }
    }

    private func weeklyTrendCard(_ trend: WeeklyTrend) -> some View {
        BloomCard {
            sectionTitle("📈 \(Strings.Insights.weeklyTrend)")
            if let more = trend.moreOf {
                correlationRow(
                    label: Strings.Insights.moreOf,
                    chip: trendChip(emotion: more, suffix: "↑", background: Theme.Palette.accent50)
                )
            }
            if let less = trend.lessOf {
                correlationRow(
                    label: Strings.Insights.lessOf,
                    chip: trendChip(emotion: less, suffix: "↓", background: Theme.Palette.secondary50)
                )
            }
            Text(Strings.Insights.vsLastWeek)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral400)
                .frame(maxWidth: .infinity)
                .padding(.top, Theme.Spacing.xs)
        }
    }

    // MARK: - Piezas reutilizables

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.bodyBold)
            .foregroundStyle(Theme.Palette.neutral700)
            .padding(.bottom, Theme.Spacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func banner(emoji: String, text: String) -> some View {
        HStack(spacing: Theme.Spacing.md) {
            Text(emoji).font(.system(size: 28))
            Text(text)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral600)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(Theme.Spacing.lg)
        .background(Theme.Palette.accent50)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.xl)
                .strokeBorder(Theme.Palette.accent100, lineWidth: 1)
        )
    }

    private func correlationRow(label: String, emotion: EmotionFrequency) -> some View {
        let config = emotion.id.config
        return correlationRow(
            label: label,
            chip: emotionChip(
                config: config,
                trailing: "(\(emotion.percentage)%)",
                background: Theme.Palette.neutral50
            )
        )
    }

    private func correlationRow(label: String, chip: some View) -> some View {
        HStack {
            Text(label)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
                .frame(maxWidth: .infinity, alignment: .leading)
            chip
        }
        .padding(.bottom, Theme.Spacing.sm)
    }

    private func trendChip(emotion: EmotionFrequency, suffix: String, background: Color) -> some View {
        let config = emotion.id.config
        return emotionChip(config: config, trailing: suffix, background: background)
    }

    private func emotionChip(config: EmotionConfig, trailing: String, background: Color) -> some View {
        HStack(spacing: 6) {
            BloomIconView(config.icon, size: 18)
            Text("\(config.label) \(trailing)")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Theme.Palette.neutral700)
        }
        .padding(.horizontal, Theme.Spacing.sm)
        .padding(.vertical, 5)
        .background(background)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
    }

    private func chip(_ text: String, background: Color) -> some View {
        Text(text)
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(Theme.Palette.neutral700)
            .padding(.horizontal, Theme.Spacing.sm)
            .padding(.vertical, 5)
            .background(background)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
    }

    private func dayInsightChip(label: String, value: String, emotion: EmotionConfig?) -> some View {
        VStack(spacing: 2) {
            Text(label)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral400)
            HStack(spacing: 6) {
                Text(value)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Theme.Palette.neutral700)
                if let emotion {
                    BloomIconView(emotion.icon, size: 18)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(Theme.Spacing.sm)
        .background(Theme.Palette.neutral50)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
    }

    // MARK: - Estadísticas derivadas

    private var totalCheckins: Int { checkins.count }

    private var uniqueDays: Int { Set(checkins.map(\.date)).count }

    private var streak: Int { Streak.current(from: checkins.map(\.date)) }

    /// Las 5 emociones más frecuentes con su porcentaje sobre el total.
    private var topEmotions: [EmotionFrequency] {
        var counts: [EmotionID: Int] = [:]
        for checkin in checkins { counts[checkin.emotion, default: 0] += 1 }
        return counts
            .map { id, count in
                EmotionFrequency(
                    id: id,
                    count: count,
                    percentage: Int((Double(count) / Double(totalCheckins) * 100).rounded())
                )
            }
            .sorted { $0.count > $1.count }
            .prefix(5)
            .map { $0 }
    }

    private var avgIntensity: Double {
        guard totalCheckins > 0 else { return 0 }
        return Double(checkins.reduce(0) { $0 + $1.emotionIntensity }) / Double(totalCheckins)
    }

    private var avgSleep: Double {
        guard totalCheckins > 0 else { return 0 }
        return Double(checkins.reduce(0) { $0 + $1.sleepQuality }) / Double(totalCheckins)
    }

    private var enoughData: Bool { Correlations.hasEnoughData(checkins) }

    private var sleepCorr: SleepCorrelation? {
        enoughData ? Correlations.analyzeSleepCorrelation(checkins) : nil
    }

    private var hungerCorr: HungerCorrelation? {
        enoughData ? Correlations.analyzeHungerCorrelation(checkins) : nil
    }

    private var cyclePatterns: [CyclePattern] {
        enoughData && Correlations.hasCycleData(checkins)
            ? Correlations.analyzeCyclePatterns(checkins)
            : []
    }

    private var dayPatterns: [DayOfWeekPattern] {
        enoughData ? Correlations.analyzeDayOfWeek(checkins) : []
    }

    private var weeklyTrend: WeeklyTrend? {
        enoughData ? Correlations.analyzeWeeklyTrend(checkins) : nil
    }

    /// Día con más check-ins de emoción positiva.
    private var bestDay: DayOfWeekPattern? {
        guard let first = dayPatterns.first else { return nil }
        return dayPatterns.reduce(first) { best, day in
            if day.count > 0,
               let top = day.topEmotion,
               Self.positiveEmotions.contains(top.id),
               day.count > best.count {
                return day
            }
            return best
        }
    }

    /// Día con mayor intensidad emocional media.
    private var hardestDay: DayOfWeekPattern? {
        guard let first = dayPatterns.first else { return nil }
        return dayPatterns.reduce(first) { worst, day in
            (day.count > 0 && day.avgIntensity > worst.avgIntensity) ? day : worst
        }
    }

    /// Actividad de la semana natural en curso, de lunes a domingo.
    private var weekActivity: [(label: String, count: Int, date: String, isToday: Bool)] {
        let calendar = Calendar.current
        let now = Date()
        let todayKey = BloomDate.dateKey(now)
        // Calendar: 1 = domingo … 7 = sábado → días transcurridos desde el lunes.
        let daysFromMonday = (calendar.component(.weekday, from: now) + 5) % 7
        let monday = calendar.date(byAdding: .day, value: -daysFromMonday, to: now) ?? now
        return (0...6).map { offset in
            let date = calendar.date(byAdding: .day, value: offset, to: monday) ?? monday
            let key = BloomDate.dateKey(date)
            let count = checkins.filter { $0.date == key }.count
            return (Self.weekDayLabels[offset], count, key, key == todayKey)
        }
    }

    private var maxWeekCount: Int {
        max(weekActivity.map(\.count).max() ?? 1, 1)
    }

    // MARK: - Datos

    private func load() async {
        guard let userID = auth.currentUserID else {
            isLoading = false
            return
        }
        do {
            checkins = try await firestore.allCheckins(userID: userID)
        } catch {
            // Se conserva el último estado conocido ante un fallo de red.
        }
        isLoading = false
    }
}
