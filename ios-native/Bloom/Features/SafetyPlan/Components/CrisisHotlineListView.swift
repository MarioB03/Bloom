import SwiftUI

/// Listado de solo lectura de líneas de crisis, agrupadas por país. Cada fila
/// se puede llamar tras una confirmación.
/// Portado de `src/components/safetyPlan/CrisisHotlineList.tsx`.
struct CrisisHotlineListView: View {

    @Environment(\.openURL) private var openURL

    @State private var hotlineToCall: CrisisHotline?

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            ForEach(CrisisHotlineCatalog.groupedByCountry, id: \.country) { group in
                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    Text("\(group.hotlines.first?.emoji ?? "") \(group.country)")
                        .font(.bodyBold)
                        .foregroundStyle(Theme.Palette.neutral600)
                    ForEach(group.hotlines) { hotline in
                        hotlineRow(hotline)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .alert(
            Strings.SafetyPlan.callConfirmTitle,
            isPresented: callAlertPresented,
            presenting: hotlineToCall
        ) { hotline in
            Button(Strings.Common.cancel, role: .cancel) {}
            Button(Strings.SafetyPlan.call) { call(hotline) }
        } message: { hotline in
            Text(Strings.SafetyPlan.callConfirmMessage(hotline.name))
        }
    }

    private func hotlineRow(_ hotline: CrisisHotline) -> some View {
        Button {
            hotlineToCall = hotline
        } label: {
            HStack(spacing: Theme.Spacing.sm) {
                VStack(alignment: .leading, spacing: 1) {
                    Text(hotline.name)
                        .font(.bodyText)
                        .foregroundStyle(Theme.Palette.neutral700)
                    Text(hotline.phone)
                        .font(.caption)
                        .foregroundStyle(Theme.Palette.neutral400)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Image(systemName: "phone.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.Palette.secondary500)
                    .frame(width: 32, height: 32)
                    .background(Theme.Palette.secondary100)
                    .clipShape(Circle())
            }
            .padding(.vertical, Theme.Spacing.sm)
            .padding(.horizontal, Theme.Spacing.md)
            .background(Theme.Palette.neutral50)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
        }
        .buttonStyle(.plain)
    }

    private var callAlertPresented: Binding<Bool> {
        Binding(
            get: { hotlineToCall != nil },
            set: { if !$0 { hotlineToCall = nil } }
        )
    }

    private func call(_ hotline: CrisisHotline) {
        guard let url = URL(string: "tel:\(hotline.phone)") else { return }
        openURL(url)
    }
}
