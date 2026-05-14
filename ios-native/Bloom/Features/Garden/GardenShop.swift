import SwiftUI

/// Tienda del jardín: compra de decoraciones, mascotas, cosméticos y expansión
/// de terreno con semillas. Equivalente nativo de
/// `src/components/garden/GardenShop.tsx`.
///
/// Se presenta como hoja con una `List` de secciones —una por categoría— en
/// lugar del grid + selector segmentado de la app RN: es el patrón nativo para
/// explorar un catálogo, deja sitio a las descripciones y muestra todas las
/// categorías de un scroll. El saldo vive en el toolbar, siempre visible.
///
/// A diferencia de la app RN, la tienda no está restringida a Premium: esa
/// función aún no se ha portado y limitarla la dejaría inaccesible.
struct GardenShop: View {

    @Bindable var store: GardenStore

    @Environment(\.dismiss) private var dismiss

    @State private var pendingPurchase: ShopItem?
    @State private var showInsufficient = false

    var body: some View {
        NavigationStack {
            List {
                ForEach(ShopCategory.allCases, id: \.self) { category in
                    Section(category.label) {
                        ForEach(GardenEconomy.items(category: category)) { item in
                            row(item)
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background(Theme.Palette.background)
            .navigationTitle(Strings.Shop.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { balanceBadge }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(Strings.Common.done) { dismiss() }
                }
            }
        }
        .presentationDragIndicator(.visible)
        .alert(
            Strings.Shop.confirmTitle,
            isPresented: Binding(
                get: { pendingPurchase != nil },
                set: { if !$0 { pendingPurchase = nil } }
            ),
            presenting: pendingPurchase
        ) { item in
            Button(Strings.Shop.buyButton) {
                store.purchase(itemID: item.id)
                pendingPurchase = nil
            }
            Button(Strings.Common.cancel, role: .cancel) { pendingPurchase = nil }
        } message: { item in
            Text("\(item.emoji) \(item.name)\n\(item.cost) \(Strings.Shop.seedUnit)\n\n\(item.description)")
        }
        .alert(Strings.Shop.insufficientTitle, isPresented: $showInsufficient) {
            Button(Strings.Common.close, role: .cancel) {}
        } message: {
            Text(Strings.Shop.insufficientMessage)
        }
    }

    // MARK: - Saldo

    private var balanceBadge: some View {
        Text("\(store.seedBalance.total) \(Strings.Shop.seedUnit)")
            .font(.system(size: 13, weight: .bold, design: .rounded))
            .foregroundStyle(Theme.Palette.accent600)
            .fixedSize()
            .padding(.horizontal, Theme.Spacing.sm)
            .padding(.vertical, 3)
            .background(Theme.Palette.accent50, in: Capsule())
    }

    // MARK: - Fila de artículo

    private func row(_ item: ShopItem) -> some View {
        let owned = store.purchasedIDs.contains(item.id)
        let canAfford = store.seedBalance.total >= item.cost

        return HStack(spacing: Theme.Spacing.md) {
            Text(item.emoji)
                .font(.system(size: 26))
                .frame(width: 44, height: 44)
                .background(Theme.Palette.accent50, in: RoundedRectangle(cornerRadius: Theme.Radius.sm))

            VStack(alignment: .leading, spacing: 2) {
                Text(item.name)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral800)
                Text(item.description)
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.neutral500)
                    .lineLimit(2)
            }

            Spacer(minLength: Theme.Spacing.sm)

            priceControl(item, owned: owned, canAfford: canAfford)
        }
        .padding(.vertical, 4)
    }

    @ViewBuilder
    private func priceControl(_ item: ShopItem, owned: Bool, canAfford: Bool) -> some View {
        if owned {
            HStack(spacing: 3) {
                Image(systemName: "checkmark.circle.fill")
                Text(Strings.Shop.purchased)
            }
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(Theme.Palette.success)
        } else {
            Button {
                if canAfford {
                    pendingPurchase = item
                } else {
                    showInsufficient = true
                }
            } label: {
                Text("\(item.cost) \(Strings.Shop.seedUnit)")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(canAfford ? Theme.Palette.accent600 : Theme.Palette.neutral400)
                    .padding(.horizontal, Theme.Spacing.sm + 2)
                    .padding(.vertical, 5)
                    .background(
                        canAfford ? Theme.Palette.accent50 : Theme.Palette.neutral100,
                        in: Capsule()
                    )
            }
            .buttonStyle(.plain)
        }
    }
}
