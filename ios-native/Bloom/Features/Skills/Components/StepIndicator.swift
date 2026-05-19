import SwiftUI

/// Indicador de progreso por pasos de un ejercicio: una serie de puntos donde
/// el actual se ensancha y los ya completados se atenúan.
/// Portado de `src/components/skills/StepIndicator.tsx`.
struct StepIndicator: View {

    let currentStep: Int
    let totalSteps: Int
    var color: Color = Theme.Palette.primary400

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<totalSteps, id: \.self) { index in
                Capsule()
                    .fill(fill(for: index))
                    .frame(width: index == currentStep ? 24 : 8, height: 8)
                    .animation(.spring(response: 0.3, dampingFraction: 0.7), value: currentStep)
            }
        }
    }

    private func fill(for index: Int) -> Color {
        if index < currentStep {
            return color.opacity(0.4)
        } else if index == currentStep {
            return color
        } else {
            return Theme.Palette.neutral200
        }
    }
}

#Preview {
    VStack(spacing: Theme.Spacing.lg) {
        StepIndicator(currentStep: 0, totalSteps: 6)
        StepIndicator(currentStep: 3, totalSteps: 6, color: Theme.Palette.secondary400)
        StepIndicator(currentStep: 5, totalSteps: 6, color: Theme.Palette.accent400)
    }
    .padding()
    .background(Theme.Palette.background)
}
