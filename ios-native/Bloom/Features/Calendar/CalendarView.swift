import SwiftUI

/// Rutas de navegación del módulo de calendario.
enum CalendarRoute: Hashable {
    case day(date: String)
}

/// Calendario emocional mensual: rejilla con la emoción predominante de cada
/// día, navegación entre meses y leyenda de emociones del mes.
/// Equivalente a `app/(tabs)/calendario.tsx` en la app React Native.
struct CalendarView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore

    @State private var path = NavigationPath()
    @State private var displayedMonth = BloomDate.startOfMonth(Date())
    @State private var data: [String: DayData] = [:]

    var body: some View {
        NavigationStack(path: $path) {
            ScreenWrapper {
                header
                MonthNavigator(
                    month: displayedMonth,
                    onPrev: { changeMonth(by: -1) },
                    onNext: { changeMonth(by: 1) }
                )
                MonthGrid(
                    month: displayedMonth,
                    data: data,
                    today: BloomDate.dateKey(Date()),
                    onDayPress: { path.append(CalendarRoute.day(date: $0)) }
                )
                if !usedEmotions.isEmpty {
                    legend
                }
            }
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: CalendarRoute.self) { route in
                switch route {
                case .day(let date):
                    DayDetailView(date: date)
                }
            }
        }
        .task(id: BloomDate.dateKey(displayedMonth)) { await load() }
    }

    // MARK: - Cabecera

    private var header: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            Text(Strings.Calendar.title)
                .font(.displayMedium)
                .foregroundStyle(Theme.Palette.neutral800)
            Text(Strings.Calendar.subtitle)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Leyenda

    /// Emociones presentes este mes, en el orden canónico de la app.
    private var usedEmotions: [EmotionConfig] {
        let ids = Set(data.values.compactMap(\.emotion))
        return EmotionID.allCases.filter(ids.contains).map(\.config)
    }

    private var legend: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text(Strings.Calendar.legendTitle)
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .tracking(0.8)
                .textCase(.uppercase)
                .foregroundStyle(Theme.Palette.neutral500)

            FlowLayout {
                ForEach(usedEmotions) { emotion in
                    HStack(spacing: 6) {
                        BloomIconView(emotion.icon, size: 18)
                        Text(emotion.label)
                            .font(.smallText)
                            .foregroundStyle(Theme.Palette.neutral600)
                    }
                    .padding(.horizontal, Theme.Spacing.sm + 2)
                    .padding(.vertical, Theme.Spacing.xs + 2)
                    .background(Theme.Palette.neutral50)
                    .clipShape(Capsule())
                    .overlay(Capsule().strokeBorder(Theme.Palette.neutral100, lineWidth: 1))
                }
            }
        }
        .padding(Theme.Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.Palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .bloomShadow(.sm)
    }

    // MARK: - Navegación de meses

    private func changeMonth(by value: Int) {
        guard let new = Calendar.current.date(byAdding: .month, value: value, to: displayedMonth) else {
            return
        }
        displayedMonth = BloomDate.startOfMonth(new)
    }

    // MARK: - Datos

    private func load() async {
        guard let userID = auth.currentUserID else { return }
        let calendar = Calendar.current
        guard
            let range = calendar.range(of: .day, in: .month, for: displayedMonth),
            let lastDay = calendar.date(byAdding: .day, value: range.count - 1, to: displayedMonth)
        else { return }

        let startKey = BloomDate.dateKey(displayedMonth)
        let endKey = BloomDate.dateKey(lastDay)

        do {
            let checkins = try await firestore.checkins(byDateRange: startKey, to: endKey, userID: userID)
            var grouped: [String: [CheckinEntry]] = [:]
            for checkin in checkins {
                grouped[checkin.date, default: []].append(checkin)
            }

            var result: [String: DayData] = [:]
            for (date, entries) in grouped {
                var counts: [EmotionID: Int] = [:]
                for entry in entries {
                    counts[entry.emotion, default: 0] += 1
                }
                let dominant = counts.max { $0.value < $1.value }?.key
                result[date] = DayData(emotion: dominant, count: entries.count)
            }
            data = result
        } catch {
            // Se conserva el último estado conocido ante un fallo de red.
        }
    }
}
