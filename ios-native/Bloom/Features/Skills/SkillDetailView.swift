import SwiftUI

/// Detalle de una habilidad. Tres modos según el estado:
/// 1. **Detalle** — héroe, pasos (artículo) o previsualización (ejercicio),
///    consejos y el botón de acción.
/// 2. **Ejercicio en curso** — indicador de pasos, tarjeta del paso con su
///    timer o círculo de respiración, y el botón de avanzar.
/// 3. **Completado** — pantalla de felicitación con repetir / volver.
///
/// Portado de `app/habilidad/[id].tsx`. El `setInterval` de RN se sustituye por
/// un `Timer.publish`; la pantalla de "completado" es un estado interno (no una
/// vista distinta) igual que en RN.
///
/// Divergencia de RN: al terminar un ejercicio —o al marcar un artículo como
/// practicado— se registra una `SkillPractice` en Firestore. En la app React
/// Native `createSkillPractice` existe pero no se llama nunca, así que el
/// historial siempre quedaba vacío.
struct SkillDetailView: View {

    let skillID: String

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore
    @Environment(\.dismiss) private var dismiss

    @State private var currentStep = 0
    @State private var isStarted = false
    @State private var isDone = false
    @State private var isRunning = false
    @State private var remainingSeconds = 0

    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var skill: Skill? { SkillCatalog.skill(id: skillID) }

    var body: some View {
        Group {
            if let skill {
                if isDone {
                    doneOverlay(skill)
                } else if skill.isExercise && isStarted {
                    exerciseRunner(skill)
                } else {
                    detailContent(skill)
                }
            } else {
                notFound
            }
        }
        .navigationTitle(navigationTitle)
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(isDone)
        .toolbar(isDone ? .hidden : .visible, for: .navigationBar)
        .onReceive(timer) { _ in tick() }
        .sensoryFeedback(.impact(weight: .light), trigger: currentStep)
        .sensoryFeedback(.success, trigger: isDone)
    }

    private var navigationTitle: String {
        guard let skill else { return "" }
        return isStarted ? skill.title : skill.category.meta.title
    }

    // MARK: - Modo detalle

    private func detailContent(_ skill: Skill) -> some View {
        let color = skill.category.meta.color
        return ScreenWrapper {
            heroBlock(skill)

            if skill.isExercise {
                exerciseStepsPreview(skill, color: color)
            } else {
                articleSteps(skill, color: color)
            }

            if !skill.tips.isEmpty {
                tipsBlock(skill)
            }

            if skill.isExercise {
                SkillActionButton(
                    title: Strings.Skills.startExercise,
                    systemImage: "play.fill",
                    color: color
                ) {
                    start(skill)
                }
                .padding(.top, Theme.Spacing.sm)
            } else {
                SkillActionButton(
                    title: Strings.Skills.practiceArticle,
                    systemImage: "checkmark",
                    color: color
                ) {
                    recordPractice(skill)
                    dismiss()
                }
                .padding(.top, Theme.Spacing.sm)
            }
        }
    }

    private func heroBlock(_ skill: Skill) -> some View {
        VStack(spacing: Theme.Spacing.md) {
            BloomIconView(.skill(id: skill.id), size: 72)

            HStack(spacing: Theme.Spacing.sm) {
                SkillTypeBadge(type: skill.type)
                HStack(spacing: 4) {
                    Image(systemName: "clock")
                        .font(.system(size: 11))
                    Text(skill.durationLabel)
                        .font(.tag)
                }
                .foregroundStyle(Theme.Palette.neutral500)
                .padding(.horizontal, Theme.Spacing.sm)
                .padding(.vertical, 4)
                .background(Theme.Palette.neutral100)
                .clipShape(Capsule())
            }

            Text(skill.title)
                .font(.displaySmall)
                .foregroundStyle(Theme.Palette.neutral800)
                .multilineTextAlignment(.center)

            Text(skill.longDescription)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral600)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.bottom, Theme.Spacing.sm)
    }

    private func articleSteps(_ skill: Skill, color: Color) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text(Strings.Skills.steps)
                .font(.heading3)
                .foregroundStyle(Theme.Palette.neutral700)

            ForEach(Array(skill.steps.enumerated()), id: \.offset) { index, step in
                HStack(alignment: .top, spacing: Theme.Spacing.md) {
                    Text("\(index + 1)")
                        .font(.custom("DMSans-Bold", size: 14))
                        .foregroundStyle(color)
                        .frame(width: 32, height: 32)
                        .background(color.opacity(0.13))
                        .clipShape(Circle())

                    VStack(alignment: .leading, spacing: 4) {
                        Text(step.title)
                            .font(.bodyBold)
                            .foregroundStyle(Theme.Palette.neutral700)
                        Text(step.instruction)
                            .font(.bodyText)
                            .foregroundStyle(Theme.Palette.neutral600)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func exerciseStepsPreview(_ skill: Skill, color: Color) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            Text(Strings.Skills.stepCount(skill.steps.count))
                .font(.heading3)
                .foregroundStyle(Theme.Palette.neutral700)
                .padding(.bottom, Theme.Spacing.xs)

            ForEach(Array(skill.steps.enumerated()), id: \.offset) { _, step in
                HStack(spacing: Theme.Spacing.sm) {
                    Circle()
                        .fill(color)
                        .frame(width: 8, height: 8)
                    Text(step.title)
                        .font(.bodyText)
                        .foregroundStyle(Theme.Palette.neutral600)
                    Spacer()
                    if let duration = step.durationSeconds, duration > 0 {
                        Text("\(duration)s")
                            .font(.caption)
                            .foregroundStyle(Theme.Palette.neutral400)
                    }
                }
                .padding(.vertical, Theme.Spacing.sm)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func tipsBlock(_ skill: Skill) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text(Strings.Skills.tips)
                .font(.heading3)
                .foregroundStyle(Theme.Palette.neutral700)

            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                ForEach(Array(skill.tips.enumerated()), id: \.offset) { _, tip in
                    HStack(alignment: .top, spacing: Theme.Spacing.sm) {
                        Text("💡")
                            .font(.system(size: 16))
                        Text(tip)
                            .font(.bodyText)
                            .foregroundStyle(Theme.Palette.neutral600)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
            .padding(Theme.Spacing.md)
            .background(Theme.Palette.accent50)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.xl)
                    .strokeBorder(Theme.Palette.accent100, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Modo ejercicio en curso

    private func exerciseRunner(_ skill: Skill) -> some View {
        let color = skill.category.meta.color
        let step = skill.steps[currentStep]
        let hasDuration = (step.durationSeconds ?? 0) > 0
        let isLastStep = currentStep == skill.steps.count - 1

        return ScreenWrapper {
            VStack(spacing: Theme.Spacing.sm) {
                StepIndicator(
                    currentStep: currentStep,
                    totalSteps: skill.steps.count,
                    color: color
                )
                Text(Strings.Skills.stepOf(currentStep + 1, skill.steps.count))
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.neutral500)
            }
            .frame(maxWidth: .infinity)
            .padding(.bottom, Theme.Spacing.sm)

            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                Text(step.title)
                    .font(.heading2)
                    .foregroundStyle(Theme.Palette.neutral800)
                Text(step.instruction)
                    .font(.bodyText)
                    .foregroundStyle(Theme.Palette.neutral600)

                if hasDuration {
                    Group {
                        // El círculo de respiración solo en los pasos de una
                        // habilidad de respiración que tienen patrón; los
                        // demás pasos con duración usan el timer normal.
                        if skill.isBreathing, let pattern = step.breathingPattern {
                            BreathingCircle(
                                pattern: pattern,
                                isRunning: isRunning,
                                remainingSeconds: remainingSeconds,
                                onToggle: toggleTimer,
                                color: color
                            )
                        } else {
                            ExerciseTimer(
                                durationSeconds: step.durationSeconds ?? 0,
                                isRunning: isRunning,
                                remainingSeconds: remainingSeconds,
                                onToggle: toggleTimer,
                                color: color
                            )
                        }
                    }
                    .padding(.top, Theme.Spacing.md)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Theme.Spacing.lg)
            .background(Theme.Palette.surface)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
            .bloomShadow(.md)
            .id(currentStep)

            SkillActionButton(
                title: isLastStep ? Strings.Skills.finish : Strings.Skills.nextStep,
                systemImage: isLastStep ? "checkmark" : "arrow.right",
                color: color
            ) {
                nextStep(skill)
            }
        }
    }

    // MARK: - Modo completado

    private func doneOverlay(_ skill: Skill) -> some View {
        VStack(spacing: Theme.Spacing.md) {
            BloomIconView(.skill(id: skill.id), size: 96)
            Text(Strings.Skills.congratulations)
                .font(.displayLarge)
                .foregroundStyle(Theme.Palette.neutral800)
            Text(Strings.Skills.keepPracticing)
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
                .multilineTextAlignment(.center)
                .padding(.bottom, Theme.Spacing.md)

            BloomButton(
                title: Strings.Skills.practiceAgain,
                variant: .outline,
                icon: Image(systemName: "arrow.clockwise")
            ) {
                restart()
            }
            BloomButton(title: Strings.Skills.backToSkills) {
                dismiss()
            }
        }
        .padding(Theme.Spacing.lg)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.Palette.background)
    }

    private var notFound: some View {
        VStack(spacing: Theme.Spacing.md) {
            Text("🔍")
                .font(.system(size: 48))
            Text("Habilidad no encontrada")
                .font(.bodyText)
                .foregroundStyle(Theme.Palette.neutral500)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.Palette.background)
    }

    // MARK: - Lógica del ejercicio

    private func start(_ skill: Skill) {
        isStarted = true
        currentStep = 0
        applyDuration(of: skill.steps[0])
    }

    private func nextStep(_ skill: Skill) {
        isRunning = false
        if currentStep < skill.steps.count - 1 {
            currentStep += 1
            applyDuration(of: skill.steps[currentStep])
        } else {
            isDone = true
            recordPractice(skill)
        }
    }

    private func restart() {
        isDone = false
        isStarted = false
        isRunning = false
        currentStep = 0
        remainingSeconds = 0
    }

    private func toggleTimer() {
        if isRunning {
            isRunning = false
        } else if remainingSeconds > 0 {
            isRunning = true
        }
    }

    /// Arranca (o no) el conteo según la duración del paso.
    private func applyDuration(of step: SkillStep) {
        if let duration = step.durationSeconds, duration > 0 {
            remainingSeconds = duration
            isRunning = true
        } else {
            remainingSeconds = 0
            isRunning = false
        }
    }

    private func tick() {
        guard isRunning, remainingSeconds > 0 else { return }
        remainingSeconds -= 1
        if remainingSeconds == 0 {
            isRunning = false
        }
    }

    /// Registra la práctica completada. Fire-and-forget: un fallo de red no
    /// debe interrumpir la celebración ni bloquear al usuario.
    private func recordPractice(_ skill: Skill) {
        guard let userID = auth.currentUserID else { return }
        let draft = SkillPracticeDraft(
            skillId: skill.id,
            skillTitle: skill.title,
            category: skill.category,
            durationSeconds: skill.totalDurationSeconds
        )
        try? firestore.createSkillPractice(draft, userID: userID)
        // Comprueba los logros en segundo plano: los toasts resultantes se
        // persisten y los muestra el home en su siguiente recarga.
        Task { await AppAchievements.checkAndUnlock(userID: userID, firestore: firestore) }
    }
}

/// Botón de acción a ancho completo coloreado con el color de la categoría —
/// para "Comenzar ejercicio", "Siguiente"/"Finalizar" y "He practicado esto".
/// `BloomButton` no admite color arbitrario, de ahí este componente aparte.
struct SkillActionButton: View {

    let title: String
    let systemImage: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Theme.Spacing.sm) {
                Image(systemName: systemImage)
                    .font(.system(size: 16, weight: .semibold))
                Text(title)
                    .font(.heading3)
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.md)
            .background(color)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
        }
        .buttonStyle(SkillActionButtonStyle())
    }
}

/// Escala el botón con un muelle y dispara un haptic al pulsar — equivalente al
/// `PressableButtonStyle` privado de `BloomButton`, replicado para el botón de
/// acción de las habilidades.
private struct SkillActionButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: configuration.isPressed)
            .sensoryFeedback(.impact(weight: .medium), trigger: configuration.isPressed) { _, pressed in
                pressed
            }
    }
}

#Preview {
    NavigationStack {
        SkillDetailView(skillID: "respiracion_478")
    }
}
