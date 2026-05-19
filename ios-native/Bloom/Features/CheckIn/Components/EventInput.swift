import SwiftUI

/// Editor de la lista de eventos importantes de un check-in.
/// Portado de `src/components/checkin/EventInput.tsx`.
struct EventInput: View {

    @Binding var events: [ImportantEvent]

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text(Strings.CheckIn.events)
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.neutral700)

            ForEach(events.indices, id: \.self) { index in
                eventCard(index)
            }

            Button {
                events.append(ImportantEvent(title: "", description: ""))
            } label: {
                HStack(spacing: Theme.Spacing.xs) {
                    Image(systemName: "plus.circle")
                    Text(Strings.CheckIn.addEvent)
                }
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.primary500)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Theme.Spacing.sm)
            }
            .buttonStyle(.plain)
        }
    }

    private func eventCard(_ index: Int) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack {
                Text("\(Strings.CheckIn.event) \(index + 1)")
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.neutral500)
                Spacer()
                Button {
                    events.remove(at: index)
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(Theme.Palette.neutral400)
                }
                .buttonStyle(.plain)
            }

            TextField(Strings.CheckIn.eventTitle, text: $events[index].title)
                .font(.bodyText)
                .padding(Theme.Spacing.sm)
                .background(Theme.Palette.surface)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.sm))
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.Radius.sm)
                        .strokeBorder(Theme.Palette.neutral200, lineWidth: 1)
                )

            TextField(
                Strings.CheckIn.eventDescription,
                text: $events[index].description,
                axis: .vertical
            )
            .font(.bodyText)
            .lineLimit(3, reservesSpace: true)
            .padding(Theme.Spacing.sm)
            .background(Theme.Palette.surface)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.sm))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.sm)
                    .strokeBorder(Theme.Palette.neutral200, lineWidth: 1)
            )
        }
        .padding(Theme.Spacing.md)
        .background(Theme.Palette.neutral50)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
    }
}
