import SwiftUI
import StoreKit

/// Paywall + canje de código de regalo. Portado de `app/premium.tsx` con
/// StoreKit 2 en vez de RevenueCat (la app RN sí usa RC; aquí divergimos).
struct PremiumView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore
    @Environment(PremiumService.self) private var premium
    @Environment(\.dismiss) private var dismiss

    enum Plan { case annual, monthly }

    @State private var selectedPlan: Plan = .annual
    @State private var code: String = ""
    @State private var purchasing = false
    @State private var redeeming = false
    @State private var restoring = false
    @State private var errorMessage: String?
    @State private var successMessage: String?
    @State private var successTitle: String = ""

    var body: some View {
        Group {
            if premium.isPremium {
                activeContent
            } else {
                paywallContent
            }
        }
        .navigationTitle(Strings.Premium.title)
        .navigationBarTitleDisplayMode(.inline)
        .task { await premium.loadProducts() }
        .errorAlert($errorMessage)
        .alert(
            successTitle,
            isPresented: Binding(
                get: { successMessage != nil },
                set: { if !$0 { successMessage = nil } }
            ),
            presenting: successMessage
        ) { _ in
            Button("OK", role: .cancel) { dismiss() }
        } message: { message in
            Text(message)
        }
    }

    // MARK: - Estado activo

    private var activeContent: some View {
        ScreenWrapper {
            VStack(spacing: Theme.Spacing.md) {
                Text(Strings.Premium.activeEmoji)
                    .font(.system(size: 56))

                Text(Strings.Premium.activeTitle)
                    .font(.displaySmall)
                    .foregroundStyle(Theme.Palette.accent500)

                Text(Strings.Premium.activeDesc)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral500)

                if premium.status?.source == .subscription {
                    Text(Strings.Premium.managedByStore)
                        .font(.smallText)
                        .foregroundStyle(Theme.Palette.neutral400)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, Theme.Spacing.lg)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.top, Theme.Spacing.xl)

            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                ForEach(Self.features, id: \.title) { feature in
                    HStack(spacing: Theme.Spacing.sm) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(Theme.Palette.success)
                        Text(feature.title)
                            .font(.bodyBold)
                            .foregroundStyle(Theme.Palette.neutral600)
                    }
                }
            }
            .padding(.top, Theme.Spacing.lg)
        }
    }

    // MARK: - Paywall

    private var paywallContent: some View {
        ScreenWrapper {
            hero
            featureList
            pricingSection
            giftCodeSection
        }
    }

    private var hero: some View {
        VStack(spacing: Theme.Spacing.sm) {
            Text(Strings.Premium.heroEmoji)
                .font(.system(size: 48))
            Text(Strings.Premium.title)
                .font(.displaySmall)
                .foregroundStyle(Theme.Palette.accent500)
            Text(Strings.Premium.heroDesc)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .padding(.horizontal, Theme.Spacing.md)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, Theme.Spacing.md)
    }

    private var featureList: some View {
        VStack(spacing: Theme.Spacing.sm) {
            ForEach(Self.features, id: \.title) { feature in
                HStack(spacing: Theme.Spacing.md) {
                    Text(feature.emoji)
                        .font(.system(size: 28))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(feature.title)
                            .font(.bodyBold)
                            .foregroundStyle(Theme.Palette.neutral700)
                        Text(feature.desc)
                            .font(.smallText)
                            .foregroundStyle(Theme.Palette.neutral400)
                    }
                    Spacer()
                }
                .padding(Theme.Spacing.md)
                .background(Theme.Palette.surface)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.Radius.lg)
                        .strokeBorder(Theme.Palette.neutral100, lineWidth: 1)
                )
                .bloomShadow(.sm)
            }
        }
        .padding(.top, Theme.Spacing.md)
    }

    @ViewBuilder
    private var pricingSection: some View {
        VStack(spacing: Theme.Spacing.md) {
            if premium.isLoadingProducts {
                ProgressView()
                    .tint(Theme.Palette.primary500)
                    .padding(.vertical, Theme.Spacing.lg)
            } else if premium.products.isEmpty {
                Text(Strings.Premium.noProductsAvailable)
                    .font(.smallText)
                    .foregroundStyle(Theme.Palette.neutral400)
                    .multilineTextAlignment(.center)
                    .padding(.vertical, Theme.Spacing.md)
            } else {
                HStack(spacing: Theme.Spacing.sm) {
                    if let annual = premium.annualProduct {
                        PlanCard(
                            label: Strings.Premium.annualLabel,
                            price: annual.displayPrice,
                            period: Strings.Premium.perYear,
                            saveBadge: Strings.Premium.annualSave,
                            popular: true,
                            selected: selectedPlan == .annual
                        ) {
                            selectedPlan = .annual
                        }
                    }
                    if let monthly = premium.monthlyProduct {
                        PlanCard(
                            label: Strings.Premium.monthlyLabel,
                            price: monthly.displayPrice,
                            period: Strings.Premium.perMonth,
                            saveBadge: nil,
                            popular: false,
                            selected: selectedPlan == .monthly
                        ) {
                            selectedPlan = .monthly
                        }
                    }
                }

                if currentProduct?.subscription?.introductoryOffer != nil {
                    HStack(spacing: 6) {
                        Image(systemName: "gift")
                            .font(.system(size: 14))
                        Text(Strings.Premium.freeTrial)
                            .font(.bodyBold)
                    }
                    .foregroundStyle(Theme.Palette.primary500)
                }

                BloomButton(
                    title: purchasing ? Strings.Premium.subscribing : Strings.Premium.subscribe,
                    size: .lg,
                    loading: purchasing,
                    isEnabled: currentProduct != nil
                ) {
                    Task { await performPurchase() }
                }

                Text(Strings.Premium.finePrint)
                    .font(.smallText)
                    .foregroundStyle(Theme.Palette.neutral400)
                    .multilineTextAlignment(.center)
                    .lineSpacing(2)

                Button {
                    Task { await performRestore() }
                } label: {
                    Text(restoring ? Strings.Premium.restoring : Strings.Premium.restore)
                        .font(.caption)
                        .foregroundStyle(Theme.Palette.neutral500)
                        .underline()
                }
                .disabled(restoring)
            }
        }
        .padding(.top, Theme.Spacing.lg)
    }

    private var giftCodeSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack(spacing: Theme.Spacing.sm) {
                Rectangle().fill(Theme.Palette.neutral200).frame(height: 1)
                Text("o")
                    .font(.smallText)
                    .foregroundStyle(Theme.Palette.neutral400)
                Rectangle().fill(Theme.Palette.neutral200).frame(height: 1)
            }
            .padding(.vertical, Theme.Spacing.md)

            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text(Strings.Premium.giftLabel)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)

                HStack(spacing: Theme.Spacing.sm) {
                    TextField(Strings.Premium.giftCodePlaceholder, text: $code)
                        .font(.custom("DMSans-Bold", size: 18))
                        .kerning(4)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(Theme.Palette.neutral800)
                        .tint(Theme.Palette.primary400)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        .padding(.horizontal, Theme.Spacing.md)
                        .padding(.vertical, Theme.Spacing.sm + 2)
                        .background(Theme.Palette.surface)
                        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.Radius.md)
                                .strokeBorder(Theme.Palette.neutral200, lineWidth: 1)
                        )
                        .onChange(of: code) { _, newValue in
                            let trimmed = String(newValue.uppercased().prefix(6))
                            if trimmed != newValue { code = trimmed }
                        }

                    BloomButton(
                        title: redeeming ? Strings.Premium.redeeming : Strings.Premium.redeem,
                        size: .md,
                        loading: redeeming,
                        isEnabled: code.count >= 6
                    ) {
                        Task { await performRedeem() }
                    }
                    .frame(maxWidth: 110)
                }
            }
            .padding(Theme.Spacing.lg)
            .background(Theme.Palette.accent50)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.xl)
                    .strokeBorder(Theme.Palette.accent100, lineWidth: 1)
            )
        }
        .padding(.bottom, Theme.Spacing.xl)
    }

    // MARK: - Acciones

    private var currentProduct: Product? {
        switch selectedPlan {
        case .annual: return premium.annualProduct
        case .monthly: return premium.monthlyProduct
        }
    }

    private func performPurchase() async {
        guard let product = currentProduct else { return }
        purchasing = true
        defer { purchasing = false }
        do {
            try await premium.purchase(
                product,
                userID: auth.currentUserID,
                firestore: firestore
            )
            successTitle = Strings.Premium.successTitle
            successMessage = Strings.Premium.successMessage
        } catch PremiumService.PurchaseError.userCancelled {
            // Cancelado por el usuario: no informar.
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func performRestore() async {
        restoring = true
        defer { restoring = false }
        do {
            try await premium.restore(
                userID: auth.currentUserID,
                firestore: firestore
            )
            if premium.isPremium {
                successTitle = Strings.Premium.restoreSuccess
                successMessage = Strings.Premium.successMessage
            } else {
                errorMessage = Strings.Premium.errorRestore
            }
        } catch {
            errorMessage = Strings.Premium.errorRestore
        }
    }

    private func performRedeem() async {
        guard let userID = auth.currentUserID, code.count >= 6 else { return }
        redeeming = true
        defer { redeeming = false }
        do {
            try await premium.redeemGiftCode(code, userID: userID, firestore: firestore)
            code = ""
            successTitle = Strings.Premium.successRedeemed
            successMessage = Strings.Premium.successRedeemedMessage
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Catálogo de features (estático)

    private struct Feature {
        let emoji: String
        let title: String
        let desc: String
    }

    private static let features: [Feature] = [
        Feature(emoji: "📤", title: Strings.Premium.featureExport, desc: Strings.Premium.featureExportDesc),
        Feature(emoji: "👥", title: Strings.Premium.featureShare, desc: Strings.Premium.featureShareDesc),
        Feature(emoji: "🏪", title: Strings.Premium.featureGarden, desc: Strings.Premium.featureGardenDesc),
        Feature(emoji: "📊", title: Strings.Premium.featureInsights, desc: Strings.Premium.featureInsightsDesc),
    ]
}

/// Tarjeta de plan en el paywall. Muestra precio, periodo, etiqueta de
/// "Popular" en el plan anual y un badge de ahorro.
private struct PlanCard: View {
    let label: String
    let price: String
    let period: String
    let saveBadge: String?
    let popular: Bool
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: Theme.Spacing.xs) {
                Text(label)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral600)

                Text(price)
                    .font(.custom("DMSans-Bold", size: 22))
                    .foregroundStyle(Theme.Palette.neutral800)

                Text(period)
                    .font(.smallText)
                    .foregroundStyle(Theme.Palette.neutral400)

                if let saveBadge {
                    Text(saveBadge)
                        .font(.tag)
                        .foregroundStyle(Theme.Palette.success)
                        .padding(.horizontal, Theme.Spacing.sm)
                        .padding(.vertical, 2)
                        .background(Theme.Palette.success.opacity(0.15))
                        .clipShape(Capsule())
                        .padding(.top, Theme.Spacing.xs)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(Theme.Spacing.md)
            .padding(.top, Theme.Spacing.sm)
            .background(selected ? Theme.Palette.primary50 : Theme.Palette.surface)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.xl)
                    .strokeBorder(
                        selected ? Theme.Palette.primary500 : Theme.Palette.neutral200,
                        lineWidth: 2
                    )
            )
            .overlay(alignment: .top) {
                if popular {
                    Text(Strings.Premium.popular.uppercased())
                        .font(.tag)
                        .kerning(0.5)
                        .foregroundStyle(.white)
                        .padding(.horizontal, Theme.Spacing.sm)
                        .padding(.vertical, 3)
                        .background(Theme.Palette.primary500)
                        .clipShape(Capsule())
                        .offset(y: -10)
                }
            }
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.impact(weight: .light), trigger: selected)
    }
}

#Preview {
    NavigationStack {
        PremiumView()
            .environment(AuthService())
            .environment(FirestoreService())
            .environment(PremiumService())
    }
}
