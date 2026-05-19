import Foundation

/// Análisis de correlaciones y patrones a partir de los check-ins.
/// Portado de `src/lib/correlations.ts` de la app React Native.

/// Frecuencia de una emoción dentro de un subconjunto de check-ins.
struct EmotionFrequency: Identifiable, Sendable {
    let id: EmotionID
    let count: Int
    let percentage: Int
}

/// Emoción predominante según la calidad del sueño.
struct SleepCorrelation: Sendable {
    /// Emoción más frecuente con sueño malo (1–2).
    let badSleepEmotion: EmotionFrequency?
    /// Emoción más frecuente con sueño bueno (4–5).
    let goodSleepEmotion: EmotionFrequency?
    let avgIntensityBadSleep: Double
    let avgIntensityGoodSleep: Double
}

/// Emoción predominante en una fase del ciclo menstrual.
struct CyclePattern: Identifiable, Sendable {
    let phase: CyclePhase
    let topEmotion: EmotionFrequency?
    let avgIntensity: Double
    let count: Int

    var id: CyclePhase { phase }
}

/// Emoción predominante en un día de la semana.
struct DayOfWeekPattern: Identifiable, Sendable {
    /// 0 = Lunes … 6 = Domingo.
    let dayIndex: Int
    let label: String
    let topEmotion: EmotionFrequency?
    let avgIntensity: Double
    let count: Int

    var id: Int { dayIndex }
}

/// Comparativa de la última semana frente a la anterior.
struct WeeklyTrend: Sendable {
    let thisWeekTop: EmotionFrequency?
    let lastWeekTop: EmotionFrequency?
    /// Emoción que más subió esta semana.
    let moreOf: EmotionFrequency?
    /// Emoción que más bajó esta semana.
    let lessOf: EmotionFrequency?
    /// Positivo = emociones más intensas esta semana.
    let intensityDelta: Double
}

/// Emoción predominante según el nivel de hambre.
struct HungerCorrelation: Sendable {
    /// Emoción más frecuente con hambre alta (4–5).
    let hungryEmotion: EmotionFrequency?
    /// Emoción más frecuente sin hambre (1–2).
    let fedEmotion: EmotionFrequency?
}

enum Correlations {

    private static let dayLabels = [
        "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo",
    ]

    // MARK: - Helpers

    /// Emoción más frecuente del subconjunto, con su porcentaje.
    private static func topEmotion(_ entries: [CheckinEntry]) -> EmotionFrequency? {
        guard !entries.isEmpty else { return nil }
        var counts: [EmotionID: Int] = [:]
        for entry in entries { counts[entry.emotion, default: 0] += 1 }
        guard let (id, count) = counts.max(by: { $0.value < $1.value }) else { return nil }
        let percentage = Int((Double(count) / Double(entries.count) * 100).rounded())
        return EmotionFrequency(id: id, count: count, percentage: percentage)
    }

    /// Media de un campo entero (intensidad, sueño, hambre).
    private static func avg(_ entries: [CheckinEntry], _ keyPath: KeyPath<CheckinEntry, Int>) -> Double {
        guard !entries.isEmpty else { return 0 }
        let total = entries.reduce(0) { $0 + $1[keyPath: keyPath] }
        return Double(total) / Double(entries.count)
    }

    /// Porcentaje de `count` sobre `total`, redondeado (0 si `total` es 0).
    private static func percentage(_ count: Int, of total: Int) -> Int {
        guard total > 0 else { return 0 }
        return Int((Double(count) / Double(total) * 100).rounded())
    }

    // MARK: - Análisis

    static func analyzeSleepCorrelation(_ checkins: [CheckinEntry]) -> SleepCorrelation {
        let badSleep = checkins.filter { $0.sleepQuality <= 2 }
        let goodSleep = checkins.filter { $0.sleepQuality >= 4 }
        return SleepCorrelation(
            badSleepEmotion: topEmotion(badSleep),
            goodSleepEmotion: topEmotion(goodSleep),
            avgIntensityBadSleep: avg(badSleep, \.emotionIntensity),
            avgIntensityGoodSleep: avg(goodSleep, \.emotionIntensity)
        )
    }

    /// Solo devuelve fases con datos suficientes (≥ 2 check-ins).
    static func analyzeCyclePatterns(_ checkins: [CheckinEntry]) -> [CyclePattern] {
        let phases: [CyclePhase] = [.menstruacion, .folicular, .ovulacion, .lutea]
        return phases.compactMap { phase in
            let entries = checkins.filter { $0.cyclePhase == phase }
            let pattern = CyclePattern(
                phase: phase,
                topEmotion: topEmotion(entries),
                avgIntensity: avg(entries, \.emotionIntensity),
                count: entries.count
            )
            return pattern.count >= 2 ? pattern : nil
        }
    }

    static func analyzeDayOfWeek(_ checkins: [CheckinEntry]) -> [DayOfWeekPattern] {
        var byDay: [[CheckinEntry]] = Array(repeating: [], count: 7)
        for checkin in checkins {
            guard let date = BloomDate.date(fromKey: checkin.date) else { continue }
            // Calendar: 1 = domingo … 7 = sábado → 0 = lunes … 6 = domingo.
            let weekday = Calendar.current.component(.weekday, from: date)
            byDay[(weekday + 5) % 7].append(checkin)
        }
        return byDay.enumerated().map { index, entries in
            DayOfWeekPattern(
                dayIndex: index,
                label: dayLabels[index],
                topEmotion: topEmotion(entries),
                avgIntensity: avg(entries, \.emotionIntensity),
                count: entries.count
            )
        }
    }

    static func analyzeWeeklyTrend(_ checkins: [CheckinEntry], now: Date = Date()) -> WeeklyTrend {
        let calendar = Calendar.current
        let todayStr = BloomDate.dateKey(now)
        let oneWeekStr = BloomDate.dateKey(calendar.date(byAdding: .day, value: -7, to: now) ?? now)
        let twoWeekStr = BloomDate.dateKey(calendar.date(byAdding: .day, value: -14, to: now) ?? now)

        let thisWeek = checkins.filter { $0.date > oneWeekStr && $0.date <= todayStr }
        let lastWeek = checkins.filter { $0.date > twoWeekStr && $0.date <= oneWeekStr }

        var thisWeekCounts: [EmotionID: Int] = [:]
        var lastWeekCounts: [EmotionID: Int] = [:]
        for checkin in thisWeek { thisWeekCounts[checkin.emotion, default: 0] += 1 }
        for checkin in lastWeek { lastWeekCounts[checkin.emotion, default: 0] += 1 }

        var maxIncrease = 0
        var maxDecrease = 0
        var moreOf: EmotionFrequency?
        var lessOf: EmotionFrequency?

        for emotion in Set(thisWeekCounts.keys).union(lastWeekCounts.keys) {
            let thisCount = thisWeekCounts[emotion] ?? 0
            let lastCount = lastWeekCounts[emotion] ?? 0
            let delta = thisCount - lastCount
            if delta > maxIncrease {
                maxIncrease = delta
                moreOf = EmotionFrequency(
                    id: emotion,
                    count: thisCount,
                    percentage: percentage(thisCount, of: thisWeek.count)
                )
            }
            if delta < maxDecrease {
                maxDecrease = delta
                lessOf = EmotionFrequency(
                    id: emotion,
                    count: lastCount,
                    percentage: percentage(lastCount, of: lastWeek.count)
                )
            }
        }

        return WeeklyTrend(
            thisWeekTop: topEmotion(thisWeek),
            lastWeekTop: topEmotion(lastWeek),
            moreOf: maxIncrease > 0 ? moreOf : nil,
            lessOf: maxDecrease < 0 ? lessOf : nil,
            intensityDelta: avg(thisWeek, \.emotionIntensity) - avg(lastWeek, \.emotionIntensity)
        )
    }

    static func analyzeHungerCorrelation(_ checkins: [CheckinEntry]) -> HungerCorrelation {
        let hungry = checkins.filter { $0.hungerLevel >= 4 }
        let fed = checkins.filter { $0.hungerLevel <= 2 }
        return HungerCorrelation(
            hungryEmotion: topEmotion(hungry),
            fedEmotion: topEmotion(fed)
        )
    }

    /// Hacen falta al menos 7 check-ins para mostrar correlaciones.
    static func hasEnoughData(_ checkins: [CheckinEntry]) -> Bool {
        checkins.count >= 7
    }

    /// Hay datos de ciclo si algún check-in tiene una fase distinta de "no aplica".
    static func hasCycleData(_ checkins: [CheckinEntry]) -> Bool {
        checkins.contains { $0.cyclePhase != nil && $0.cyclePhase != .noAplica }
    }
}
