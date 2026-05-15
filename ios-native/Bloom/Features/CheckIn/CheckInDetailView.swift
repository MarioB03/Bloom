import SwiftUI

/// Detalle de un check-in: emoción, estado físico, eventos y notas.
/// Portado de `app/checkin/[id].tsx`.
///
/// La acción de "compostar" de la app RN depende de la economía del jardín,
/// que aún no está portada; aquí solo se muestra la reflexión si ya existe.
///
/// Modo solo lectura: si `ownerID` no es `nil`, el detalle se carga del
/// dueño compartido y se ocultan los botones de editar y eliminar
/// (equivalente al parámetro `?owner=` de la app RN).
struct CheckInDetailView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore
    @Environment(\.dismiss) private var dismiss

    let id: String
    /// Si no es `nil`, la vista se carga del dueño compartido y se oculta la
    /// edición/borrado. `nil` significa "es mi propio check-in".
    var ownerID: String? = nil
    /// Se invoca cuando el check-in se edita o se elimina, para recargar la
    /// pantalla origen.
    let onChanged: () -> Void

    private var isReadOnly: Bool { ownerID != nil }

    @State private var checkin: CheckinEntry?
    @State private var isLoading = true
    @State private var showingEditForm = false
    @State private var showingDeleteConfirm = false

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
                    .tint(Theme.Palette.primary400)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Theme.Palette.background)
            } else if let checkin {
                content(checkin)
            } else {
                notFound
            }
        }
        .navigationTitle(Strings.CheckIn.detailTitle)
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .sheet(isPresented: $showingEditForm) {
            if let checkin {
                CheckInFormView(entryToEdit: checkin) {
                    onChanged()
                    Task { await load() }
                }
            }
        }
        .confirmationDialog(
            Strings.CheckIn.deleteTitle,
            isPresented: $showingDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button(Strings.Common.delete, role: .destructive) { delete() }
            Button(Strings.Common.cancel, role: .cancel) {}
        } message: {
            Text(Strings.CheckIn.deleteMessage)
        }
    }

    // MARK: - Contenido

    private func content(_ checkin: CheckinEntry) -> some View {
        ScreenWrapper {
            heroCard(checkin)
            physicalStateCard(checkin)
            if !checkin.events.isEmpty {
                eventsCard(checkin)
            }
            if !checkin.notes.isEmpty {
                notesCard(checkin)
            }
            if checkin.composted == true, let reflection = checkin.compostReflection,
               !reflection.isEmpty {
                reflectionCard(reflection)
            }
        }
        .toolbar {
            if !isReadOnly {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        showingEditForm = true
                    } label: {
                        Image(systemName: "square.and.pencil")
                    }
                    Button(role: .destructive) {
                        showingDeleteConfirm = true
                    } label: {
                        Image(systemName: "trash")
                    }
                }
            }
        }
    }

    private func heroCard(_ checkin: CheckinEntry) -> some View {
        let emotion = checkin.emotion.config
        return BloomCard(style: .elevated) {
            VStack(spacing: Theme.Spacing.sm) {
                BloomIconView(emotion.icon, size: 64)
                    .frame(width: 80, height: 80)
                    .background(emotion.color.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 24))

                Text(emotion.label)
                    .font(.displaySmall)
                    .foregroundStyle(emotion.color)

                Text("\(Strings.CheckIn.intensity): \(Strings.CheckIn.intensityLabel(checkin.emotionIntensity))")
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral500)

                HStack(spacing: Theme.Spacing.sm) {
                    dateBadge(icon: "calendar", text: BloomDate.displayDate(checkin.createdAt))
                    dateBadge(icon: "clock", text: BloomDate.time(checkin.createdAt))
                }
                .padding(.top, Theme.Spacing.xs)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.lg)
        }
    }

    private func dateBadge(icon: String, text: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 12))
            Text(text)
                .font(.caption)
        }
        .foregroundStyle(Theme.Palette.neutral500)
        .padding(.horizontal, Theme.Spacing.sm + 2)
        .padding(.vertical, 4)
        .background(Theme.Palette.neutral100)
        .clipShape(Capsule())
    }

    private func physicalStateCard(_ checkin: CheckinEntry) -> some View {
        BloomCard {
            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                Text("🏃 \(Strings.CheckIn.physicalState)")
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)

                HStack(alignment: .top, spacing: Theme.Spacing.md) {
                    stateItem(
                        emoji: "😴",
                        label: Strings.CheckIn.sleep,
                        badge: Strings.CheckIn.sleepLabel(checkin.sleepQuality),
                        color: Theme.Palette.info
                    )
                    stateItem(
                        emoji: "🍽️",
                        label: Strings.CheckIn.hunger,
                        badge: Strings.CheckIn.hungerLabel(checkin.hungerLevel),
                        color: Theme.Palette.accent500
                    )
                    if let phase = checkin.cyclePhase, phase != .noAplica {
                        stateItem(
                            emoji: "🌙",
                            label: Strings.CheckIn.cycle,
                            badge: Strings.CheckIn.cycleLabel(phase),
                            color: Theme.Palette.primary300
                        )
                    }
                }
            }
        }
    }

    private func stateItem(emoji: String, label: String, badge: String, color: Color) -> some View {
        VStack(spacing: Theme.Spacing.xs) {
            Text(emoji)
                .font(.system(size: 24))
            Text(label)
                .font(.caption)
                .foregroundStyle(Theme.Palette.neutral400)
                .multilineTextAlignment(.center)
            Badge(label: badge, color: color)
        }
        .frame(maxWidth: .infinity)
    }

    private func eventsCard(_ checkin: CheckinEntry) -> some View {
        BloomCard {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text("📌 \(Strings.CheckIn.events)")
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)
                    .padding(.bottom, Theme.Spacing.xs)

                ForEach(checkin.events.indices, id: \.self) { index in
                    let event = checkin.events[index]
                    HStack(alignment: .top, spacing: Theme.Spacing.sm) {
                        Circle()
                            .fill(Theme.Palette.primary400)
                            .frame(width: 8, height: 8)
                            .padding(.top, 6)
                        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                            Text(event.title)
                                .font(.bodyBold)
                                .foregroundStyle(Theme.Palette.neutral700)
                            if !event.description.isEmpty {
                                Text(event.description)
                                    .font(.bodyText)
                                    .foregroundStyle(Theme.Palette.neutral500)
                            }
                        }
                        Spacer()
                    }
                    .padding(.vertical, Theme.Spacing.xs)
                    if index < checkin.events.count - 1 {
                        Rectangle()
                            .fill(Theme.Palette.neutral100)
                            .frame(height: 1)
                    }
                }
            }
        }
    }

    private func notesCard(_ checkin: CheckinEntry) -> some View {
        BloomCard {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text("✏️ \(Strings.CheckIn.notes)")
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)
                Text(checkin.notes)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral600)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(Theme.Spacing.md)
                    .background(Theme.Palette.neutral50)
                    .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
            }
        }
    }

    private func reflectionCard(_ reflection: String) -> some View {
        BloomCard {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text("🌿 \(Strings.CheckIn.reflectionLabel)")
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)
                Text(reflection)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral600)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(Theme.Spacing.md)
                    .background(Theme.Palette.neutral50)
                    .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
            }
        }
    }

    private var notFound: some View {
        VStack(spacing: Theme.Spacing.md) {
            Text("🔍")
                .font(.system(size: 48))
            Text(Strings.CheckIn.notFound)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
            BloomButton(title: Strings.Common.back, variant: .outline) {
                dismiss()
            }
            .fixedSize()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.Palette.background)
    }

    // MARK: - Datos

    private func load() async {
        guard let userID = ownerID ?? auth.currentUserID else {
            isLoading = false
            return
        }
        do {
            checkin = try await firestore.checkin(id: id, userID: userID)
        } catch {
            checkin = nil
        }
        isLoading = false
    }

    private func delete() {
        guard let userID = auth.currentUserID else { return }
        Task {
            do {
                try await firestore.delete(checkinID: id, userID: userID)
                onChanged()
                dismiss()
                await WidgetSyncService.refreshFromFirestore(firestore, userID: userID)
            } catch {
                // Si falla el borrado, se mantiene la pantalla abierta.
            }
        }
    }
}
