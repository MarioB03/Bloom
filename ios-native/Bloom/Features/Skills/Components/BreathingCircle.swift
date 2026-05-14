import SwiftUI

/// Círculo de respiración guiada: se expande al inhalar, se mantiene al retener
/// y se contrae al exhalar, mostrando la fase actual en el centro.
/// Portado de `src/components/skills/BreathingCircle.tsx` — el ciclo de
/// `setTimeout` anidados de `react-native-reanimated` se recrea con una tarea
/// `async` que se cancela al pausar.
struct BreathingCircle: View {

    /// Patrón del paso. Solo se renderiza este componente cuando el paso tiene
    /// patrón; los pasos sin patrón usan `ExerciseTimer`.
    let pattern: BreathingPattern
    let isRunning: Bool
    let remainingSeconds: Int
    let onToggle: () -> Void
    var color: Color = Theme.Palette.primary400

    private enum Phase {
        case inhale, hold, exhale

        var label: String {
            switch self {
            case .inhale: Strings.Breathing.inhale
            case .hold: Strings.Breathing.hold
            case .exhale: Strings.Breathing.exhale
            }
        }
    }

    @State private var scale: CGFloat
    @State private var phase: Phase

    init(
        pattern: BreathingPattern,
        isRunning: Bool,
        remainingSeconds: Int,
        onToggle: @escaping () -> Void,
        color: Color = Theme.Palette.primary400
    ) {
        self.pattern = pattern
        self.isRunning = isRunning
        self.remainingSeconds = remainingSeconds
        self.onToggle = onToggle
        self.color = color
        // Estado inicial según el patrón. Una fase única de retención o de solo
        // exhalación arranca con el círculo expandido, para que la animación se
        // vea (en RN arranca siempre en 0.5 y la exhalación no se mueve).
        let startPhase: Phase
        let startScale: CGFloat
        if pattern.isFullCycle || pattern.inhale > 0 {
            startPhase = .inhale
            startScale = 0.5
        } else if pattern.hold > 0 {
            startPhase = .hold
            startScale = 1
        } else {
            startPhase = .exhale
            startScale = 1
        }
        _phase = State(initialValue: startPhase)
        _scale = State(initialValue: startScale)
    }

    var body: some View {
        VStack(spacing: Theme.Spacing.lg) {
            ZStack {
                Circle()
                    .fill(color.opacity(0.15))
                    .overlay(Circle().strokeBorder(color.opacity(0.3), lineWidth: 3))
                    .frame(width: 180, height: 180)
                    .scaleEffect(scale)

                Circle()
                    .fill(color.opacity(0.25))
                    .frame(width: 120, height: 120)
                    .scaleEffect(scale)

                Text(phase.label)
                    .font(.displaySmall)
                    .foregroundStyle(color)
            }
            .frame(width: 180, height: 180)

            HStack(spacing: Theme.Spacing.md) {
                Button(action: onToggle) {
                    Image(systemName: isRunning ? "pause.fill" : "play.fill")
                        .font(.system(size: 22))
                        .foregroundStyle(color)
                        .frame(width: 48, height: 48)
                        .background(color.opacity(0.15))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .sensoryFeedback(.impact(weight: .light), trigger: isRunning)

                Text(SkillTimeFormat.clock(remainingSeconds))
                    .font(.custom("DMSans-Bold", size: 18))
                    .foregroundStyle(Theme.Palette.neutral600)
                    .monospacedDigit()
            }
        }
        .frame(maxWidth: .infinity)
        .task(id: isRunning) {
            await runAnimation()
        }
    }

    // MARK: - Ciclo de animación

    private func runAnimation() async {
        guard isRunning else {
            withAnimation(.easeInOut(duration: 0.5)) { scale = 0.5 }
            return
        }
        if pattern.isFullCycle {
            await runFullCycle(pattern)
        } else {
            runSinglePhase(pattern)
        }
    }

    /// Inhala → retén → exhala, en bucle, hasta que se cancela la tarea.
    private func runFullCycle(_ pattern: BreathingPattern) async {
        while !Task.isCancelled {
            phase = .inhale
            withAnimation(.easeInOut(duration: Double(pattern.inhale))) { scale = 1 }
            if await sleep(pattern.inhale) { return }

            if pattern.hold > 0 {
                phase = .hold
                if await sleep(pattern.hold) { return }
            }

            phase = .exhale
            withAnimation(.easeInOut(duration: Double(pattern.exhale))) { scale = 0.5 }
            if await sleep(pattern.exhale) { return }
        }
    }

    /// Patrón de una sola fase (los pasos 4-7-8 individuales): anima una vez.
    /// La fase y el tamaño de partida ya los fija `init`; aquí solo se anima el
    /// destino (también al reanudar tras una pausa).
    private func runSinglePhase(_ pattern: BreathingPattern) {
        if pattern.inhale > 0 {
            withAnimation(.easeInOut(duration: Double(pattern.inhale))) { scale = 1 }
        } else if pattern.hold > 0 {
            withAnimation(.easeInOut(duration: 0.3)) { scale = 1 }
        } else {
            withAnimation(.easeInOut(duration: Double(pattern.exhale))) { scale = 0.5 }
        }
    }

    /// Duerme `seconds` segundos; devuelve `true` si la tarea fue cancelada.
    private func sleep(_ seconds: Int) async -> Bool {
        try? await Task.sleep(for: .seconds(seconds))
        return Task.isCancelled
    }
}

#Preview {
    BreathingCircle(
        pattern: BreathingPattern(inhale: 4, hold: 7, exhale: 8),
        isRunning: true,
        remainingSeconds: 19,
        onToggle: {}
    )
    .padding()
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Theme.Palette.background)
}
