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
/// Igual que en RN, la tienda solo permite comprar con Premium activo: sin él
/// el catálogo es navegable pero los botones de precio abren una alerta que
/// invita a desbloquearlo (con CTA al paywall).
struct GardenShop: View {

    @Bindable var store: GardenStore

    @Environment(\.dismiss) private var dismiss
    @Environment(PremiumService.self) private var premium

    @State private var pendingPurchase: ShopItem?
    @State private var showInsufficient = false
    @State private var showPremiumAlert = false
    @State private var showPaywall = false

    var body: some View {
        NavigationStack {
            List {
                if !premium.isPremium {
                    Section {
                        premiumBanner
                            .listRowInsets(EdgeInsets())
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                    }
                }
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
        .alert(Strings.Shop.premiumAlertTitle, isPresented: $showPremiumAlert) {
            Button(Strings.Shop.premiumAlertGoToPremium) { showPaywall = true }
            Button(Strings.Common.close, role: .cancel) {}
        } message: {
            Text(Strings.Shop.premiumAlertMessage)
        }
        .sheet(isPresented: $showPaywall) {
            NavigationStack { PremiumView() }
        }
    }

    // MARK: - Banner Premium

    /// Banner que avisa de que se necesita Premium para comprar. Solo aparece
    /// cuando el usuario no es Premium. Equivalente al `premiumBanner` de
    /// `GardenShop.tsx`.
    private var premiumBanner: some View {
        Button {
            showPaywall = true
        } label: {
            HStack(spacing: Theme.Spacing.sm) {
                Text(Strings.Shop.premiumBanner)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.accent600)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Theme.Palette.accent500)
            }
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.vertical, Theme.Spacing.sm + 2)
            .background(Theme.Palette.accent50)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.md)
                    .strokeBorder(Theme.Palette.accent100, lineWidth: 1)
            )
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.top, Theme.Spacing.sm)
        }
        .buttonStyle(.plain)
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
            shopIcon(for: item)
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

    /// Resuelve el icono botánico de un artículo de la tienda. La expansión
    /// de terreno no tiene SVG dedicada (no es un objeto colocable) y se
    /// dibuja con un SF Symbol acorde.
    @ViewBuilder
    private func shopIcon(for item: ShopItem) -> some View {
        switch item.category {
        case .decorations:
            BloomIconView(.decoration(id: item.id), size: 32)
        case .pets:
            BloomIconView(.pet(id: item.id), size: 32)
        case .cosmetics:
            BloomIconView(.cosmetic(id: item.id), size: 32)
        case .terrain:
            Image(systemName: "map.fill")
                .font(.system(size: 22, weight: .regular))
                .foregroundStyle(Theme.Palette.accent500)
        }
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
                if !premium.isPremium {
                    showPremiumAlert = true
                } else if canAfford {
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
