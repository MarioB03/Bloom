import SwiftUI

/// Historial de práctica de habilidades: tres tarjetas de resumen y el listado
/// de prácticas agrupado por día. Portado de `app/habilidades/historial.tsx`.
struct PracticeHistoryView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore

    @State private var practices: [SkillPractice] = []
    @State private var uniqueCount = 0
    @State private var isLoading = true

    private var totalMinutes: Int {
        practices.reduce(0) { $0 + $1.durationSeconds } / 60
    }

    var body: some View {
        ScreenWrapper {
            summaryRow
            if isLoading {
                ProgressView()
                    .tint(Theme.Palette.primary400)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Theme.Spacing.xxl)
            } else if practices.isEmpty {
                EmptyState(emoji: "🧘", message: Strings.Skills.noPractices)
            } else {
                ForEach(groupedSections(), id: \.title) { section in
                    Text(section.title)
                        .font(.caption)
                        .foregroundStyle(Theme.Palette.neutral500)
                        .padding(.top, Theme.Spacing.sm)
                    ForEach(section.items) { practice in
                        PracticeHistoryCard(practice: practice)
                    }
                }
            }
        }
        .navigationTitle(Strings.Skills.practiceHistory)
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Resumen

    private var summaryRow: some View {
        HStack(spacing: Theme.Spacing.sm) {
            summaryCard(value: "\(practices.count)", label: Strings.Skills.totalPractices)
            summaryCard(value: "\(uniqueCount)", label: Strings.Skills.uniqueSkills)
            summaryCard(value: "\(totalMinutes)", label: "\(Strings.Skills.totalTime) (\(Strings.Skills.minutes))")
        }
    }

    private func summaryCard(value: String, label: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.custom("DMSans-Bold", size: 24))
                .foregroundStyle(Theme.Palette.neutral800)
            Text(label)
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral500)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(Theme.Spacing.md)
        .background(Theme.Palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .bloomShadow(.sm)
    }

    // MARK: - Agrupación

    /// Agrupa las prácticas por día natural, conservando el orden descendente.
    private func groupedSections() -> [(title: String, items: [SkillPractice])] {
        var order: [String] = []
        var groups: [String: [SkillPractice]] = [:]
        for practice in practices {
            let key = BloomDate.dateKey(practice.completedAt)
            if groups[key] == nil {
                order.append(key)
                groups[key] = []
            }
            groups[key]?.append(practice)
        }
        return order.map { key in
            let label = BloomDate.date(fromKey: key).map(Self.dateFormatter.string) ?? key
            return (title: label, items: groups[key] ?? [])
        }
    }

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "es_ES")
        formatter.dateFormat = "d 'de' MMMM 'de' yyyy"
        return formatter
    }()

    // MARK: - Datos

    private func load() async {
        guard let userID = auth.currentUserID else {
            isLoading = false
            return
        }
        do {
            // Awaits secuenciales: los modelos de Firestore no son `Sendable`.
            practices = try await firestore.skillPracticeHistory(userID: userID)
            uniqueCount = try await firestore.uniquePracticedSkillIDs(userID: userID).count
        } catch {
            // Se conserva el último estado conocido ante un fallo de red.
        }
        isLoading = false
    }
}

#Preview {
    NavigationStack {
        PracticeHistoryView()
    }
}
