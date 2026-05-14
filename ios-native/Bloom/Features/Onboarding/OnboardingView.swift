import SwiftUI

/// Carrusel de bienvenida de 3 diapositivas, mostrado una sola vez antes del
/// login. Portado de `app/onboarding.tsx` de la app React Native.
///
/// El walkthrough de coach-marks (`WalkthroughOverlay` en RN) no se porta:
/// estaba desactivado en la app React Native ("Walkthrough disabled for now").
struct OnboardingView: View {

    /// Marca el onboarding como visto. `RootView` observa esta clave y pasa a
    /// mostrar `AuthView` en cuanto se activa.
    @AppStorage("bloom.onboardingComplete") private var onboardingComplete = false

    @State private var index = 0

    private let slides = OnboardingSlide.all

    var body: some View {
        ZStack {
            LinearGradient(
                colors: slides[index].gradient,
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            .animation(.easeInOut(duration: 0.4), value: index)

            VStack(spacing: 0) {
                skipBar

                TabView(selection: $index) {
                    ForEach(Array(slides.enumerated()), id: \.element.id) { position, slide in
                        SlideView(slide: slide)
                            .tag(position)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))

                controls
            }
        }
        .sensoryFeedback(.impact(weight: .light), trigger: index)
    }

    private var isLast: Bool { index == slides.count - 1 }

    private var skipBar: some View {
        HStack {
            Spacer()
            if !isLast {
                Button(Strings.Onboarding.skip) { finish() }
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral400)
                    .padding(.horizontal, Theme.Spacing.md)
                    .padding(.vertical, Theme.Spacing.xs)
            }
        }
        .frame(height: 44)
        .padding(.horizontal, Theme.Spacing.lg)
        .padding(.top, Theme.Spacing.sm)
    }

    private var controls: some View {
        VStack(spacing: Theme.Spacing.lg) {
            HStack(spacing: Theme.Spacing.sm) {
                ForEach(slides.indices, id: \.self) { position in
                    Capsule()
                        .fill(position == index ? Theme.Palette.primary400 : Theme.Palette.neutral200)
                        .frame(width: position == index ? 24 : 8, height: 8)
                }
            }
            .animation(.spring(response: 0.4, dampingFraction: 0.7), value: index)

            Button(action: advance) {
                Text(isLast ? Strings.Onboarding.start : Strings.Onboarding.next)
                    .font(.bodyBold)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Theme.Spacing.md)
                    .background(isLast ? Theme.Palette.secondary400 : Theme.Palette.primary400)
                    .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
                    .bloomShadow(.warm)
            }
        }
        .padding(.horizontal, Theme.Spacing.lg)
        .padding(.bottom, Theme.Spacing.xl)
    }

    private func advance() {
        if isLast {
            finish()
        } else {
            withAnimation { index += 1 }
        }
    }

    private func finish() {
        onboardingComplete = true
    }
}

/// Una diapositiva del carrusel de bienvenida.
struct OnboardingSlide: Identifiable {
    let id: String
    let emoji: String
    let title: String
    let subtitle: String
    let emojiBackground: Color
    let gradient: [Color]

    static let all: [OnboardingSlide] = [
        OnboardingSlide(
            id: "1",
            emoji: "🌱",
            title: Strings.Onboarding.slide1Title,
            subtitle: Strings.Onboarding.slide1Subtitle,
            emojiBackground: Theme.Palette.secondary100,
            gradient: [Theme.Palette.background, Theme.Palette.secondary50, Theme.Palette.background]
        ),
        OnboardingSlide(
            id: "2",
            emoji: "🌿",
            title: Strings.Onboarding.slide2Title,
            subtitle: Strings.Onboarding.slide2Subtitle,
            emojiBackground: Theme.Palette.primary100,
            gradient: [Theme.Palette.background, Theme.Palette.primary50, Theme.Palette.background]
        ),
        OnboardingSlide(
            id: "3",
            emoji: "🌸",
            title: Strings.Onboarding.slide3Title,
            subtitle: Strings.Onboarding.slide3Subtitle,
            emojiBackground: Theme.Palette.accent100,
            gradient: [Theme.Palette.background, Theme.Palette.accent50, Theme.Palette.background]
        ),
    ]
}

/// Contenido de una diapositiva: emoji flotante, título y subtítulo.
private struct SlideView: View {
    let slide: OnboardingSlide

    @State private var floating = false

    var body: some View {
        VStack(spacing: Theme.Spacing.xl) {
            Text(slide.emoji)
                .font(.system(size: 56))
                .frame(width: 120, height: 120)
                .background(slide.emojiBackground)
                .clipShape(RoundedRectangle(cornerRadius: 40))
                .bloomShadow(.warm)
                .offset(y: floating ? -8 : 8)

            VStack(spacing: Theme.Spacing.md) {
                Text(slide.title)
                    .font(.displayLarge)
                    .foregroundStyle(Theme.Palette.neutral800)

                Text(slide.subtitle)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral500)
                    .lineSpacing(4)
            }
            .multilineTextAlignment(.center)
        }
        .padding(.horizontal, Theme.Spacing.xl + 8)
        .frame(maxHeight: .infinity)
        .onAppear {
            withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true).delay(0.3)) {
                floating = true
            }
        }
    }
}

#Preview {
    OnboardingView()
}
