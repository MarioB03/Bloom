import SwiftUI

/// Modal a pantalla completa que celebra un hito de racha: fondo oscurecido,
/// confeti cayendo, tarjeta con emoji que rebota, lo que se desbloquea y las
/// semillas de bono. Se descarta al tocar el fondo o el botón. Equivalente
/// nativo de `StreakCelebration.tsx`.
struct StreakCelebrationView: View {
    let milestone: StreakMilestone
    let seedsEarned: Int
    let onDismiss: () -> Void

    @State private var backdropOpacity: CGFloat = 0
    @State private var cardScale: CGFloat = 0.6
    @State private var cardOpacity: CGFloat = 0
    @State private var emojiScale: CGFloat = 0

    var body: some View {
        ZStack {
            Color.black.opacity(0.5)
                .opacity(backdropOpacity)
                .ignoresSafeArea()
                .onTapGesture(perform: dismiss)

            ConfettiView()
                .ignoresSafeArea()
                .allowsHitTesting(false)

            card
                .scaleEffect(cardScale)
                .opacity(cardOpacity)
        }
        .onAppear(perform: animateIn)
    }

    private var card: some View {
        VStack(spacing: Theme.Spacing.md) {
            Text(milestone.emoji)
                .font(.system(size: 60))
                .scaleEffect(emojiScale)

            Text(milestone.title)
                .font(.system(size: 26, weight: .bold, design: .serif))
                .foregroundStyle(Theme.Palette.accent500)
                .multilineTextAlignment(.center)

            Text(milestone.unlocks)
                .font(.system(size: 15, design: .rounded))
                .foregroundStyle(Theme.Palette.neutral600)
                .multilineTextAlignment(.center)

            if seedsEarned > 0 {
                Text(Strings.Garden.celebrationSeeds(seedsEarned))
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(Theme.Palette.accent500)
                    .padding(.horizontal, Theme.Spacing.md)
                    .padding(.vertical, Theme.Spacing.xs + 2)
                    .background(Theme.Palette.accent50)
                    .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.sm))
            }

            Button(action: dismiss) {
                Text(Strings.Garden.celebrationButton)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(Theme.Palette.surface)
                    .padding(.vertical, Theme.Spacing.sm + 4)
                    .padding(.horizontal, Theme.Spacing.xl + Theme.Spacing.md)
                    .background(Theme.Palette.secondary400)
                    .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
            }
            .buttonStyle(.plain)
            .padding(.top, Theme.Spacing.xs)
        }
        .padding(.vertical, Theme.Spacing.xl)
        .padding(.horizontal, Theme.Spacing.lg)
        .frame(maxWidth: 320)
        .background(Theme.Palette.surface)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.xl)
                .strokeBorder(Theme.Palette.accent200, lineWidth: 2)
        )
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
        .bloomShadow(.warm)
        .padding(.horizontal, Theme.Spacing.xl)
    }

    private func animateIn() {
        #if canImport(UIKit)
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        #endif
        withAnimation(.easeOut(duration: 0.2)) {
            backdropOpacity = 1
            cardOpacity = 1
        }
        withAnimation(.spring(response: 0.4, dampingFraction: 0.62)) {
            cardScale = 1
        }
        withAnimation(.spring(response: 0.45, dampingFraction: 0.5).delay(0.2)) {
            emojiScale = 1
        }
    }

    private func dismiss() {
        withAnimation(.easeIn(duration: 0.25)) {
            cardScale = 0.9
            cardOpacity = 0
            backdropOpacity = 0
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            onDismiss()
        }
    }
}

// MARK: - Confeti

/// Capa decorativa de confeti: piezas de colores que caen en bucle.
private struct ConfettiView: View {
    private static let colors: [Color] = [
        Theme.Palette.accent300, Theme.Palette.accent400,
        Theme.Palette.primary300, Theme.Palette.secondary300,
        Theme.Palette.secondary400, Color(hex: "F9CB76"),
        Color(hex: "E8A4B8"), Color(hex: "A3D9A5"),
    ]

    var body: some View {
        GeometryReader { geo in
            ZStack {
                ForEach(0..<14, id: \.self) { index in
                    ConfettiPiece(
                        color: Self.colors[index % Self.colors.count],
                        bounds: geo.size,
                        index: index
                    )
                }
            }
        }
    }
}

/// Una pieza de confeti: cae de arriba abajo girando, en bucle infinito.
private struct ConfettiPiece: View {
    let color: Color
    let bounds: CGSize
    let index: Int

    @State private var fallProgress: CGFloat = 0
    @State private var rotation: Double = 0

    private let startX: CGFloat
    private let drift: CGFloat
    private let duration: Double
    private let delay: Double

    init(color: Color, bounds: CGSize, index: Int) {
        self.color = color
        self.bounds = bounds
        self.index = index
        self.startX = CGFloat.random(in: 0...max(bounds.width, 1))
        self.drift = CGFloat.random(in: -40...40)
        self.duration = Double.random(in: 1.8...3.0)
        self.delay = Double(index) * 0.06
    }

    var body: some View {
        RoundedRectangle(cornerRadius: 2)
            .fill(color)
            .frame(width: 10, height: 6)
            .rotationEffect(.degrees(rotation))
            .position(
                x: startX + drift * fallProgress,
                y: -20 + (bounds.height + 60) * fallProgress
            )
            .onAppear {
                withAnimation(.linear(duration: duration).repeatForever(autoreverses: false).delay(delay)) {
                    fallProgress = 1
                }
                withAnimation(.linear(duration: duration).repeatForever(autoreverses: false).delay(delay)) {
                    rotation = 540
                }
            }
    }
}
