import SwiftUI

/// Temporizador de un paso de ejercicio: botón de play/pausa, tiempo restante y
/// una barra de progreso. El conteo lo lleva la pantalla padre
/// (`SkillDetailView`); este componente solo pinta el estado.
/// Portado de `src/components/skills/ExerciseTimer.tsx`.
struct ExerciseTimer: View {

    let durationSeconds: Int
    let isRunning: Bool
    let remainingSeconds: Int
    let onToggle: () -> Void
    var color: Color = Theme.Palette.primary400

    private var progress: Double {
        guard durationSeconds > 0 else { return 0 }
        return Double(durationSeconds - remainingSeconds) / Double(durationSeconds)
    }

    var body: some View {
        VStack(spacing: Theme.Spacing.sm) {
            HStack(spacing: Theme.Spacing.md) {
                Button(action: onToggle) {
                    Image(systemName: isRunning ? "pause.fill" : "play.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(.white)
                        .frame(width: 44, height: 44)
                        .background(color)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .sensoryFeedback(.impact(weight: .light), trigger: isRunning)

                Text(SkillTimeFormat.clock(remainingSeconds))
                    .font(.custom("DMSans-Bold", size: 28))
                    .foregroundStyle(Theme.Palette.neutral700)
                    .monospacedDigit()

                Spacer()
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Theme.Palette.neutral200)
                    Capsule()
                        .fill(color)
                        .frame(width: geometry.size.width * progress)
                }
            }
            .frame(height: 6)
            .animation(.linear(duration: 0.3), value: progress)
        }
    }
}

/// Formato de tiempo compartido por el timer y el círculo de respiración.
enum SkillTimeFormat {
    /// Segundos a `"m:ss"`.
    static func clock(_ seconds: Int) -> String {
        let safe = max(0, seconds)
        return "\(safe / 60):\(String(format: "%02d", safe % 60))"
    }
}

#Preview {
    VStack(spacing: Theme.Spacing.xl) {
        ExerciseTimer(durationSeconds: 60, isRunning: true, remainingSeconds: 45, onToggle: {})
        ExerciseTimer(durationSeconds: 30, isRunning: false, remainingSeconds: 30, onToggle: {}, color: Theme.Palette.secondary400)
    }
    .padding()
    .background(Theme.Palette.background)
}
