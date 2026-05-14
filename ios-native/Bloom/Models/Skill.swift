import SwiftUI
import FirebaseFirestore

/// Las cinco categorías de habilidades DBT.
/// Portado de `SkillCategory` en `src/types/skill.ts`.
enum SkillCategory: String, CaseIterable, Codable, Identifiable, Sendable {
    case toleranciaMalestar = "tolerancia_malestar"
    case regulacionEmocional = "regulacion_emocional"
    case mindfulness
    case relacionesInterpersonales = "relaciones_interpersonales"
    case autocuidado

    var id: String { rawValue }

    var meta: SkillCategoryMeta { SkillCategoryMeta.all[self]! }
}

/// Tipo de habilidad: ejercicio guiado paso a paso o artículo de lectura.
/// Portado de `SkillType` en `src/types/skill.ts`.
enum SkillType: String, Codable, Sendable {
    case exercise
    case article
}

/// Patrón de respiración de un paso: segundos de inhalación, retención y
/// exhalación. Un cero significa "esta fase no aplica".
/// Portado de `breathingPattern` en `src/types/skill.ts`.
struct BreathingPattern: Codable, Sendable, Equatable {
    let inhale: Int
    let hold: Int
    let exhale: Int

    /// Ciclo completo (inhala → retén → exhala). Si no, es una fase única.
    var isFullCycle: Bool { inhale > 0 && exhale > 0 }
}

/// Un paso de una habilidad. Los ejercicios pueden llevar duración y, los de
/// respiración, un patrón. Portado de `SkillStep` en `src/types/skill.ts`.
struct SkillStep: Codable, Sendable, Identifiable {
    let title: String
    let instruction: String
    var durationSeconds: Int?
    var breathingPattern: BreathingPattern?

    var id: String { title }
}

/// Una habilidad DBT: ejercicio o artículo. Catálogo estático en
/// `SkillCatalog`, no se lee de Firestore (igual que en la app RN, donde
/// vive en `src/constants/skills.ts`).
/// Portado de `Skill` en `src/types/skill.ts`.
struct Skill: Codable, Sendable, Identifiable {
    let id: String
    let title: String
    let description: String
    let longDescription: String
    let category: SkillCategory
    let type: SkillType
    let targetEmotions: [EmotionID]
    /// Rango de intensidad emocional para el que la habilidad es adecuada (1–10).
    let intensityRange: ClosedRange<Int>
    let steps: [SkillStep]
    let totalDurationSeconds: Int
    let durationLabel: String
    let tips: [String]
    let icon: String
    let order: Int

    var isExercise: Bool { type == .exercise }
    /// Las habilidades de respiración usan `BreathingCircle` en lugar del timer.
    var isBreathing: Bool { id.hasPrefix("respiracion") }
}

/// Metadatos visuales de una categoría: título, descripción, emoji y color.
/// Portado de `SkillCategoryMeta` + `SKILL_CATEGORIES` en RN.
struct SkillCategoryMeta: Identifiable, Sendable {
    let id: SkillCategory
    let title: String
    let description: String
    let emoji: String
    let color: Color

    static let all: [SkillCategory: SkillCategoryMeta] = [
        .toleranciaMalestar: .init(
            id: .toleranciaMalestar,
            title: "Tolerancia al malestar",
            description: "Técnicas para momentos difíciles",
            emoji: "🛡️",
            color: Theme.Palette.primary400
        ),
        .regulacionEmocional: .init(
            id: .regulacionEmocional,
            title: "Regulación emocional",
            description: "Aprende a gestionar tus emociones",
            emoji: "🎭",
            color: Theme.Palette.accent400
        ),
        .mindfulness: .init(
            id: .mindfulness,
            title: "Mindfulness",
            description: "Conciencia plena y presencia",
            emoji: "🧘",
            color: Theme.Palette.secondary400
        ),
        .relacionesInterpersonales: .init(
            id: .relacionesInterpersonales,
            title: "Relaciones interpersonales",
            description: "Comunicación y conexión",
            emoji: "🤝",
            color: Theme.Palette.info
        ),
        .autocuidado: .init(
            id: .autocuidado,
            title: "Autocuidado",
            description: "Rutinas de bienestar personal",
            emoji: "💆",
            color: Color(hex: "B58B9E")
        ),
    ]

    /// Las cinco categorías en el orden canónico de la app.
    static let ordered: [SkillCategoryMeta] = SkillCategory.allCases.map { $0.meta }
}

/// Una práctica de habilidad completada por el usuario.
/// Documento de `users/{userId}/skillPractice/{practiceId}` en Firestore.
/// Portado de `SkillPractice` en `src/types/skill.ts`.
///
/// No es `Sendable`: el wrapper `@DocumentID` de FirebaseFirestore no lo es.
/// Se maneja siempre desde el main actor, igual que el resto de modelos.
struct SkillPractice: Codable, Identifiable {
    @DocumentID var id: String?
    var userId: String
    var skillId: String
    var skillTitle: String
    var category: SkillCategory
    var completedAt: Date
    var durationSeconds: Int
}

/// Datos para registrar una práctica. `userId` y `completedAt` los pone
/// `FirestoreService`. Equivalente a `SkillPracticeFormData` en RN.
struct SkillPracticeDraft {
    var skillId: String
    var skillTitle: String
    var category: SkillCategory
    var durationSeconds: Int
}
