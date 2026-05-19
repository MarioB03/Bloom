import SwiftUI

/// Resumen emocional de un día en la rejilla del calendario.
struct DayData {
    /// Emoción predominante del día (la más frecuente).
    var emotion: EmotionID?
    /// Número de check-ins registrados ese día.
    var count: Int
}

/// Rejilla mensual con un punto de color por la emoción predominante de cada día.
/// Portado de `src/components/calendar/MonthView.tsx`.
struct MonthGrid: View {

    /// Primer día del mes mostrado.
    let month: Date
    /// Datos por día, indexados por clave `"YYYY-MM-DD"`.
    let data: [String: DayData]
    /// Clave `"YYYY-MM-DD"` del día de hoy, para resaltarlo.
    let today: String
    let onDayPress: (String) -> Void

    private static let dayNames = ["L", "M", "X", "J", "V", "S", "D"]
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 0), count: 7)

    var body: some View {
        VStack(spacing: Theme.Spacing.sm) {
            weekdayHeader
            LazyVGrid(columns: columns, spacing: 0) {
                ForEach(Array(cells.enumerated()), id: \.offset) { _, day in
                    if let day {
                        let key = dateKey(for: day)
                        DayCell(day: day, dayData: data[key], isToday: key == today) {
                            onDayPress(key)
                        }
                    } else {
                        Color.clear.frame(minHeight: 52)
                    }
                }
            }
        }
        .padding(Theme.Spacing.md)
        .background(Theme.Palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
        .bloomShadow(.sm)
    }

    private var weekdayHeader: some View {
        LazyVGrid(columns: columns, spacing: 0) {
            ForEach(Self.dayNames, id: \.self) { name in
                Text(name)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .tracking(0.8)
                    .foregroundStyle(Theme.Palette.neutral400)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Theme.Spacing.xs)
            }
        }
        .padding(.bottom, Theme.Spacing.xs)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(Theme.Palette.neutral100)
                .frame(height: 1)
        }
    }

    /// Celdas del mes con relleno inicial (huecos antes del día 1, semana
    /// empezando en lunes) y relleno final hasta completar la última fila.
    private var cells: [Int?] {
        let calendar = Calendar.current
        guard let range = calendar.range(of: .day, in: .month, for: month) else { return [] }
        // weekday: 1 = domingo … 7 = sábado. Lo desplazamos a lunes = 0.
        let firstWeekday = calendar.component(.weekday, from: month)
        let offset = (firstWeekday + 5) % 7

        var result: [Int?] = Array(repeating: nil, count: offset)
        result.append(contentsOf: range.map(Optional.init))
        while result.count % 7 != 0 { result.append(nil) }
        return result
    }

    private func dateKey(for day: Int) -> String {
        let calendar = Calendar.current
        let date = calendar.date(byAdding: .day, value: day - 1, to: month) ?? month
        return BloomDate.dateKey(date)
    }
}

/// Una celda de día: número, resalte de hoy y punto de la emoción predominante.
private struct DayCell: View {

    let day: Int
    let dayData: DayData?
    let isToday: Bool
    let onPress: () -> Void

    var body: some View {
        Button(action: onPress) {
            ZStack {
                RoundedRectangle(cornerRadius: Theme.Radius.md)
                    .fill(isToday ? Theme.Palette.primary50 : Theme.Palette.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: Theme.Radius.md)
                            .strokeBorder(
                                isToday ? Theme.Palette.primary400 : Theme.Palette.neutral100,
                                lineWidth: isToday ? 2 : 1
                            )
                    )
                    .frame(width: 42, height: 42)

                Text("\(day)")
                    .font(.system(size: 15, weight: isToday ? .bold : .medium))
                    .foregroundStyle(isToday ? Theme.Palette.primary600 : Theme.Palette.neutral700)

                if let emotion = dayData?.emotion {
                    Circle()
                        .fill(emotion.config.color)
                        .frame(width: 6, height: 6)
                        .offset(y: 14)
                }
            }
            .frame(maxWidth: .infinity, minHeight: 52)
        }
        .buttonStyle(PressScaleButtonStyle())
    }
}

/// Escala la celda con un muelle al pulsar, como el `withSpring` de la app RN.
private struct PressScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.92 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: configuration.isPressed)
    }
}
