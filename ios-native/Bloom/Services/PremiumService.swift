import Foundation
import StoreKit

/// Estado Premium combinado de StoreKit (suscripción) y Firestore (código de
/// regalo). Sustituye a `PremiumContext` + `purchases.ts` de RN, que usaba
/// RevenueCat — aquí vamos directos a App Store con StoreKit 2.
///
/// La suscripción tiene prioridad sobre el código de regalo para la fuente
/// que se muestra al usuario; los dos pueden coexistir y `isPremium` es la
/// disyunción.
///
/// Los Product IDs deben existir en App Store Connect. En el simulador, sin
/// configuración local de StoreKit, `Product.products(for:)` devuelve vacío
/// — el paywall lo soporta y el canje de gift code sigue funcionando.
@Observable
@MainActor
final class PremiumService {

    /// IDs de los productos del App Store. Deben coincidir con los creados
    /// en App Store Connect.
    static let annualProductID = "bloom.premium.annual"
    static let monthlyProductID = "bloom.premium.monthly"
    static let productIDs: [String] = [annualProductID, monthlyProductID]

    enum PurchaseError: LocalizedError {
        case userCancelled
        case pending
        case unverified

        var errorDescription: String? {
            switch self {
            case .userCancelled: return nil
            case .pending: return Strings.Premium.pendingPurchase
            case .unverified: return Strings.Premium.errorPurchase
            }
        }
    }

    private(set) var status: PremiumStatus?
    private(set) var products: [Product] = []
    private(set) var isLoadingProducts = false
    private(set) var hasActiveSubscription = false

    /// Premium activo por cualquiera de las dos vías.
    var isPremium: Bool { status?.isActive ?? false }

    /// Producto anual (si existe en el catálogo).
    var annualProduct: Product? {
        products.first(where: { $0.id == Self.annualProductID })
    }

    /// Producto mensual (si existe en el catálogo).
    var monthlyProduct: Product? {
        products.first(where: { $0.id == Self.monthlyProductID })
    }

    /// Listener de transacciones que vive toda la vida de la app —el servicio
    /// se crea una sola vez en `BloomApp` y nunca se desasigna—, así que no
    /// se retira (mismo criterio que el listener de sesión en `AuthService`).
    private var transactionListener: Task<Void, Never>?

    init() {
        transactionListener = listenForTransactions()
    }

    // MARK: - Carga de productos

    /// Pide los productos al App Store. Si ya están cargados, no recarga.
    func loadProducts() async {
        guard products.isEmpty else { return }
        isLoadingProducts = true
        defer { isLoadingProducts = false }
        do {
            let loaded = try await Product.products(for: Self.productIDs)
            products = loaded.sorted { lhs, rhs in
                // Anual primero, mensual después.
                let lhsAnnual = lhs.id == Self.annualProductID
                let rhsAnnual = rhs.id == Self.annualProductID
                if lhsAnnual != rhsAnnual { return lhsAnnual }
                return lhs.id < rhs.id
            }
        } catch {
            products = []
        }
    }

    // MARK: - Compra y restauración

    func purchase(_ product: Product, userID: String?, firestore: FirestoreService) async throws {
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            let transaction = try verify(verification)
            await transaction.finish()
            await refresh(userID: userID, firestore: firestore)
        case .userCancelled:
            throw PurchaseError.userCancelled
        case .pending:
            throw PurchaseError.pending
        @unknown default:
            break
        }
    }

    func restore(userID: String?, firestore: FirestoreService) async throws {
        try await AppStore.sync()
        await refresh(userID: userID, firestore: firestore)
    }

    // MARK: - Refresco de estado

    /// Combina StoreKit (suscripción) con Firestore (código de regalo) y
    /// publica un único `PremiumStatus`. La suscripción tiene prioridad como
    /// fuente que se muestra al usuario.
    func refresh(userID: String?, firestore: FirestoreService) async {
        await refreshSubscription()
        let gift = await loadGiftStatus(userID: userID, firestore: firestore)

        if hasActiveSubscription {
            status = PremiumStatus(
                isActive: true,
                source: .subscription,
                expiresAt: nil,
                giftCode: gift?.giftCode,
                activatedAt: gift?.activatedAt
            )
        } else if let gift, gift.isActive {
            status = PremiumStatus(
                isActive: true,
                source: .giftCode,
                expiresAt: gift.expiresAt,
                giftCode: gift.giftCode,
                activatedAt: gift.activatedAt
            )
        } else {
            status = nil
        }
    }

    private func loadGiftStatus(userID: String?, firestore: FirestoreService) async -> PremiumStatus? {
        guard let userID else { return nil }
        return try? await firestore.userPremiumStatus(userID: userID)
    }

    private func refreshSubscription() async {
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result,
                  Self.productIDs.contains(transaction.productID),
                  transaction.revocationDate == nil else { continue }
            if let expirationDate = transaction.expirationDate, expirationDate < Date() {
                continue
            }
            hasActiveSubscription = true
            return
        }
        hasActiveSubscription = false
    }

    // MARK: - Códigos de regalo

    /// Canjea un código de regalo y refresca el estado.
    func redeemGiftCode(_ code: String, userID: String, firestore: FirestoreService) async throws {
        _ = try await firestore.redeemPremiumCode(code, userID: userID)
        await refresh(userID: userID, firestore: firestore)
    }

    // MARK: - Listener de transacciones

    /// Escucha transacciones que llegan fuera del flujo normal de compra
    /// (renovaciones, compras hechas desde otro dispositivo, etc.).
    private nonisolated func listenForTransactions() -> Task<Void, Never> {
        Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard case .verified(let transaction) = result else { continue }
                await transaction.finish()
                guard let self else { return }
                await self.refreshSubscription()
            }
        }
    }

    private func verify<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified: throw PurchaseError.unverified
        case .verified(let value): return value
        }
    }
}
