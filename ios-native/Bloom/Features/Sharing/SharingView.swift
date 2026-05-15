import SwiftUI
import FirebaseAuth

/// Pantalla de compartir cuenta. Equivalente de `app/perfil.tsx` en la app
/// React Native (cuyo nombre era engañoso: el archivo "perfil" en RN es esta
/// pantalla, no la pestaña del perfil).
///
/// Permite generar un código de invitación (24 h de validez) y canjear el de
/// otra persona para acceder en solo lectura. Las dos acciones requieren
/// Premium; si el usuario no lo tiene, la operación queda bloqueada con un
/// aviso, igual que en RN. El catálogo de Premium de RN se gestiona contra
/// RevenueCat, aquí contra StoreKit 2 — la lógica de gating es la misma.
struct SharingView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore
    @Environment(SharingService.self) private var sharing
    @Environment(PremiumService.self) private var premium
    @Environment(GenderService.self) private var gender

    @State private var activeCode: SharingCode?
    @State private var generatingCode = false
    @State private var codeInput = ""
    @State private var redeeming = false
    @State private var showRevokeConfirm = false
    @State private var showPremiumAlert = false
    @State private var infoMessage: String?
    @State private var errorMessage: String?

    var body: some View {
        ScreenWrapper {
            subtitle
            generateCard
            redeemCard
            viewerCard
            sharedAccountCard
        }
        .navigationTitle(Strings.Sharing.title)
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadActiveCode() }
        .alert(Strings.Sharing.premiumAlertTitle, isPresented: $showPremiumAlert) {
            Button(Strings.Common.close, role: .cancel) {}
        } message: {
            Text(Strings.Sharing.premiumAlertMessage)
        }
        .alert(Strings.Sharing.revokeConfirmTitle, isPresented: $showRevokeConfirm) {
            Button(Strings.Sharing.revokeAccess, role: .destructive) {
                Task { await revoke() }
            }
            Button(Strings.Common.cancel, role: .cancel) {}
        } message: {
            Text(gender.resolve(Strings.Sharing.revokeConfirmMessage))
        }
        .alert("", isPresented: Binding(
            get: { infoMessage != nil },
            set: { if !$0 { infoMessage = nil } }
        )) {
            Button(Strings.Common.close, role: .cancel) {}
        } message: {
            Text(infoMessage ?? "")
        }
        .errorAlert($errorMessage)
    }

    // MARK: - Secciones

    private var subtitle: some View {
        Text(Strings.Sharing.subtitle)
            .font(.bodyText)
            .foregroundStyle(Theme.Palette.neutral500)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var generateCard: some View {
        BloomCard {
            HStack {
                Text(Strings.Sharing.generateSection)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)
                Spacer()
                if !premium.isPremium {
                    Badge(label: Strings.Premium.activeBadge, color: Theme.Palette.accent500)
                }
            }
            .padding(.bottom, Theme.Spacing.md)

            if let code = activeCode {
                activeCodeView(code)
            } else {
                generateCodeButton
            }
        }
    }

    private var generateCodeButton: some View {
        Button {
            guard premium.isPremium else {
                showPremiumAlert = true
                return
            }
            Task { await generateCode() }
        } label: {
            HStack(spacing: Theme.Spacing.sm) {
                iconBadge(systemName: "key.fill", tint: Theme.Palette.primary400)
                VStack(alignment: .leading, spacing: 1) {
                    Text(Strings.Sharing.generateCode)
                        .font(.bodyText)
                        .foregroundStyle(Theme.Palette.neutral700)
                    Text(Strings.Sharing.codeExpiry)
                        .font(.smallText)
                        .foregroundStyle(Theme.Palette.neutral400)
                }
                Spacer()
                if generatingCode {
                    ProgressView().tint(Theme.Palette.neutral300)
                } else {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.Palette.neutral300)
                }
            }
            .padding(.vertical, Theme.Spacing.sm)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(generatingCode)
    }

    private func activeCodeView(_ code: SharingCode) -> some View {
        VStack(spacing: Theme.Spacing.sm) {
            Button {
                UIPasteboard.general.string = code.code
                infoMessage = Strings.Sharing.codeCopied
            } label: {
                HStack(spacing: Theme.Spacing.sm) {
                    Text(code.code)
                        .font(.custom("DMSans-Bold", size: 28))
                        .tracking(6)
                        .foregroundStyle(Theme.Palette.primary500)
                    Image(systemName: "doc.on.doc")
                        .font(.system(size: 18))
                        .foregroundStyle(Theme.Palette.primary400)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, Theme.Spacing.md)
                .padding(.horizontal, Theme.Spacing.lg)
                .background(Theme.Palette.primary50)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.Radius.md)
                        .strokeBorder(Theme.Palette.primary100, style: StrokeStyle(lineWidth: 1, dash: [4]))
                )
            }
            .buttonStyle(.plain)
            .sensoryFeedback(.success, trigger: infoMessage == Strings.Sharing.codeCopied)

            Text(expiryText(for: code))
                .font(.smallText)
                .foregroundStyle(Theme.Palette.neutral400)
        }
    }

    /// Texto descriptivo del tiempo restante hasta la caducidad del código.
    /// "Caduca en 23 h" / "Caduca en 12 min" — corto y legible.
    private func expiryText(for code: SharingCode) -> String {
        let remaining = code.expiresAt.timeIntervalSinceNow
        guard remaining > 0 else { return Strings.Sharing.codeExpired }
        let minutes = Int(remaining / 60)
        if minutes >= 60 {
            return "Caduca en \(minutes / 60) h"
        }
        return "Caduca en \(max(minutes, 1)) min"
    }

    private var redeemCard: some View {
        BloomCard {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text(Strings.Sharing.enterSection)
                    .font(.bodyBold)
                    .foregroundStyle(Theme.Palette.neutral700)
                Text(Strings.Sharing.enterCodeHint)
                    .font(.smallText)
                    .foregroundStyle(Theme.Palette.neutral400)

                HStack(spacing: Theme.Spacing.sm) {
                    TextField(Strings.Sharing.enterCodePlaceholder, text: $codeInput)
                        .font(.custom("DMSans-Bold", size: 18))
                        .tracking(4)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(Theme.Palette.neutral700)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled(true)
                        .onChange(of: codeInput) { _, newValue in
                            let upper = String(newValue.uppercased().prefix(6))
                            if upper != codeInput { codeInput = upper }
                        }
                        .disabled(!premium.isPremium)
                        .padding(.vertical, Theme.Spacing.sm)
                        .padding(.horizontal, Theme.Spacing.md)
                        .background(Theme.Palette.neutral50)
                        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.Radius.md)
                                .strokeBorder(Theme.Palette.neutral200, lineWidth: 1)
                        )

                    BloomButton(
                        title: redeeming ? Strings.Sharing.linking : Strings.Sharing.link,
                        size: .sm,
                        loading: redeeming,
                        isEnabled: premium.isPremium && codeInput.count == 6
                    ) {
                        guard premium.isPremium else {
                            showPremiumAlert = true
                            return
                        }
                        Task { await redeem() }
                    }
                    .fixedSize(horizontal: true, vertical: false)
                }
            }
        }
    }

    private var viewerCard: some View {
        BloomCard {
            Text(Strings.Sharing.viewerSection)
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.neutral700)
                .padding(.bottom, Theme.Spacing.md)

            if let viewer = sharing.viewer {
                HStack {
                    linkedUser(name: viewer.viewerDisplayName, background: Theme.Palette.primary400)
                    Spacer()
                    Button {
                        showRevokeConfirm = true
                    } label: {
                        Image(systemName: "xmark.circle")
                            .font(.system(size: 22))
                            .foregroundStyle(Theme.Palette.error)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(Strings.Sharing.revokeAccess)
                }
            } else {
                Text(Strings.Sharing.noViewer)
                    .font(.smallText)
                    .foregroundStyle(Theme.Palette.neutral400)
            }
        }
    }

    private var sharedAccountCard: some View {
        BloomCard {
            Text(Strings.Sharing.sharedWithSection)
                .font(.bodyBold)
                .foregroundStyle(Theme.Palette.neutral700)
                .padding(.bottom, Theme.Spacing.md)

            if let shared = sharing.sharedAccount {
                HStack {
                    linkedUser(name: shared.ownerDisplayName, background: Theme.Palette.secondary400)
                    Spacer()
                    Badge(label: Strings.Sharing.readOnly, color: Theme.Palette.info)
                }
            } else {
                Text(Strings.Sharing.noShared)
                    .font(.smallText)
                    .foregroundStyle(Theme.Palette.neutral400)
            }
        }
    }

    // MARK: - Sub-vistas

    private func linkedUser(name: String, background: Color) -> some View {
        HStack(spacing: Theme.Spacing.sm) {
            ZStack {
                Circle().fill(background).frame(width: 32, height: 32)
                Text(name.first.map { String($0).uppercased() } ?? "?")
                    .font(.custom("DMSans-Bold", size: 14))
                    .foregroundStyle(Theme.Palette.neutral50)
            }
            Text(name)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral700)
        }
    }

    private func iconBadge(systemName: String, tint: Color) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 10)
                .fill(tint.opacity(0.12))
                .frame(width: 34, height: 34)
            Image(systemName: systemName)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(tint)
        }
    }

    // MARK: - Acciones

    private func loadActiveCode() async {
        guard let userID = auth.currentUserID else { return }
        activeCode = try? await firestore.activeSharingCode(forOwner: userID)
    }

    private func generateCode() async {
        guard let userID = auth.currentUserID else { return }
        generatingCode = true
        defer { generatingCode = false }
        do {
            _ = try await firestore.createSharingCode(
                userID: userID,
                displayName: displayName
            )
            // Recarga para obtener `createdAt` y `expiresAt` reales del
            // servidor en lugar de reconstruirlos en cliente.
            await loadActiveCode()
        } catch {
            errorMessage = Strings.Sharing.errorGeneric
        }
    }

    private func redeem() async {
        guard let userID = auth.currentUserID, codeInput.count == 6 else { return }
        redeeming = true
        defer { redeeming = false }
        do {
            _ = try await firestore.redeemSharingCode(
                codeInput,
                viewerID: userID,
                viewerDisplayName: displayName
            )
            codeInput = ""
            await sharing.refresh(userID: userID, firestore: firestore)
            infoMessage = Strings.Sharing.successLinked
        } catch let sharingError as SharingError {
            if case .alreadyLinked = sharingError {
                errorMessage = gender.resolve(Strings.Sharing.errorAlreadyLinked)
                await sharing.refresh(userID: userID, firestore: firestore)
            } else {
                errorMessage = sharingError.errorDescription
            }
        } catch {
            errorMessage = Strings.Sharing.errorGeneric
        }
    }

    private func revoke() async {
        guard let userID = auth.currentUserID, let viewer = sharing.viewer else { return }
        do {
            try await firestore.revokeAccess(ownerID: userID, viewerID: viewer.viewerId)
            await sharing.refresh(userID: userID, firestore: firestore)
        } catch {
            errorMessage = Strings.Sharing.errorGeneric
        }
    }

    private var displayName: String {
        auth.currentDisplayName ?? Auth.auth().currentUser?.displayName ?? "Usuario"
    }
}

#Preview {
    NavigationStack {
        SharingView()
            .environment(AuthService())
            .environment(FirestoreService())
            .environment(SharingService())
            .environment(PremiumService())
            .environment(GenderService())
    }
}
