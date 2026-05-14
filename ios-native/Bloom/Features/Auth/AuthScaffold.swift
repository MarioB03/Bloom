import SwiftUI

/// Estructura visual común de las pantallas de autenticación:
/// fondo en degradado, logo flotante, cabecera y entrada escalonada de los
/// elementos. Portado de la composición repetida en `app/(auth)/*.tsx`.
struct AuthScaffold<Content: View, Links: View>: View {

    let gradientColors: [Color]
    let logoEmoji: String
    let logoBackground: Color
    var logoShadow: Theme.Shadow = .warm
    let title: String
    let subtitle: String
    var scrollable = false
    @ViewBuilder var content: () -> Content
    @ViewBuilder var links: () -> Links

    @State private var logoIn = false
    @State private var titleIn = false
    @State private var contentIn = false
    @State private var linksIn = false
    @State private var floating = false

    var body: some View {
        ZStack {
            LinearGradient(colors: gradientColors, startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()

            if scrollable {
                ScrollView(showsIndicators: false) {
                    inner.padding(.vertical, Theme.Spacing.xl)
                }
                .scrollDismissesKeyboard(.interactively)
            } else {
                inner
            }
        }
        .onAppear(perform: animateIn)
    }

    private var inner: some View {
        VStack(spacing: 0) {
            header
                .padding(.bottom, Theme.Spacing.xl)

            content()
                .opacity(contentIn ? 1 : 0)

            links()
                .opacity(linksIn ? 1 : 0)
                .padding(.top, Theme.Spacing.lg)
        }
        .padding(.horizontal, Theme.Spacing.lg)
        .frame(maxWidth: .infinity)
    }

    private var header: some View {
        VStack(spacing: Theme.Spacing.md) {
            Text(logoEmoji)
                .font(.system(size: 42))
                .frame(width: 84, height: 84)
                .background(logoBackground)
                .clipShape(RoundedRectangle(cornerRadius: 28))
                .bloomShadow(logoShadow)
                .scaleEffect(logoIn ? 1 : 0)
                .offset(y: floating ? -6 : 6)

            VStack(spacing: Theme.Spacing.xs) {
                Text(title)
                    .font(.displayLarge)
                    .foregroundStyle(Theme.Palette.neutral800)
                    .kerning(1)
                Text(subtitle)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral500)
            }
            .multilineTextAlignment(.center)
            .opacity(titleIn ? 1 : 0)
        }
    }

    private func animateIn() {
        withAnimation(.spring(response: 0.6, dampingFraction: 0.55).delay(0.2)) {
            logoIn = true
        }
        withAnimation(.easeOut(duration: 0.5).delay(0.5)) {
            titleIn = true
        }
        withAnimation(.easeOut(duration: 0.5).delay(0.7)) {
            contentIn = true
        }
        withAnimation(.easeOut(duration: 0.4).delay(0.9)) {
            linksIn = true
        }
        withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true).delay(1.2)) {
            floating = true
        }
    }
}

extension View {

    /// Tarjeta blanca con sombra para los formularios de autenticación.
    func authFormCard() -> some View {
        self
            .padding(Theme.Spacing.lg)
            .background(Theme.Palette.surface)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
            .bloomShadow(.lg)
    }

    /// Muestra una alerta de error cuando `message` no es `nil`.
    func errorAlert(_ message: Binding<String?>) -> some View {
        alert(
            "Error",
            isPresented: Binding(
                get: { message.wrappedValue != nil },
                set: { if !$0 { message.wrappedValue = nil } }
            ),
            presenting: message.wrappedValue
        ) { _ in
            Button("OK", role: .cancel) {}
        } message: { text in
            Text(text)
        }
    }
}
