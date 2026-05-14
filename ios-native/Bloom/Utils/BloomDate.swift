import Foundation

/// Utilidades de fecha de Bloom. Portado de `src/utils/date.ts`.
///
/// `dateKey` usa el calendario local del dispositivo (igual que el
/// `format(date, 'yyyy-MM-dd')` de date-fns en la app RN), de modo que el
/// "día" de un check-in coincide con el día natural del usuario.
enum BloomDate {

    /// Fecha en formato `"YYYY-MM-DD"` — la clave de día de un check-in.
    static func dateKey(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }

    /// Parsea una clave `"YYYY-MM-DD"` a `Date` (medianoche local).
    static func date(fromKey key: String) -> Date? {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: key)
    }

    /// Hora en formato `"HH:mm"`.
    static func time(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "es_ES")
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }

    /// Fecha para mostrar: "Hoy", "Ayer" o "lunes, 5 de mayo".
    static func displayDate(_ date: Date) -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return "Hoy" }
        if calendar.isDateInYesterday(date) { return "Ayer" }

        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "es_ES")
        formatter.dateFormat = "EEEE, d 'de' MMMM"
        return formatter.string(from: date).capitalizedFirst
    }

    /// Mes y año para la cabecera del calendario: "Mayo de 2026".
    static func monthYearLabel(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "es_ES")
        formatter.dateFormat = "MMMM 'de' yyyy"
        return formatter.string(from: date).capitalizedFirst
    }

    /// Primer día del mes (medianoche local) al que pertenece `date`.
    static func startOfMonth(_ date: Date) -> Date {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month], from: date)
        return calendar.date(from: components) ?? date
    }

    /// Saludo según la hora del día.
    static func greeting(now: Date = Date()) -> String {
        let hour = Calendar.current.component(.hour, from: now)
        switch hour {
        case ..<12: return Strings.Greeting.morning
        case 12..<20: return Strings.Greeting.afternoon
        default: return Strings.Greeting.evening
        }
    }
}

private extension String {
    /// Pone en mayúscula solo la primera letra (los `DateFormatter` en español
    /// devuelven el día de la semana en minúscula).
    var capitalizedFirst: String {
        guard let first else { return self }
        return first.uppercased() + dropFirst()
    }
}
