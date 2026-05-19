import SwiftUI

/// Segmento del diario: filtra el listado por tipo de entrada.
enum AgendaSegment: CaseIterable {
    case all, checkin, register, gratitude

    var label: String {
        switch self {
        case .all: Strings.Agenda.segmentAll
        case .checkin: Strings.Agenda.segmentCheckin
        case .register: Strings.Agenda.segmentRegister
        case .gratitude: Strings.Agenda.segmentGratitude
        }
    }
}

/// Una entrada del diario: check-in, registro emocional o gratitud.
enum AgendaItem: Identifiable {
    case checkin(CheckinEntry)
    case register(EmotionalRegisterEntry)
    case gratitude(GratitudeEntry)

    var id: String {
        switch self {
        case .checkin(let entry): "checkin-\(entry.id ?? "")"
        case .register(let entry): "register-\(entry.id ?? "")"
        case .gratitude(let entry): "gratitude-\(entry.id ?? "")"
        }
    }

    /// Fecha `"YYYY-MM-DD"` — para agrupar por día y filtrar por rango.
    var date: String {
        switch self {
        case .checkin(let entry): entry.date
        case .register(let entry): entry.date
        case .gratitude(let entry): entry.date
        }
    }

    /// Instante de creación — para ordenar de más reciente a más antiguo.
    var createdAt: Date {
        switch self {
        case .checkin(let entry): entry.createdAt
        case .register(let entry): entry.createdAt
        case .gratitude(let entry): entry.createdAt
        }
    }

    /// Emoción asociada, o `nil` (la gratitud no tiene emoción).
    var emotion: EmotionID? {
        switch self {
        case .checkin(let entry): entry.emotion
        case .register(let entry): entry.emotion
        case .gratitude: nil
        }
    }

    /// Texto sobre el que busca el filtro de texto libre.
    var searchableText: String {
        switch self {
        case .checkin(let entry):
            ([entry.notes] + entry.events.map { "\($0.title) \($0.description)" })
                .joined(separator: " ")
        case .register(let entry):
            [entry.trigger, entry.vulnerability, entry.interpretations,
             entry.internalSensations, entry.externalLanguage, entry.impulses,
             entry.behavior, entry.consequences, entry.emotionFunction,
             entry.emotionCustom].joined(separator: " ")
        case .gratitude(let entry):
            entry.items.joined(separator: " ")
        }
    }
}

/// Destino de navegación del diario hacia el detalle de una entrada.
enum AgendaDestination: Hashable {
    case checkin(id: String)
    case register(id: String)
}

/// Pestaña "Registros": el diario combinado de Bloom. Lista check-ins,
/// registros emocionales y entradas de gratitud, con búsqueda por texto,
/// segmentos por tipo y filtros por emoción y rango de fechas.
/// Unifica `app/(tabs)/registros.tsx` y `app/agenda.tsx` de la app RN.
///
/// Divergencias de RN: se omite la animación del "libro que se abre" de
/// `agenda.tsx` (artificio propio de RN); el diario es la pestaña en sí, no
/// una pantalla apilada sobre un mini-libro del home. Las tarjetas de gratitud
/// muestran sus motivos en línea y no navegan: para editar la gratitud de hoy
/// está el CTA del home (el modo de solo lectura de días pasados de RN no se
/// porta). Crear un registro emocional se hace desde el CTA propio de esta
/// pestaña.
struct NotesView: View {
    var body: some View {
        NavigationStack {
            DiaryView()
                .toolbar(.hidden, for: .navigationBar)
        }
    }
}

/// Contenido del diario combinado: cabecera, CTA, búsqueda, segmentos, filtros
/// y el listado agrupado por día. Se usa tal cual en la pestaña "Registros"
/// (`NotesView`) y dentro de la animación de libro (`DiaryBookView`).
struct DiaryView: View {

    /// Si no es `nil`, se muestra un botón de cerrar sobre la cabecera (modo
    /// libro, abierto desde el home). En la pestaña Registros es `nil`.
    var onClose: (() -> Void)? = nil

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore

    @State private var items: [AgendaItem] = []
    @State private var isLoading = true
    @State private var showingForm = false

    @State private var searchText = ""
    @State private var segment: AgendaSegment = .all
    @State private var selectedEmotions: Set<EmotionID> = []
    @State private var dateFrom: Date?
    @State private var dateTo: Date?
    @State private var showingFilters = false

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: Theme.Spacing.md) {
                header
                newRegisterCard
                searchBar
                segmentPicker
                if showingFilters {
                    filtersBlock
                }
                resultsBlock
            }
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.top, Theme.Spacing.md)
            .padding(.bottom, Theme.Spacing.xl)
        }
        .scrollIndicators(.hidden)
        .scrollDismissesKeyboard(.interactively)
        .background(Theme.Palette.background)
        .navigationDestination(for: AgendaDestination.self) { destination in
            switch destination {
            case .checkin(let id):
                CheckInDetailView(id: id) { Task { await load() } }
            case .register(let id):
                EmotionalRegisterDetailView(id: id) { Task { await load() } }
            }
        }
        .sheet(isPresented: $showingForm) {
            EmotionalRegisterFormView {
                Task { await load() }
            }
        }
        .task { await load() }
    }

    // MARK: - Cabecera y CTA

    private var header: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            if let onClose {
                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(Theme.Palette.neutral500)
                        .frame(width: 40, height: 40)
                        .background(Theme.Palette.neutral100)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(Strings.Agenda.title)
                    .font(.displaySmall)
                    .foregroundStyle(Theme.Palette.neutral800)
                Text(Strings.Agenda.subtitle)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral500)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var newRegisterCard: some View {
        Button {
            showingForm = true
        } label: {
            HStack(spacing: Theme.Spacing.md) {
                Text("🔍")
                    .font(.system(size: 22))
                    .frame(width: 44, height: 44)
                    .background(Color.white.opacity(0.2))
                    .clipShape(Circle())
                VStack(alignment: .leading, spacing: 2) {
                    Text(Strings.EmotionalRegister.newRegister)
                        .font(.bodyBold)
                        .foregroundStyle(.white)
                    Text(Strings.EmotionalRegister.newRegisterSubtitle)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.85))
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.85))
            }
            .padding(Theme.Spacing.md)
            .background(Theme.Palette.primary400)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
            .bloomShadow(.md)
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.impact(weight: .medium), trigger: showingForm)
    }

    // MARK: - Búsqueda y segmentos

    private var searchBar: some View {
        HStack(spacing: Theme.Spacing.sm) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 16))
                .foregroundStyle(Theme.Palette.neutral400)

            TextField(Strings.Agenda.searchPlaceholder, text: $searchText)
                .font(.bodyText)
                .submitLabel(.search)

            if !searchText.isEmpty {
                Button {
                    searchText = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(Theme.Palette.neutral400)
                }
                .buttonStyle(.plain)
            }

            Button {
                showingFilters.toggle()
            } label: {
                Image(systemName: "slider.horizontal.3")
                    .font(.system(size: 18))
                    .foregroundStyle(
                        showingFilters || hasActiveFilters
                            ? Theme.Palette.primary400
                            : Theme.Palette.neutral400
                    )
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, Theme.Spacing.md)
        .padding(.vertical, Theme.Spacing.sm + 2)
        .background(Theme.Palette.neutral50)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.md)
                .strokeBorder(Theme.Palette.neutral200, lineWidth: 1)
        )
    }

    private var segmentPicker: some View {
        HStack(spacing: 3) {
            ForEach(AgendaSegment.allCases, id: \.self) { option in
                let isActive = segment == option
                Button {
                    segment = option
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
                .sensoryFeedback(.selection, trigger: segment)
            }
        }
        .padding(3)
        .background(Theme.Palette.neutral100)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
    }

    // MARK: - Filtros

    private var filtersBlock: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text(Strings.Agenda.emotionsLabel)
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.neutral700)

            EmotionChipsRow(selected: $selectedEmotions)

            HStack(alignment: .top, spacing: Theme.Spacing.sm) {
                DateFilterField(
                    label: Strings.Agenda.dateFrom,
                    date: $dateFrom,
                    maximumDate: dateTo ?? Date()
                )
                DateFilterField(
                    label: Strings.Agenda.dateTo,
                    date: $dateTo,
                    maximumDate: Date()
                )
            }

            if hasActiveFilters {
                Button {
                    clearFilters()
                } label: {
                    Text(Strings.Agenda.clearFilters)
                        .font(.bodyText)
                        .foregroundStyle(Theme.Palette.primary400)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(Theme.Spacing.md)
        .background(Theme.Palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.lg)
                .strokeBorder(Theme.Palette.neutral200, lineWidth: 1)
        )
    }

    // MARK: - Resultados

    @ViewBuilder
    private var resultsBlock: some View {
        if isLoading {
            VStack(spacing: 0) {
                ForEach(0..<3, id: \.self) { _ in
                    SkeletonCard()
                }
            }
        } else {
            let sections = groupedSections()

            Text(Strings.Agenda.entryCount(filteredItems.count))
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral500)

            if sections.isEmpty {
                EmptyState(
                    emoji: hasActiveFilters ? "🔍" : "📖",
                    message: hasActiveFilters
                        ? "\(Strings.Agenda.noResults)\n\(Strings.Agenda.noResultsHint)"
                        : Strings.Agenda.empty
                )
            } else {
                ForEach(sections, id: \.dateKey) { section in
                    sectionHeader(section.title)
                    ForEach(section.items) { item in
                        itemCard(item)
                    }
                }
            }
        }
    }

    private func sectionHeader(_ title: String) -> some View {
        HStack(spacing: Theme.Spacing.sm) {
            Rectangle()
                .fill(Theme.Palette.neutral200)
                .frame(height: 1)
            Text(title)
                .font(.smallText)
                .fontWeight(.semibold)
                .foregroundStyle(Theme.Palette.neutral500)
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.vertical, Theme.Spacing.xs)
                .background(Theme.Palette.neutral100)
                .clipShape(Capsule())
            Rectangle()
                .fill(Theme.Palette.neutral200)
                .frame(height: 1)
        }
        .padding(.vertical, Theme.Spacing.xs)
    }

    @ViewBuilder
    private func itemCard(_ item: AgendaItem) -> some View {
        switch item {
        case .checkin(let entry):
            NavigationLink(value: AgendaDestination.checkin(id: entry.id ?? "")) {
                CheckinCard(checkin: entry)
            }
            .buttonStyle(.plain)
        case .register(let entry):
            NavigationLink(value: AgendaDestination.register(id: entry.id ?? "")) {
                EmotionalRegisterCard(register: entry)
            }
            .buttonStyle(.plain)
        case .gratitude(let entry):
            GratitudeCard(entry: entry)
        }
    }

    // MARK: - Filtrado y agrupación

    private var hasActiveFilters: Bool {
        !searchText.trimmingCharacters(in: .whitespaces).isEmpty
            || !selectedEmotions.isEmpty
            || dateFrom != nil
            || dateTo != nil
    }

    private var filteredItems: [AgendaItem] {
        var result = items

        switch segment {
        case .all: break
        case .checkin: result = result.filter { if case .checkin = $0 { true } else { false } }
        case .register: result = result.filter { if case .register = $0 { true } else { false } }
        case .gratitude: result = result.filter { if case .gratitude = $0 { true } else { false } }
        }

        guard hasActiveFilters else { return result }

        let query = searchText.trimmingCharacters(in: .whitespaces).lowercased()
        let fromKey = dateFrom.map(BloomDate.dateKey)
        let toKey = dateTo.map(BloomDate.dateKey)

        return result.filter { item in
            if !selectedEmotions.isEmpty {
                guard let emotion = item.emotion, selectedEmotions.contains(emotion) else {
                    return false
                }
            }
            if let fromKey, item.date < fromKey { return false }
            if let toKey, item.date > toKey { return false }
            if !query.isEmpty, !item.searchableText.lowercased().contains(query) {
                return false
            }
            return true
        }
    }

    /// Agrupa las entradas filtradas por día, conservando el orden descendente.
    private func groupedSections() -> [(dateKey: String, title: String, items: [AgendaItem])] {
        var order: [String] = []
        var groups: [String: [AgendaItem]] = [:]
        for item in filteredItems {
            if groups[item.date] == nil {
                order.append(item.date)
                groups[item.date] = []
            }
            groups[item.date]?.append(item)
        }
        return order.map { (dateKey: $0, title: dateLabel($0), items: groups[$0] ?? []) }
    }

    /// Etiqueta de la cabecera de sección: "Hoy", "Ayer" o "5 may 2026".
    private func dateLabel(_ dateKey: String) -> String {
        guard let date = BloomDate.date(fromKey: dateKey) else { return dateKey }
        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return Strings.Agenda.today }
        if calendar.isDateInYesterday(date) { return Strings.Agenda.yesterday }
        return Self.sectionFormatter.string(from: date)
    }

    private static let sectionFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "es_ES")
        formatter.dateFormat = "d MMM yyyy"
        return formatter
    }()

    // MARK: - Acciones

    private func clearFilters() {
        searchText = ""
        selectedEmotions = []
        dateFrom = nil
        dateTo = nil
    }

    // MARK: - Datos

    private func load() async {
        guard let userID = auth.currentUserID else {
            isLoading = false
            return
        }
        do {
            // Awaits secuenciales (no `async let`): los modelos de Firestore no
            // son `Sendable`, así que no pueden cruzar fronteras de tarea.
            let checkins = try await firestore.allCheckins(userID: userID)
            let registers = try await firestore.allEmotionalRegisters(userID: userID)
            let gratitude = try await firestore.allGratitude(userID: userID)

            let combined =
                checkins.map(AgendaItem.checkin)
                + registers.map(AgendaItem.register)
                + gratitude.map(AgendaItem.gratitude)

            items = combined.sorted { $0.createdAt > $1.createdAt }
        } catch {
            // Se conserva el último estado conocido ante un fallo de red.
        }
        isLoading = false
    }
}
