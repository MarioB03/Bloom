import SwiftUI

/// Tarjeta de una entrada de gratitud en el listado del diario.
/// Portado de `GratitudeJournalCard` en `app/agenda.tsx`.
///
/// Muestra los motivos en línea, así que no necesita navegar a un detalle.
struct GratitudeCard: View {

    let entry: GratitudeEntry

    var body: some View {
        HStack(spacing: 0) {
            Rectangle()
                .fill(Theme.Palette.accent400)
                .frame(width: 3)

            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                header
                ForEach(Array(entry.items.enumerated()), id: \.offset) { index, item in
                    Text("\(index + 1). \(item)")
                        .font(.bodyText)
                        .foregroundStyle(Theme.Palette.neutral600)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(Theme.Spacing.md)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.Palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.lg)
                .strokeBorder(Theme.Palette.accent100, lineWidth: 1)
        )
    }

    private var header: some View {
        HStack(spacing: Theme.Spacing.xs) {
            Text("🙏")
                .font(.system(size: 18))
            Text(Strings.Agenda.gratitudeLabel)
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.accent500)
            Spacer()
            Text(BloomDate.time(entry.createdAt))
                .font(.caption)
                .foregroundStyle(Theme.Palette.neutral400)
        }
    }
}
