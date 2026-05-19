import SwiftUI

/// Insignia que distingue una habilidad de tipo ejercicio (verde salvia) de
/// una de tipo artículo (ámbar). Se usa en `SkillCard` y en el detalle.
struct SkillTypeBadge: View {

    let type: SkillType

    private var isExercise: Bool { type == .exercise }

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: isExercise ? "figure.mind.and.body" : "book")
                .font(.system(size: 11))
            Text(isExercise ? Strings.Skills.exercise : Strings.Skills.article)
                .font(.tag)
        }
        .foregroundStyle(isExercise ? Theme.Palette.secondary500 : Theme.Palette.accent500)
        .padding(.horizontal, Theme.Spacing.sm)
        .padding(.vertical, 3)
        .background(isExercise ? Theme.Palette.secondary50 : Theme.Palette.accent50)
        .clipShape(Capsule())
    }
}

#Preview {
    HStack {
        SkillTypeBadge(type: .exercise)
        SkillTypeBadge(type: .article)
    }
    .padding()
    .background(Theme.Palette.background)
}
