import SwiftUI

/// Rutas de navegación dentro del detalle de día.
enum DayDetailRoute: Hashable {
    case checkin(id: String)
}

/// Detalle de un día concreto: lista de check-ins de esa fecha.
/// Portado de `app/dia/[fecha].tsx`.
///
/// La versión RN mezcla además registros emocionales y gratitud del día;
/// esas piezas llegarán al portar sus respectivas features. Aquí se muestran
/// solo los check-ins.
struct DayDetailView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore
    @Environment(\.dismiss) private var dismiss

    /// Fecha del día en formato `"YYYY-MM-DD"`.
    let date: String

    @State private var checkins: [CheckinEntry] = []
    @State private var isLoading = true
    @State private var showingForm = false

    private var isToday: Bool {
        date == BloomDate.dateKey(Date())
    }

    private var displayDate: String {
        guard let parsed = BloomDate.date(fromKey: date) else { return "" }
        return BloomDate.displayDate(parsed)
    }

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
                    .tint(Theme.Palette.primary400)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Theme.Palette.background)
            } else {
                content
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .navigationDestination(for: DayDetailRoute.self) { route in
            switch route {
            case .checkin(let id):
                CheckInDetailView(id: id, onChanged: {
                    Task { await load() }
                })
            }
        }
        .sheet(isPresented: $showingForm) {
            CheckInFormView {
                Task { await load() }
            }
        }
        .task { await load() }
    }

    // MARK: - Contenido

    private var content: some View {
        ScreenWrapper {
            header
            dateBanner
            if checkins.isEmpty {
                EmptyState(emoji: "🌤️", message: Strings.Calendar.emptyDay)
                    .padding(.top, Theme.Spacing.lg)
            } else {
                ForEach(checkins) { checkin in
                    NavigationLink(value: DayDetailRoute.checkin(id: checkin.id ?? "")) {
                        CheckinCard(checkin: checkin)
                    }
                    .buttonStyle(.plain)
                }
            }
            if isToday {
                BloomButton(title: "🌿 \(Strings.Calendar.addRecord)", size: .lg) {
                    showingForm = true
                }
                .padding(.top, Theme.Spacing.sm)
            }
        }
    }

    private var header: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Theme.Palette.neutral600)
                    .frame(width: 40, height: 40)
                    .background(Theme.Palette.neutral100)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)

            Spacer()

            Text(Strings.Calendar.dayDetailTitle)
                .font(.heading3)
                .foregroundStyle(Theme.Palette.neutral700)

            Spacer()

            Color.clear.frame(width: 40, height: 40)
        }
    }

    private var dateBanner: some View {
        HStack(spacing: Theme.Spacing.md) {
            Text("📅")
                .font(.system(size: 32))
            VStack(alignment: .leading, spacing: 2) {
                Text(displayDate)
                    .font(.heading3)
                    .foregroundStyle(Theme.Palette.secondary600)
                Text(Strings.Calendar.recordCount(checkins.count))
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.secondary400)
            }
            Spacer()
        }
        .padding(Theme.Spacing.lg)
        .background(Theme.Palette.secondary50)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.xl)
                .strokeBorder(Theme.Palette.secondary100, lineWidth: 1)
        )
    }

    // MARK: - Datos

    private func load() async {
        guard let userID = auth.currentUserID else {
            isLoading = false
            return
        }
        do {
            checkins = try await firestore.checkins(byDate: date, userID: userID)
        } catch {
            // Se conserva el último estado conocido ante un fallo de red.
        }
        isLoading = false
    }
}
