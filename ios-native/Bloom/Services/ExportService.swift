import Foundation
import UIKit

/// Exporta los check-ins del usuario a un PDF visualmente idéntico al de la
/// app React Native (`src/lib/export-pdf.ts`). El PDF incluye portada,
/// resumen, promedios, distribución emocional, registros por día de la
/// semana, calendario mensual y detalle de cada registro.
///
/// Implementación: el HTML del RN se reconstruye 1:1 en Swift y se rasteriza
/// con `UIPrintPageRenderer` + `UIMarkupTextPrintFormatter`. Es la sustitución
/// nativa de `expo-print` + `Print.printToFileAsync`.
enum ExportService {

    enum ExportError: LocalizedError {
        case empty
        case fileWrite

        var errorDescription: String? {
            switch self {
            case .empty: return "No hay check-ins para exportar"
            case .fileWrite: return "No se pudo escribir el archivo PDF"
            }
        }
    }

    /// Genera el PDF y lo guarda en el directorio de caché. Devuelve la URL
    /// del archivo para que el llamador la abra con `UIActivityViewController`.
    @MainActor
    static func exportCheckinsPdf(_ checkins: [CheckinEntry], userName: String) throws -> URL {
        guard !checkins.isEmpty else { throw ExportError.empty }
        let html = buildHtml(checkins: checkins, userName: userName)
        let data = renderPDF(html: html)

        let dateKey = BloomDate.dateKey(Date())
        let filename = "bloom-reporte-\(dateKey).pdf"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        do {
            try data.write(to: url, options: .atomic)
        } catch {
            throw ExportError.fileWrite
        }
        return url
    }

    // MARK: - HTML → PDF

    /// Rasteriza el HTML a un PDF A4 con margen de 40pt usando
    /// `UIPrintPageRenderer`. Equivalente nativo de `Print.printToFileAsync`.
    @MainActor
    private static func renderPDF(html: String) -> Data {
        let formatter = UIMarkupTextPrintFormatter(markupText: html)
        let renderer = UIPrintPageRenderer()
        renderer.addPrintFormatter(formatter, startingAtPageAt: 0)

        // Tamaño A4 en puntos (72 dpi): 595.2 × 841.8.
        let a4 = CGRect(x: 0, y: 0, width: 595.2, height: 841.8)
        let printable = a4.insetBy(dx: 36, dy: 40)
        renderer.setValue(NSValue(cgRect: a4), forKey: "paperRect")
        renderer.setValue(NSValue(cgRect: printable), forKey: "printableRect")

        let data = NSMutableData()
        UIGraphicsBeginPDFContextToData(data, a4, nil)
        renderer.prepare(forDrawingPages: NSRange(location: 0, length: renderer.numberOfPages))
        for index in 0..<renderer.numberOfPages {
            UIGraphicsBeginPDFPage()
            renderer.drawPage(at: index, in: UIGraphicsGetPDFContextBounds())
        }
        UIGraphicsEndPDFContext()
        return data as Data
    }

    // MARK: - Construcción del HTML (portado de `buildHtml` en RN)

    private static func buildHtml(checkins: [CheckinEntry], userName: String) -> String {
        let sorted = checkins.sorted { tsValue($0) > tsValue($1) }
        let totalCheckins = sorted.count
        let uniqueDays = Set(sorted.map(\.date)).count
        let dateRange: String = sorted.isEmpty
            ? ""
            : "\(formatDateShort(sorted.last!.date)) — \(formatDateShort(sorted.first!.date))"
        let emotionStats = buildEmotionStats(sorted)
        let dowStats = buildDayOfWeekStats(sorted)
        let monthGroups = groupByMonth(sorted)
        let monthKeys = monthGroups.keys.sorted(by: >)

        let avgIntensity = avgValue(sorted, keyPath: \.emotionIntensity)
        let avgSleep = avgValue(sorted, keyPath: \.sleepQuality)
        let avgHunger = avgValue(sorted, keyPath: \.hungerLevel)
        let streak = Streak.current(from: sorted.map(\.date))

        let mostFrequent: String = {
            guard let id = emotionStats.first?.id,
                  let emotion = EmotionID(rawValue: id) else { return "—" }
            return emotion.config.emoji
        }()

        let emotionBars = emotionStats.compactMap { stat -> String? in
            guard let id = EmotionID(rawValue: stat.id) else { return nil }
            let config = id.config
            let width = max(stat.percentage, 3)
            return """
            <div class="emotion-bar-row">
              <span class="emotion-bar-emoji">\(config.emoji)</span>
              <span class="emotion-bar-label">\(config.label)</span>
              <div class="emotion-bar-track">
                <div class="emotion-bar-fill" style="width:\(width)%;background:\(emotionColorHex(id));"></div>
              </div>
              <span class="emotion-bar-pct">\(stat.percentage)%</span>
            </div>
            """
        }.joined(separator: "\n")

        let dowChart = dowStats.map { day in
            let barHeight = max(Double(day.percentage) * 0.6, 4)
            return """
            <div class="dow-col">
              <span class="dow-count">\(day.count)</span>
              <div class="dow-bar" style="height:\(barHeight)px;"></div>
              <span class="dow-label">\(day.label)</span>
            </div>
            """
        }.joined(separator: "\n")

        let calendarSections = monthKeys.map { ym in
            """
            <div class="month-section">
              <div class="month-title">\(monthLabel(ym))</div>
              \(buildMonthCalendarHtml(ym: ym, checkins: monthGroups[ym] ?? []))
            </div>
            """
        }.joined(separator: "\n")

        let entriesByMonth = monthKeys.map { ym -> String in
            let entries = (monthGroups[ym] ?? []).sorted { tsValue($0) > tsValue($1) }
            let cards = entries.map { renderEntryCard($0) }.joined(separator: "\n")
            return """
            <div class="entries-month-title">\(monthLabel(ym))</div>
            \(cards)
            """
        }.joined(separator: "\n")

        let generated = formatLongDate(Date())

        return """
        <!DOCTYPE html>
        <html lang="es">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page { margin: 40px 36px; size: A4; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #2D2926;
            background: #FAF6F0;
            font-size: 11px;
            line-height: 1.5;
          }
          .cover { text-align: center; padding: 60px 40px 40px; page-break-after: always; }
          .cover-logo { font-size: 48px; font-weight: 300; color: #C4725A; letter-spacing: 6px; margin-bottom: 6px; font-family: Georgia, 'Times New Roman', serif; }
          .cover-tagline { font-size: 13px; color: #7A7570; letter-spacing: 2px; margin-bottom: 40px; }
          .cover-divider { width: 60px; height: 2px; background: linear-gradient(90deg, #C4725A, #E8A948, #8BA888); margin: 0 auto 40px; border-radius: 2px; }
          .cover-name { font-size: 22px; color: #44403C; font-family: Georgia, 'Times New Roman', serif; margin-bottom: 8px; }
          .cover-range { font-size: 13px; color: #7A7570; margin-bottom: 6px; }
          .cover-generated { font-size: 10px; color: #B8AFA6; margin-top: 40px; }
          .cover-plant { font-size: 56px; margin-bottom: 24px; }
          .stats-grid { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
          .stat-box { flex: 1; min-width: 100px; background: #FFFFFF; border: 1px solid #E8E0D8; border-radius: 12px; padding: 14px 10px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: 700; color: #C4725A; font-family: Georgia, 'Times New Roman', serif; }
          .stat-label { font-size: 9px; color: #7A7570; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
          .section { margin-bottom: 28px; }
          .section-title { font-size: 16px; font-weight: 600; color: #44403C; font-family: Georgia, 'Times New Roman', serif; margin-bottom: 14px; padding-bottom: 6px; border-bottom: 2px solid #E8E0D8; }
          .emotion-bar-row { display: flex; align-items: center; margin-bottom: 8px; gap: 8px; }
          .emotion-bar-emoji { font-size: 16px; width: 24px; text-align: center; }
          .emotion-bar-label { font-size: 11px; color: #44403C; width: 80px; font-weight: 500; }
          .emotion-bar-track { flex: 1; height: 16px; background: #F3EDE6; border-radius: 8px; overflow: hidden; }
          .emotion-bar-fill { height: 100%; border-radius: 8px; min-width: 2px; }
          .emotion-bar-pct { font-size: 10px; color: #7A7570; width: 32px; text-align: right; font-weight: 600; }
          .dow-chart { display: flex; justify-content: space-between; align-items: flex-end; height: 80px; gap: 6px; padding: 0 20px; }
          .dow-col { display: flex; flex-direction: column; align-items: center; flex: 1; }
          .dow-bar { width: 100%; max-width: 28px; background: linear-gradient(180deg, #C4725A, #D4937E); border-radius: 6px 6px 2px 2px; min-height: 4px; }
          .dow-label { font-size: 9px; color: #7A7570; margin-top: 4px; font-weight: 600; }
          .dow-count { font-size: 9px; color: #C4725A; margin-bottom: 3px; font-weight: 700; }
          .month-section { margin-bottom: 24px; page-break-inside: avoid; }
          .month-title { font-size: 14px; font-weight: 600; color: #C4725A; font-family: Georgia, 'Times New Roman', serif; margin-bottom: 8px; }
          .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
          .cal-header { text-align: center; font-size: 9px; font-weight: 700; color: #7A7570; padding: 4px 0; text-transform: uppercase; }
          .cal-cell { text-align: center; padding: 4px 2px; border-radius: 6px; border: 1.5px solid transparent; min-height: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
          .cal-cell.empty { border: none; }
          .cal-day { font-size: 9px; color: #44403C; font-weight: 600; }
          .cal-emoji { font-size: 12px; line-height: 1.2; }
          .entries-month-title { font-size: 13px; font-weight: 600; color: #C4725A; margin: 20px 0 10px; font-family: Georgia, 'Times New Roman', serif; }
          .entry-card { background: #FFFFFF; border: 1px solid #E8E0D8; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; page-break-inside: avoid; }
          .entry-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #F3EDE6; }
          .entry-date { font-size: 11px; color: #7A7570; font-weight: 500; }
          .entry-emotion { display: flex; align-items: center; gap: 6px; }
          .entry-emotion-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; color: #FFFFFF; }
          .entry-metrics { display: flex; gap: 16px; margin-bottom: 10px; flex-wrap: wrap; }
          .entry-metric { display: flex; align-items: center; gap: 4px; }
          .entry-metric-label { font-size: 9px; color: #7A7570; text-transform: uppercase; letter-spacing: 0.5px; }
          .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #E8E0D8; margin: 0 1px; }
          .dot.filled { background: #C4725A; }
          .entry-events { margin-bottom: 8px; }
          .entry-event-tag { display: inline-block; font-size: 10px; background: #FEF7E8; color: #B57A20; padding: 2px 8px; border-radius: 10px; margin-right: 4px; margin-bottom: 3px; font-weight: 500; }
          .entry-notes { font-size: 11px; color: #5C5752; font-style: italic; background: #FAF6F0; padding: 8px 12px; border-radius: 8px; border-left: 3px solid #E8A948; line-height: 1.6; }
          .entry-cycle { font-size: 10px; color: #B58B9E; font-weight: 500; }
          .avg-grid { display: flex; gap: 10px; margin-bottom: 24px; }
          .avg-box { flex: 1; background: #FFFFFF; border: 1px solid #E8E0D8; border-radius: 12px; padding: 12px; text-align: center; }
          .avg-label { font-size: 9px; color: #7A7570; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
          .avg-value { font-size: 20px; font-weight: 700; color: #8BA888; font-family: Georgia, 'Times New Roman', serif; }
          .avg-scale { font-size: 9px; color: #B8AFA6; }
          .page-footer { text-align: center; font-size: 9px; color: #B8AFA6; margin-top: 30px; padding-top: 14px; border-top: 1px solid #E8E0D8; }
          .compost-badge { display: inline-block; font-size: 9px; background: #F0F5EF; color: #557055; padding: 2px 8px; border-radius: 10px; font-weight: 600; margin-left: 6px; }
          .compost-reflection { font-size: 10px; color: #557055; background: #F0F5EF; padding: 6px 10px; border-radius: 6px; margin-top: 6px; border-left: 3px solid #8BA888; }
        </style>
        </head>
        <body>

        <div class="cover">
          <div class="cover-plant">🌱</div>
          <div class="cover-logo">BLOOM</div>
          <div class="cover-tagline">TU JARDÍN DE BIENESTAR</div>
          <div class="cover-divider"></div>
          <div class="cover-name">\(escapeHtml(userName))</div>
          <div class="cover-range">\(dateRange)</div>
          <div class="cover-range">\(totalCheckins) registros · \(uniqueDays) días activos</div>
          <div class="cover-generated">Generado el \(generated)</div>
        </div>

        <div class="section">
          <div class="section-title">Resumen general</div>
          <div class="stats-grid">
            <div class="stat-box"><div class="stat-value">\(totalCheckins)</div><div class="stat-label">Check-ins</div></div>
            <div class="stat-box"><div class="stat-value">\(uniqueDays)</div><div class="stat-label">Días activos</div></div>
            <div class="stat-box"><div class="stat-value">\(streak)</div><div class="stat-label">Racha actual</div></div>
            <div class="stat-box"><div class="stat-value">\(mostFrequent)</div><div class="stat-label">Más frecuente</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Promedios</div>
          <div class="avg-grid">
            <div class="avg-box"><div class="avg-label">Intensidad emocional</div><div class="avg-value">\(avgIntensity)</div><div class="avg-scale">de 5</div></div>
            <div class="avg-box"><div class="avg-label">Calidad de sueño</div><div class="avg-value">\(avgSleep)</div><div class="avg-scale">de 5</div></div>
            <div class="avg-box"><div class="avg-label">Nivel de hambre</div><div class="avg-value">\(avgHunger)</div><div class="avg-scale">de 5</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Distribución emocional</div>
          \(emotionBars)
        </div>

        <div class="section">
          <div class="section-title">Registros por día de la semana</div>
          <div class="dow-chart">\(dowChart)</div>
        </div>

        <div class="section">
          <div class="section-title">Calendario emocional</div>
          \(calendarSections)
        </div>

        <div class="section">
          <div class="section-title">Detalle de registros</div>
          \(entriesByMonth)
        </div>

        <div class="page-footer">
          Bloom · Tu jardín de bienestar · \(generated)
        </div>

        </body>
        </html>
        """
    }

    // MARK: - Helpers de datos

    private struct EmotionStat {
        let id: String
        let count: Int
        let percentage: Int
    }

    private struct DayOfWeekStat {
        let label: String
        let count: Int
        let percentage: Int
    }

    private static func buildEmotionStats(_ checkins: [CheckinEntry]) -> [EmotionStat] {
        guard !checkins.isEmpty else { return [] }
        var counts: [String: Int] = [:]
        for c in checkins { counts[c.emotion.rawValue, default: 0] += 1 }
        return counts.map { id, count in
            EmotionStat(
                id: id,
                count: count,
                percentage: Int((Double(count) / Double(checkins.count) * 100).rounded())
            )
        }.sorted { $0.count > $1.count }
    }

    private static func buildDayOfWeekStats(_ checkins: [CheckinEntry]) -> [DayOfWeekStat] {
        let labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
        var counts = [Int](repeating: 0, count: 7)
        let calendar = Calendar(identifier: .gregorian)
        for c in checkins {
            guard let date = parseDate(c.date) else { continue }
            // Calendar: 1 = domingo … 7 = sábado.
            let weekday = calendar.component(.weekday, from: date) - 1
            counts[weekday] += 1
        }
        let maxCount = max(counts.max() ?? 1, 1)
        return labels.enumerated().map { index, label in
            DayOfWeekStat(
                label: label,
                count: counts[index],
                percentage: Int((Double(counts[index]) / Double(maxCount) * 100).rounded())
            )
        }
    }

    private static func groupByMonth(_ checkins: [CheckinEntry]) -> [String: [CheckinEntry]] {
        Dictionary(grouping: checkins) { entry in
            String(entry.date.prefix(7))
        }
    }

    private static func avgValue(_ checkins: [CheckinEntry], keyPath: KeyPath<CheckinEntry, Int>) -> String {
        guard !checkins.isEmpty else { return "—" }
        let sum = checkins.reduce(0) { $0 + $1[keyPath: keyPath] }
        return String(format: "%.1f", Double(sum) / Double(checkins.count))
    }

    private static func tsValue(_ entry: CheckinEntry) -> Double {
        entry.createdAt.timeIntervalSince1970
    }

    // MARK: - Helpers de fecha y formato

    private static let isoFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(secondsFromGMT: 0)
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static let longDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "es_ES")
        f.dateFormat = "EEEE, d 'de' MMMM 'de' yyyy"
        return f
    }()

    private static let shortDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "es_ES")
        f.dateFormat = "d MMM"
        return f
    }()

    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "es_ES")
        f.dateFormat = "HH:mm"
        return f
    }()

    private static let monthLabelFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "es_ES")
        f.dateFormat = "MMMM yyyy"
        return f
    }()

    private static func parseDate(_ key: String) -> Date? {
        isoFormatter.date(from: key)
    }

    private static func formatDateLong(_ key: String) -> String {
        guard let date = parseDate(key) else { return key }
        let label = longDateFormatter.string(from: date)
        return label.prefix(1).capitalized + label.dropFirst()
    }

    private static func formatLongDate(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "es_ES")
        f.dateFormat = "d 'de' MMMM 'de' yyyy"
        return f.string(from: date)
    }

    private static func formatDateShort(_ key: String) -> String {
        guard let date = parseDate(key) else { return key }
        return shortDateFormatter.string(from: date)
    }

    private static func formatTime(_ entry: CheckinEntry) -> String {
        timeFormatter.string(from: entry.createdAt)
    }

    private static func monthLabel(_ ym: String) -> String {
        let parts = ym.split(separator: "-").map(String.init)
        guard parts.count == 2,
              let year = Int(parts[0]),
              let month = Int(parts[1])
        else { return ym }
        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = 1
        guard let date = Calendar(identifier: .gregorian).date(from: components) else { return ym }
        let label = monthLabelFormatter.string(from: date)
        return label.prefix(1).capitalized + label.dropFirst()
    }

    // MARK: - Calendario mensual

    private static func buildMonthCalendarHtml(ym: String, checkins: [CheckinEntry]) -> String {
        let parts = ym.split(separator: "-").map(String.init)
        guard parts.count == 2,
              let year = Int(parts[0]),
              let month = Int(parts[1])
        else { return "" }

        let calendar = Calendar(identifier: .gregorian)
        var firstDayComps = DateComponents()
        firstDayComps.year = year
        firstDayComps.month = month
        firstDayComps.day = 1
        guard let firstDay = calendar.date(from: firstDayComps),
              let range = calendar.range(of: .day, in: .month, for: firstDay)
        else { return "" }
        let daysInMonth = range.count
        let startWeekday = calendar.component(.weekday, from: firstDay) - 1  // 0 = domingo

        // Emoción predominante por día del mes (frecuencia → desempate por orden de aparición).
        var dayCounts: [Int: [String: Int]] = [:]
        for c in checkins {
            let day = Int(c.date.split(separator: "-")[2]) ?? 0
            dayCounts[day, default: [:]][c.emotion.rawValue, default: 0] += 1
        }
        var dayTopEmotion: [Int: EmotionID] = [:]
        for (day, counts) in dayCounts {
            if let topID = counts.max(by: { $0.value < $1.value })?.key,
               let emotion = EmotionID(rawValue: topID) {
                dayTopEmotion[day] = emotion
            }
        }

        let dayNames = ["D", "L", "M", "X", "J", "V", "S"]
        var html = "<div class=\"cal-grid\">"
        for name in dayNames { html += "<div class=\"cal-header\">\(name)</div>" }
        for _ in 0..<startWeekday { html += "<div class=\"cal-cell empty\"></div>" }
        for day in 1...daysInMonth {
            if let emotion = dayTopEmotion[day] {
                let hex = emotionColorHex(emotion)
                html += """
                <div class="cal-cell" style="background:\(hex)25;border-color:\(hex)">
                  <span class="cal-day">\(day)</span>
                  <span class="cal-emoji">\(emotion.config.emoji)</span>
                </div>
                """
            } else {
                html += """
                <div class="cal-cell" style="background:transparent;border-color:transparent">
                  <span class="cal-day">\(day)</span>
                </div>
                """
            }
        }
        html += "</div>"
        return html
    }

    // MARK: - Tarjeta de un registro

    private static func renderEntryCard(_ entry: CheckinEntry) -> String {
        let emotion = entry.emotion
        let config = emotion.config
        let bgColor = emotionColorHex(emotion)
        let dateText = formatDateLong(entry.date)
        let time = formatTime(entry)
        let dateLine = time.isEmpty ? dateText : "\(dateText) · \(time)"
        let compostBadge = (entry.composted == true) ? "<span class=\"compost-badge\">Compostado</span>" : ""

        let cycleLabel: String = {
            guard let phase = entry.cyclePhase else { return "" }
            switch phase {
            case .noAplica: return ""
            case .menstruacion: return "Menstruación"
            case .folicular: return "Folicular"
            case .ovulacion: return "Ovulación"
            case .lutea: return "Lútea"
            }
        }()
        let cycleHTML = cycleLabel.isEmpty ? "" : "<span class=\"entry-cycle\">\(cycleLabel)</span>"

        let events = entry.events.filter { !$0.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        let eventsHTML: String = {
            guard !events.isEmpty else { return "" }
            let tags = events.map { "<span class=\"entry-event-tag\">\(escapeHtml($0.title))</span>" }.joined()
            return "<div class=\"entry-events\">\(tags)</div>"
        }()

        let notesHTML: String = {
            let trimmed = entry.notes.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else { return "" }
            return "<div class=\"entry-notes\">\(escapeHtml(entry.notes))</div>"
        }()

        let compostReflectionHTML: String = {
            guard let reflection = entry.compostReflection,
                  !reflection.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            else { return "" }
            return "<div class=\"compost-reflection\">\(escapeHtml(reflection))</div>"
        }()

        return """
        <div class="entry-card">
          <div class="entry-header">
            <div>
              <span class="entry-date">\(dateLine)</span>
              \(compostBadge)
            </div>
            <div class="entry-emotion">
              <span class="entry-emotion-badge" style="background:\(bgColor);">
                \(config.emoji) \(config.label)
              </span>
            </div>
          </div>
          <div class="entry-metrics">
            <div class="entry-metric">
              <span class="entry-metric-label">Intensidad</span>
              \(intensityDots(entry.emotionIntensity))
            </div>
            <div class="entry-metric">
              <span class="entry-metric-label">Sueño</span>
              \(intensityDots(entry.sleepQuality))
            </div>
            <div class="entry-metric">
              <span class="entry-metric-label">Hambre</span>
              \(intensityDots(entry.hungerLevel))
            </div>
            \(cycleHTML)
          </div>
          \(eventsHTML)
          \(notesHTML)
          \(compostReflectionHTML)
        </div>
        """
    }

    private static func intensityDots(_ value: Int, max: Int = 5) -> String {
        (1...max).map { i in
            let filled = i <= value
            let style = filled ? "background:#C4725A;" : ""
            return "<span class=\"dot\(filled ? " filled" : "")\" style=\"\(style)\"></span>"
        }.joined()
    }

    // MARK: - Helpers HTML

    private static func escapeHtml(_ text: String) -> String {
        text
            .replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
            .replacingOccurrences(of: "\"", with: "&quot;")
            .replacingOccurrences(of: "\n", with: "<br>")
    }

    /// Hex de cada emoción (espejo de `EmotionConfig.all`). Se usa solo en el
    /// HTML del PDF; aquí lo duplicamos para no tener que parsear el `Color`
    /// del modelo.
    private static func emotionColorHex(_ emotion: EmotionID) -> String {
        switch emotion {
        case .alegria: return "#E8A948"
        case .tristeza: return "#7E9EB5"
        case .ira: return "#A0522D"
        case .miedo: return "#8B7EB5"
        case .asco: return "#7A9E7E"
        case .sorpresa: return "#D4937E"
        case .ansiedad: return "#B58B9E"
        case .calma: return "#8BA888"
        case .frustracion: return "#C4725A"
        case .gratitud: return "#F0C478"
        case .verguenza: return "#C9A0B0"
        case .culpa: return "#B8AFA6"
        }
    }
}
