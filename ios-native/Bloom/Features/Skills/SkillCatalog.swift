import Foundation

/// Catálogo estático de las 18 habilidades DBT de Bloom.
/// Portado de `ALL_SKILLS` y los helpers de `src/constants/skills.ts`.
///
/// No se lee de Firestore: el contenido es fijo y se versiona con la app,
/// igual que en la app React Native.
enum SkillCatalog {

    /// Las cinco categorías en el orden canónico de la app.
    static let categories: [SkillCategoryMeta] = SkillCategoryMeta.ordered

    /// Una habilidad por su id, o `nil` si no existe.
    static func skill(id: String) -> Skill? {
        all.first { $0.id == id }
    }

    /// Habilidades de una categoría, ordenadas por su campo `order`.
    static func skills(in category: SkillCategory) -> [Skill] {
        all.filter { $0.category == category }.sorted { $0.order < $1.order }
    }

    /// Habilidades adecuadas para una emoción concreta, ordenadas por `order`.
    static func skills(forEmotion emotion: EmotionID) -> [Skill] {
        all.filter { $0.targetEmotions.contains(emotion) }.sorted { $0.order < $1.order }
    }

    // MARK: - Las 18 habilidades

    static let all: [Skill] = [

        // ── Tolerancia al malestar (4) ──
        Skill(
            id: "respiracion_478",
            title: "Respiración 4-7-8",
            description: "Técnica de respiración para calmar el sistema nervioso rápidamente.",
            longDescription: "La respiración 4-7-8, desarrollada por el Dr. Andrew Weil, activa el sistema nervioso parasimpático, ayudándote a pasar del modo de lucha o huida a un estado de calma. Es especialmente útil para momentos de ansiedad intensa o cuando necesitas dormirte.",
            category: .toleranciaMalestar,
            type: .exercise,
            targetEmotions: [.ansiedad, .miedo, .ira, .frustracion],
            intensityRange: 3...5,
            steps: [
                SkillStep(title: "Prepárate", instruction: "Siéntate cómodamente con la espalda recta. Coloca la punta de la lengua detrás de los dientes superiores.", durationSeconds: 10),
                SkillStep(title: "Exhala", instruction: "Exhala completamente por la boca haciendo un sonido \"whoosh\".", durationSeconds: 5),
                SkillStep(title: "Inhala (4s)", instruction: "Cierra la boca e inhala silenciosamente por la nariz contando hasta 4.", durationSeconds: 4, breathingPattern: BreathingPattern(inhale: 4, hold: 0, exhale: 0)),
                SkillStep(title: "Retén (7s)", instruction: "Mantén la respiración contando hasta 7. Siente cómo el aire llena tus pulmones.", durationSeconds: 7, breathingPattern: BreathingPattern(inhale: 0, hold: 7, exhale: 0)),
                SkillStep(title: "Exhala (8s)", instruction: "Exhala completamente por la boca contando hasta 8, haciendo el sonido \"whoosh\".", durationSeconds: 8, breathingPattern: BreathingPattern(inhale: 0, hold: 0, exhale: 8)),
                SkillStep(title: "Repite ciclo 2", instruction: "Inhala por la nariz (4s), retén (7s), exhala por la boca (8s).", durationSeconds: 19, breathingPattern: BreathingPattern(inhale: 4, hold: 7, exhale: 8)),
                SkillStep(title: "Repite ciclo 3", instruction: "Inhala por la nariz (4s), retén (7s), exhala por la boca (8s).", durationSeconds: 19, breathingPattern: BreathingPattern(inhale: 4, hold: 7, exhale: 8)),
                SkillStep(title: "Último ciclo", instruction: "Inhala (4s), retén (7s), exhala lentamente (8s). Nota cómo te sientes ahora.", durationSeconds: 19, breathingPattern: BreathingPattern(inhale: 4, hold: 7, exhale: 8)),
            ],
            totalDurationSeconds: 91,
            durationLabel: "~2 min",
            tips: [
                "Practica al menos 2 veces al día para mejores resultados",
                "No hagas más de 4 ciclos al principio",
                "Es normal sentir un poco de mareo las primeras veces",
            ],
            icon: "🌬️",
            order: 1
        ),
        Skill(
            id: "tecnica_tipp",
            title: "Técnica TIPP",
            description: "Cuatro pasos para reducir la intensidad emocional rápidamente.",
            longDescription: "TIPP es una técnica de la Terapia Dialéctica Conductual (DBT) diseñada para crisis emocionales. Cada letra representa una estrategia que cambia tu bioquímica corporal rápidamente: Temperatura, Intensidad del ejercicio, Respiración Pautada y Relajación muscular Progresiva.",
            category: .toleranciaMalestar,
            type: .article,
            targetEmotions: [.ira, .ansiedad, .miedo, .frustracion],
            intensityRange: 4...5,
            steps: [
                SkillStep(title: "T — Temperatura", instruction: "Sumerge tu cara en agua fría durante 30 segundos o coloca una bolsa de hielo en las mejillas y los ojos. El reflejo de inmersión reduce tu ritmo cardíaco rápidamente."),
                SkillStep(title: "I — Intensidad del ejercicio", instruction: "Realiza ejercicio intenso durante 10-20 minutos: correr, saltar, hacer sentadillas. El ejercicio libera endorfinas y reduce la tensión emocional acumulada."),
                SkillStep(title: "P — Respiración Pautada", instruction: "Exhala más lento de lo que inhalas. Inhala 4 segundos, exhala 6-8 segundos. La exhalación prolongada activa el sistema parasimpático."),
                SkillStep(title: "P — Relajación muscular Progresiva", instruction: "Tensa un grupo muscular durante 5 segundos, luego suéltalo durante 10 segundos. Empieza por los pies y sube hasta la cara. Nota el contraste entre tensión y relajación."),
            ],
            totalDurationSeconds: 0,
            durationLabel: "5 min lectura",
            tips: [
                "En una crisis, empieza por la T (Temperatura) — es la más rápida",
                "No necesitas hacer las 4 — una sola puede ayudar",
                "Ten una bolsa de hielo preparada en el congelador",
            ],
            icon: "🧊",
            order: 2
        ),
        Skill(
            id: "pros_contras",
            title: "Pros y contras",
            description: "Evalúa las consecuencias antes de actuar impulsivamente.",
            longDescription: "Esta técnica DBT te ayuda a tomar distancia de un impulso intenso, evaluando racionalmente las ventajas y desventajas de actuar según ese impulso vs. tolerarlo. Es especialmente útil para conductas autolesivas, compras impulsivas, o conflictos.",
            category: .toleranciaMalestar,
            type: .exercise,
            targetEmotions: [.ira, .frustracion, .ansiedad],
            intensityRange: 2...5,
            steps: [
                SkillStep(title: "Identifica el impulso", instruction: "Escribe o piensa en qué quieres hacer ahora mismo. Da el mayor detalle posible: \"Quiero gritarle a...\", \"Quiero dejar de...\", etc.", durationSeconds: 30),
                SkillStep(title: "Pros de actuar", instruction: "¿Qué ganarías si sigues ese impulso? Piensa en el alivio inmediato, la satisfacción momentánea.", durationSeconds: 30),
                SkillStep(title: "Contras de actuar", instruction: "¿Qué perderías? ¿Cómo te sentirías después? ¿Cómo afectaría a otros?", durationSeconds: 30),
                SkillStep(title: "Pros de tolerar", instruction: "¿Qué ganarías si resistes el impulso? Piensa en cómo te sentirías mañana si no actúas.", durationSeconds: 30),
                SkillStep(title: "Contras de tolerar", instruction: "¿Qué cuesta resistir? ¿Cuánto tiempo durará la incomodidad?", durationSeconds: 30),
                SkillStep(title: "Decide", instruction: "Lee los pros y contras. ¿La balanza se inclina hacia actuar o hacia tolerar? Toma una decisión consciente.", durationSeconds: 20),
            ],
            totalDurationSeconds: 170,
            durationLabel: "~3 min",
            tips: [
                "Escríbelo en papel — ayuda a pensar con más claridad",
                "Hazlo antes de actuar, no después",
                "Puedes usar esta técnica para cualquier decisión difícil",
            ],
            icon: "⚖️",
            order: 3
        ),
        Skill(
            id: "distracciones_saludables",
            title: "Distracciones saludables",
            description: "Actividades que te ayudan a cambiar el foco emocional.",
            longDescription: "A veces, la mejor estrategia es desviar temporalmente la atención del dolor emocional. Las distracciones saludables no niegan la emoción — te dan un respiro para volver a ella cuando tengas más equilibrio. En DBT, se usa el acrónimo ACCEPTS.",
            category: .toleranciaMalestar,
            type: .article,
            targetEmotions: [.tristeza, .ansiedad, .frustracion, .culpa],
            intensityRange: 2...4,
            steps: [
                SkillStep(title: "A — Actividades", instruction: "Haz algo que requiera concentración: cocinar, dibujar, resolver un puzzle, limpiar. La actividad ocupa tu mente y reduce la intensidad emocional."),
                SkillStep(title: "C — Contribuir", instruction: "Ayuda a alguien: escribe un mensaje amable, haz un favor, dona algo. Contribuir genera emociones positivas y cambia tu perspectiva."),
                SkillStep(title: "C — Comparar", instruction: "Recuerda momentos en que superaste algo difícil. Compara cómo te sentías entonces y cómo saliste adelante. Tienes más recursos de los que crees."),
                SkillStep(title: "E — Emociones opuestas", instruction: "Genera la emoción opuesta: ve una comedia si estás triste, escucha música tranquila si sientes enfado, mira fotos bonitas si sientes asco."),
                SkillStep(title: "P — Pensamientos alternativos", instruction: "Cuenta del 100 al 0, recita una canción, haz un sudoku. Ocupa tu mente con pensamientos que no estén relacionados con el dolor."),
                SkillStep(title: "T — Sensaciones", instruction: "Usa sensaciones físicas intensas (pero seguras): sostener hielo, oler algo fuerte, escuchar música alta, comer algo ácido."),
                SkillStep(title: "S — Retirarse", instruction: "Aléjate mentalmente de la situación. Imagina un muro entre tú y el problema, o visualiza un lugar seguro. Volverás cuando estés en condiciones."),
            ],
            totalDurationSeconds: 0,
            durationLabel: "4 min lectura",
            tips: [
                "Prepara una lista personalizada de tus mejores distracciones",
                "No es evitar — es tomar un respiro para volver más fuerte",
                "Combina varias: actividad + sensaciones funciona muy bien",
            ],
            icon: "🎯",
            order: 4
        ),

        // ── Regulación emocional (4) ──
        Skill(
            id: "accion_opuesta",
            title: "Acción opuesta",
            description: "Actúa de forma opuesta a lo que tu emoción te pide.",
            longDescription: "Cuando una emoción no encaja con los hechos o no es efectiva, actuar en dirección opuesta puede cambiar lo que sientes. Si la tristeza te pide aislarte, sal a caminar. Si el miedo te pide evitar, acércate. Esta técnica es central en DBT.",
            category: .regulacionEmocional,
            type: .exercise,
            targetEmotions: [.tristeza, .miedo, .verguenza, .culpa],
            intensityRange: 2...4,
            steps: [
                SkillStep(title: "Identifica la emoción", instruction: "Nombra qué estás sintiendo ahora mismo. ¿Es tristeza, miedo, vergüenza, culpa? Con el mayor detalle posible.", durationSeconds: 15),
                SkillStep(title: "¿Qué te pide hacer?", instruction: "Cada emoción tiene un impulso de acción. La tristeza pide aislarse, el miedo pide huir, la vergüenza pide esconderse. ¿Qué te pide tu emoción?", durationSeconds: 15),
                SkillStep(title: "¿Es efectiva?", instruction: "¿Seguir ese impulso mejoraría tu situación? ¿Es proporcional a los hechos? Si la respuesta es no, la acción opuesta es tu herramienta.", durationSeconds: 15),
                SkillStep(title: "Elige la acción opuesta", instruction: "Tristeza → sal, muévete, contacta a alguien. Miedo → acércate a lo que temes. Vergüenza → comparte lo que te avergüenza. Culpa → repara o acepta.", durationSeconds: 15),
                SkillStep(title: "Hazlo completamente", instruction: "No basta con hacer la acción — cambia también tu postura, expresión facial y tono de voz. Actúa como si ya te sintieras diferente.", durationSeconds: 20),
                SkillStep(title: "Observa", instruction: "Nota cualquier cambio en tu emoción, por pequeño que sea. La acción opuesta requiere repetición — cada vez será más fácil.", durationSeconds: 15),
            ],
            totalDurationSeconds: 95,
            durationLabel: "~2 min",
            tips: [
                "Solo úsala cuando la emoción no encaja con los hechos",
                "Hazlo completamente — a medias no funciona",
                "Es normal que al principio se sienta \"falso\" — sigue haciéndolo",
            ],
            icon: "🔄",
            order: 5
        ),
        Skill(
            id: "chequeo_hechos",
            title: "Chequeo de hechos",
            description: "Verifica si tu emoción corresponde a la realidad.",
            longDescription: "A menudo nuestras emociones responden a interpretaciones, no a hechos. El chequeo de hechos te ayuda a separar lo que está pasando realmente de lo que tu mente está interpretando. Si la emoción no encaja con los hechos, puedes regularla más fácilmente.",
            category: .regulacionEmocional,
            type: .exercise,
            targetEmotions: [.ansiedad, .ira, .miedo, .culpa, .verguenza],
            intensityRange: 2...5,
            steps: [
                SkillStep(title: "¿Qué emoción siento?", instruction: "Nombra la emoción con la mayor precisión posible. ¿Es ansiedad, ira, miedo, culpa? Puntúa su intensidad del 1 al 10.", durationSeconds: 15),
                SkillStep(title: "¿Qué pasó realmente?", instruction: "Describe solo los hechos observables: qué se dijo, qué se hizo, qué viste. Sin interpretaciones, juicios ni suposiciones.", durationSeconds: 25),
                SkillStep(title: "¿Cuál es mi interpretación?", instruction: "¿Qué historia me estoy contando? ¿Qué asumo sobre las intenciones de los demás? ¿Hay otra explicación posible?", durationSeconds: 25),
                SkillStep(title: "¿Hay evidencia?", instruction: "¿Qué pruebas reales tengo de que mi interpretación es correcta? ¿Qué pruebas hay en contra?", durationSeconds: 25),
                SkillStep(title: "¿Qué probabilidad hay?", instruction: "¿Cuál es la probabilidad real de que lo que temo/creo sea cierto? ¿Estoy confundiendo posibilidad con probabilidad?", durationSeconds: 20),
                SkillStep(title: "Reevalúa", instruction: "Con los hechos claros, ¿cambia tu emoción? ¿Es menos intensa? Si la emoción encaja con los hechos, resuelve el problema. Si no, usa acción opuesta.", durationSeconds: 20),
            ],
            totalDurationSeconds: 130,
            durationLabel: "~2 min",
            tips: [
                "Escríbelo — ver los hechos en papel ayuda muchísimo",
                "Pregunta a alguien de confianza: \"¿Cómo ves tú esta situación?\"",
                "No es negar tus emociones — es asegurarte de que encajan con la realidad",
            ],
            icon: "🔍",
            order: 6
        ),
        Skill(
            id: "emociones_positivas",
            title: "Emociones positivas",
            description: "Estrategias para construir experiencias positivas.",
            longDescription: "Acumular emociones positivas es como depositar en un banco emocional. Cuanto más capital tengas, mejor manejarás las crisis. Esta habilidad DBT distingue entre placeres a corto plazo y valores a largo plazo.",
            category: .regulacionEmocional,
            type: .article,
            targetEmotions: [.tristeza, .calma, .gratitud, .alegria],
            intensityRange: 1...3,
            steps: [
                SkillStep(title: "Placeres a corto plazo", instruction: "Haz al menos una cosa agradable cada día: un baño caliente, tu comida favorita, una caminata al atardecer, llamar a una amiga, escuchar tu canción favorita."),
                SkillStep(title: "Sé consciente", instruction: "Cuando hagas algo agradable, pon toda tu atención en ello. Saborea la experiencia sin pensar en lo que viene después. Mindfulness + placer = doble beneficio."),
                SkillStep(title: "Sin culpa", instruction: "Mereces experiencias positivas. Si aparece la culpa por disfrutar, reconócela y déjala pasar. Cuidarte no es egoísmo — es necesidad."),
                SkillStep(title: "Valores a largo plazo", instruction: "Identifica qué valores son importantes para ti: conexión, creatividad, salud, aprendizaje. Planifica una actividad semanal alineada con un valor."),
                SkillStep(title: "Construye maestría", instruction: "Haz una cosa difícil cada día que te haga sentir competente. No tiene que ser grande: cocinar algo nuevo, completar una tarea pendiente, aprender algo nuevo."),
            ],
            totalDurationSeconds: 0,
            durationLabel: "4 min lectura",
            tips: [
                "Haz una lista de 10 actividades placenteras — tenla siempre a mano",
                "Programa las actividades en tu calendario para que no se queden en intención",
                "Pequeños placeres diarios > un gran placer ocasional",
            ],
            icon: "🌈",
            order: 7
        ),
        Skill(
            id: "diario_emociones",
            title: "Diario de emociones",
            description: "Registra y comprende tus patrones emocionales.",
            longDescription: "Llevar un registro emocional es como ser tu propia detective. Con el tiempo, descubrirás patrones: qué situaciones disparan qué emociones, qué funciona para regularlas, y cómo evoluciona tu mundo emocional. Bloom ya te ayuda con esto — esta guía te enseña a profundizar.",
            category: .regulacionEmocional,
            type: .article,
            targetEmotions: [.calma, .tristeza, .ansiedad, .alegria],
            intensityRange: 1...5,
            steps: [
                SkillStep(title: "¿Qué registrar?", instruction: "Además del check-in diario en Bloom, anota: qué detonó la emoción, qué pensaste, qué sentiste en el cuerpo, qué hiciste, y qué consecuencias tuvo."),
                SkillStep(title: "Busca patrones", instruction: "Después de una semana, revisa tus registros. ¿Hay días peores que otros? ¿Situaciones que se repiten? ¿Personas que activan ciertas emociones?"),
                SkillStep(title: "Vulnerabilidad", instruction: "Nota si el sueño, hambre, ejercicio o ciclo menstrual afectan tus emociones. Bloom registra sueño y hambre — compara con tu emoción predominante."),
                SkillStep(title: "Evalúa tus estrategias", instruction: "¿Qué has hecho que ha funcionado? ¿Qué no? Escribe qué habilidades te han ayudado y cuáles quieres probar."),
            ],
            totalDurationSeconds: 0,
            durationLabel: "3 min lectura",
            tips: [
                "Usa la función \"Observar y Describir\" de Bloom para registros más detallados",
                "No juzgues lo que escribes — observa y describe",
                "Revisa tu calendario emocional en Bloom semanalmente",
            ],
            icon: "📓",
            order: 8
        ),

        // ── Mindfulness (4) ──
        Skill(
            id: "escaneo_corporal",
            title: "Escaneo corporal",
            description: "Conecta con tu cuerpo escaneando cada zona con atención plena.",
            longDescription: "El escaneo corporal es una práctica fundamental de mindfulness. Recorres mentalmente tu cuerpo de pies a cabeza, observando sensaciones sin intentar cambiarlas. Te ayuda a reconectar con tu cuerpo, identificar tensión acumulada, y bajar de la mente al presente.",
            category: .mindfulness,
            type: .exercise,
            targetEmotions: [.ansiedad, .calma, .frustracion, .ira],
            intensityRange: 1...4,
            steps: [
                SkillStep(title: "Posición", instruction: "Acuéstate o siéntate cómodamente. Cierra los ojos. Haz 3 respiraciones profundas para centrar tu atención.", durationSeconds: 15),
                SkillStep(title: "Pies", instruction: "Lleva tu atención a los pies. Nota la temperatura, la presión contra el suelo, cualquier cosquilleo. Solo observa, sin juzgar.", durationSeconds: 15),
                SkillStep(title: "Piernas", instruction: "Sube la atención por las piernas: pantorrillas, rodillas, muslos. ¿Hay tensión? ¿Pesadez? Solo nota.", durationSeconds: 15),
                SkillStep(title: "Abdomen", instruction: "Observa tu abdomen. Siente cómo sube y baja con la respiración. ¿Hay nudos? ¿Mariposas? Respira hacia esa zona.", durationSeconds: 15),
                SkillStep(title: "Pecho", instruction: "Nota el ritmo de tu corazón. Siente cómo se expande tu pecho con cada inhalación. ¿Hay opresión o amplitud?", durationSeconds: 15),
                SkillStep(title: "Brazos y manos", instruction: "Recorre tus hombros, brazos, manos, dedos. Nota cualquier tensión en los hombros. Suelta lo que puedas.", durationSeconds: 15),
                SkillStep(title: "Cuello y cara", instruction: "Observa la mandíbula, la frente, los ojos. Mucha tensión se acumula aquí. Suaviza la expresión facial.", durationSeconds: 15),
                SkillStep(title: "Cuerpo completo", instruction: "Siente tu cuerpo como un todo. Respira como si todo tu cuerpo respirara. Abre los ojos lentamente.", durationSeconds: 15),
            ],
            totalDurationSeconds: 120,
            durationLabel: "2 min",
            tips: [
                "Es normal que la mente se distraiga — simplemente vuelve al cuerpo",
                "No intentes relajarte — solo observa lo que hay",
                "Puedes hacerlo en cualquier momento: en el bus, antes de dormir, en una pausa",
            ],
            icon: "🫁",
            order: 9
        ),
        Skill(
            id: "anclaje_54321",
            title: "Anclaje 5-4-3-2-1",
            description: "Usa tus 5 sentidos para anclarte al momento presente.",
            longDescription: "Cuando la ansiedad o el pánico te desconectan del presente, tus sentidos son tu ancla. Esta técnica de grounding te trae al aquí y ahora usando la vista, oído, tacto, olfato y gusto. Es rápida, discreta, y puedes hacerla en cualquier lugar.",
            category: .mindfulness,
            type: .exercise,
            targetEmotions: [.ansiedad, .miedo, .sorpresa],
            intensityRange: 3...5,
            steps: [
                SkillStep(title: "Pausa", instruction: "Detente. Respira profundamente una vez. Abre los ojos y mira a tu alrededor.", durationSeconds: 8),
                SkillStep(title: "5 cosas que ves", instruction: "Nombra 5 cosas que puedes ver. Puede ser cualquier cosa: una pared, una luz, tus manos, una planta, una nube.", durationSeconds: 15),
                SkillStep(title: "4 cosas que tocas", instruction: "Nota 4 cosas que puedes tocar. La tela de tu ropa, la silla, tu pelo, la temperatura del aire.", durationSeconds: 15),
                SkillStep(title: "3 cosas que oyes", instruction: "Identifica 3 sonidos. El ruido de fondo, tu respiración, un pájaro, el tráfico.", durationSeconds: 12),
                SkillStep(title: "2 cosas que hueles", instruction: "Nota 2 olores. Si no percibes ninguno, acércate a algo: tu ropa, tu café, una flor.", durationSeconds: 10),
                SkillStep(title: "1 cosa que saboreas", instruction: "Nota el sabor en tu boca. Bebe un poco de agua y saboréala conscientemente.", durationSeconds: 10),
                SkillStep(title: "Cierra", instruction: "Respira profundamente. Estás aquí, ahora, a salvo. Tu cuerpo está bien.", durationSeconds: 8),
            ],
            totalDurationSeconds: 78,
            durationLabel: "~1 min",
            tips: [
                "Perfecto para ataques de pánico o disociación",
                "Puedes hacerlo discretamente en cualquier situación",
                "Si estás a solas, nombra las cosas en voz alta — es más efectivo",
            ],
            icon: "⚓",
            order: 10
        ),
        Skill(
            id: "observar_sin_juzgar",
            title: "Observar sin juzgar",
            description: "Practica la observación neutral de tu experiencia interna.",
            longDescription: "Nuestra mente etiqueta automáticamente todo como \"bueno\" o \"malo\". Esta práctica fundamental de mindfulness te enseña a observar pensamientos, emociones y sensaciones sin añadir juicios. No se trata de ser indiferente, sino de ver con claridad antes de reaccionar.",
            category: .mindfulness,
            type: .exercise,
            targetEmotions: [.ansiedad, .calma, .tristeza, .ira],
            intensityRange: 1...3,
            steps: [
                SkillStep(title: "Siéntate", instruction: "Busca un lugar tranquilo. Siéntate con la espalda recta. Cierra los ojos o baja la mirada.", durationSeconds: 10),
                SkillStep(title: "Observa pensamientos", instruction: "Imagina que tus pensamientos son nubes pasando por el cielo. No los atrapes — solo obsérvalos aparecer y desaparecer.", durationSeconds: 30),
                SkillStep(title: "Nota los juicios", instruction: "Cuando notes un juicio (\"esto es ridículo\", \"no sirvo para esto\"), etiquétalo como \"juicio\" y déjalo pasar.", durationSeconds: 30),
                SkillStep(title: "Describe sin juzgar", instruction: "En vez de \"me siento mal\", prueba \"noto una presión en el pecho\". En vez de \"estoy fatal\", prueba \"mi mente está agitada\".", durationSeconds: 30),
                SkillStep(title: "Acepta lo que hay", instruction: "Observa lo que estás sintiendo sin intentar cambiarlo. No tiene que gustarte. Solo reconoce: \"esto es lo que hay ahora\".", durationSeconds: 30),
                SkillStep(title: "Cierra", instruction: "Abre los ojos lentamente. Nota cómo se siente tu cuerpo después de observar sin juzgar.", durationSeconds: 10),
            ],
            totalDurationSeconds: 140,
            durationLabel: "~2 min",
            tips: [
                "No te juzgues por juzgar — nota el juicio y sigue",
                "Cambia \"debería\" por \"podría\" en tu vocabulario interno",
                "Practica con cosas pequeñas: la comida, el tiempo, el tráfico",
            ],
            icon: "👁️",
            order: 11
        ),
        Skill(
            id: "respiracion_consciente",
            title: "Respiración consciente",
            description: "Usa la respiración como ancla para la atención plena.",
            longDescription: "La respiración consciente es la práctica más sencilla y poderosa de mindfulness. Tu respiración siempre está contigo, siempre en el presente. Usarla como ancla te permite entrenar la atención y calmar el sistema nervioso simultáneamente.",
            category: .mindfulness,
            type: .exercise,
            targetEmotions: [.ansiedad, .calma, .miedo, .frustracion],
            intensityRange: 1...4,
            steps: [
                SkillStep(title: "Posición", instruction: "Siéntate cómodamente. Puedes cerrar los ojos o mirar un punto fijo. No necesitas cambiar tu respiración.", durationSeconds: 10),
                SkillStep(title: "Observa la respiración", instruction: "Nota dónde sientes más la respiración: la nariz, el pecho o el abdomen. Elige un punto y quédate ahí.", durationSeconds: 15),
                SkillStep(title: "Cuenta las respiraciones", instruction: "Cuenta cada exhalación: 1, 2, 3... hasta 10. Si pierdes la cuenta, empieza desde 1. Sin frustración.", durationSeconds: 40),
                SkillStep(title: "Sin contar", instruction: "Ahora deja de contar. Solo observa el ritmo natural de tu respiración. Inhalación... exhalación... pausa.", durationSeconds: 30),
                SkillStep(title: "Nota la mente", instruction: "Cuando tu mente se vaya (y lo hará), nota a dónde fue sin juzgar. Luego vuelve suavemente a la respiración.", durationSeconds: 30),
                SkillStep(title: "Cierra", instruction: "Abre los ojos lentamente. Lleva esta conciencia de la respiración contigo al resto del día.", durationSeconds: 10),
            ],
            totalDurationSeconds: 135,
            durationLabel: "~2 min",
            tips: [
                "Empieza con 2 minutos e incrementa gradualmente",
                "No hay respiración \"perfecta\" — cualquiera que hagas está bien",
                "Puedes practicar en cualquier momento: esperando el bus, antes de comer",
            ],
            icon: "🌸",
            order: 12
        ),

        // ── Relaciones interpersonales (3) ──
        Skill(
            id: "dear_man",
            title: "Técnica DEAR MAN",
            description: "Comunica tus necesidades de forma efectiva y asertiva.",
            longDescription: "DEAR MAN es la técnica estrella de DBT para la comunicación asertiva. Te guía paso a paso para pedir lo que necesitas (o decir no) manteniendo la relación y tu autorespeto. Es especialmente útil para personas que tienden a ser pasivas o agresivas.",
            category: .relacionesInterpersonales,
            type: .article,
            targetEmotions: [.ansiedad, .ira, .miedo, .frustracion],
            intensityRange: 1...4,
            steps: [
                SkillStep(title: "D — Describir", instruction: "Describe la situación con hechos. Sin juicios ni interpretaciones. \"Cuando llegas tarde...\" no \"Siempre llegas tarde porque no te importo\"."),
                SkillStep(title: "E — Expresar", instruction: "Expresa cómo te sientes con \"yo\": \"Me siento frustrada cuando...\" No \"Me haces sentir...\". Tus emociones son tuyas."),
                SkillStep(title: "A — Afirmar", instruction: "Afirma lo que necesitas o quieres. Da el mayor detalle posible: \"Me gustaría que me avises si vas a llegar tarde\" no \"Quiero que cambies\"."),
                SkillStep(title: "R — Reforzar", instruction: "Explica las consecuencias positivas: \"Si me avisas, no me preocuparé y podremos disfrutar más juntas\"."),
                SkillStep(title: "M — Mantener posición", instruction: "Mantén tu posición si la otra persona intenta desviar el tema. Repite tu petición como un disco rayado, con calma."),
                SkillStep(title: "A — Aparentar confianza", instruction: "Usa un tono de voz firme, mira a los ojos, mantén una postura erguida. Aunque sientas nervios, actúa con confianza."),
                SkillStep(title: "N — Negociar", instruction: "Está bien negociar y buscar un punto medio. Pregunta: \"¿Qué podemos hacer para que las dos estemos cómodas?\""),
            ],
            totalDurationSeconds: 0,
            durationLabel: "5 min lectura",
            tips: [
                "Practica con situaciones pequeñas antes de las grandes",
                "Escríbelo antes de la conversación — ayuda a organizarte",
                "Es normal sentir miedo — la asertividad se entrena",
            ],
            icon: "🗣️",
            order: 13
        ),
        Skill(
            id: "validacion",
            title: "Validación",
            description: "Aprende a validar las emociones de otros y las tuyas.",
            longDescription: "Validar no es estar de acuerdo — es comunicar que la experiencia emocional de la otra persona (o la tuya) tiene sentido. La validación es la herramienta más potente para construir confianza y reducir conflictos. Hay 6 niveles de validación, del más básico al más profundo.",
            category: .relacionesInterpersonales,
            type: .article,
            targetEmotions: [.calma, .tristeza, .ira, .gratitud],
            intensityRange: 1...3,
            steps: [
                SkillStep(title: "Nivel 1 — Estar presente", instruction: "Pon atención completa. Guarda el móvil, mira a los ojos, asiente. Tu presencia comunica: \"lo que dices importa\"."),
                SkillStep(title: "Nivel 2 — Reflejar", instruction: "Repite lo esencial de lo que escuchaste: \"Entonces lo que me dices es que te sentiste ignorada en la reunión\". Demuestra que escuchas."),
                SkillStep(title: "Nivel 3 — Leer entre líneas", instruction: "Nombra lo que no se dice: \"Parece que eso te dolió mucho\" o \"Suena a que te sentiste traicionada\". Valida la emoción implícita."),
                SkillStep(title: "Nivel 4 — Validar con la historia", instruction: "Conecta con su pasado: \"Tiene sentido que reacciones así, dado lo que viviste antes\". La historia explica la reacción."),
                SkillStep(title: "Nivel 5 — Normalizar", instruction: "\"Cualquier persona se sentiría así en tu situación\". La reacción es normal, humana, comprensible."),
                SkillStep(title: "Nivel 6 — Igualdad radical", instruction: "Tratar al otro como igual, capaz, no como alguien frágil que necesita ser protegido. Confiar en sus recursos."),
            ],
            totalDurationSeconds: 0,
            durationLabel: "4 min lectura",
            tips: [
                "Empieza validándote a ti misma — es la base",
                "Validar no es \"tienes razón\" — es \"entiendo por qué te sientes así\"",
                "Practica con personas cercanas antes de situaciones difíciles",
            ],
            icon: "💝",
            order: 14
        ),
        Skill(
            id: "escucha_activa",
            title: "Escucha activa",
            description: "Practica una escucha profunda y presente.",
            longDescription: "Escuchar de verdad es un acto de generosidad. La escucha activa va más allá de oír palabras — implica atender con todo tu ser, sin planear tu respuesta, sin interrumpir, sin resolver. Es una de las habilidades más difíciles y más transformadoras.",
            category: .relacionesInterpersonales,
            type: .exercise,
            targetEmotions: [.calma, .gratitud, .ansiedad],
            intensityRange: 1...3,
            steps: [
                SkillStep(title: "Prepárate", instruction: "Antes de tu próxima conversación, establece una intención: \"Voy a escuchar sin interrumpir y sin pensar en mi respuesta\".", durationSeconds: 10),
                SkillStep(title: "Atención completa", instruction: "Guarda el móvil, mira a la persona, gira tu cuerpo hacia ella. Muestra con tu cuerpo que estás presente.", durationSeconds: 15),
                SkillStep(title: "No interrumpas", instruction: "Cuando sientas el impulso de interrumpir, nota el impulso y respira. Espera a que la persona termine. Hay espacio para ti después.", durationSeconds: 20),
                SkillStep(title: "Refleja", instruction: "Cuando la persona termine, refleja lo que escuchaste: \"Lo que entiendo es que...\" Esto muestra comprensión y da espacio para corregir.", durationSeconds: 15),
                SkillStep(title: "Pregunta", instruction: "Haz preguntas abiertas: \"¿Cómo te sentiste?\", \"¿Qué necesitas?\". Evita preguntas que empiecen con \"¿Por qué?\" — pueden sonar como juicio.", durationSeconds: 15),
                SkillStep(title: "Valida", instruction: "Antes de dar tu opinión (si la piden), valida: \"Tiene sentido que te sientas así\". La validación siempre va antes del consejo.", durationSeconds: 10),
            ],
            totalDurationSeconds: 85,
            durationLabel: "~1 min",
            tips: [
                "Practicar escucha activa transforma todas tus relaciones",
                "Si te cuesta no interrumpir, toca tus dedos como recordatorio",
                "La persona no siempre necesita consejos — a veces solo necesita ser escuchada",
            ],
            icon: "👂",
            order: 15
        ),

        // ── Autocuidado (3) ──
        Skill(
            id: "rutina_please",
            title: "Rutina PLEASE",
            description: "Cuida las bases físicas para la estabilidad emocional.",
            longDescription: "PLEASE es un acrónimo DBT para los factores físicos que afectan tu vulnerabilidad emocional. Cuando tu cuerpo no está bien cuidado, eres más propensa a reacciones emocionales intensas. Cuidar estas bases no elimina los problemas, pero te da más resiliencia.",
            category: .autocuidado,
            type: .article,
            targetEmotions: [.tristeza, .ansiedad, .frustracion, .calma],
            intensityRange: 1...3,
            steps: [
                SkillStep(title: "PL — Tratar enfermedades", instruction: "Cuida tu salud física: toma tus medicinas, ve al médico cuando lo necesites, no ignores síntomas. Tu cuerpo y mente están conectados."),
                SkillStep(title: "E — Alimentación equilibrada", instruction: "Come de forma regular y equilibrada. Evita saltarte comidas. Reduce el azúcar y la cafeína si notas que afectan tu estado emocional. Bloom registra tu nivel de hambre — úsalo."),
                SkillStep(title: "A — Evita sustancias", instruction: "Reduce el alcohol y otras sustancias que alteren tu estado de ánimo. Incluso la cafeína puede aumentar la ansiedad significativamente."),
                SkillStep(title: "S — Sueño", instruction: "Prioriza dormir 7-9 horas. Mantén horarios regulares, evita pantallas antes de dormir, y crea un ritual nocturno. Bloom registra tu calidad de sueño — observa los patrones."),
                SkillStep(title: "E — Ejercicio", instruction: "Mueve tu cuerpo al menos 20 minutos al día. No tiene que ser intenso: caminar, yoga, bailar. El ejercicio es el antidepresivo natural más potente."),
            ],
            totalDurationSeconds: 0,
            durationLabel: "3 min lectura",
            tips: [
                "No intentes cambiar todo a la vez — elige un área para empezar",
                "Usa tus check-ins de Bloom para ver cómo el sueño afecta tus emociones",
                "Pequeños hábitos consistentes > cambios drásticos temporales",
            ],
            icon: "🌱",
            order: 16
        ),
        Skill(
            id: "relajacion_muscular",
            title: "Relajación muscular progresiva",
            description: "Libera la tensión acumulada grupo muscular por grupo muscular.",
            longDescription: "La relajación muscular progresiva (RMP) de Jacobson te enseña a reconocer y liberar la tensión física. Tensas deliberadamente cada grupo muscular y luego lo sueltas, creando una ola de relajación. Es especialmente útil para insomnio, ansiedad y tensión crónica.",
            category: .autocuidado,
            type: .exercise,
            targetEmotions: [.ansiedad, .ira, .frustracion, .calma],
            intensityRange: 2...4,
            steps: [
                SkillStep(title: "Posición", instruction: "Acuéstate o siéntate cómodamente. Cierra los ojos. Respira profundamente 3 veces.", durationSeconds: 12),
                SkillStep(title: "Pies y piernas", instruction: "Tensa los pies y las pantorrillas durante 5 segundos... y suelta. Nota el contraste. Siente la relajación.", durationSeconds: 15),
                SkillStep(title: "Muslos y glúteos", instruction: "Tensa los muslos y glúteos durante 5 segundos... y suelta. Deja que la pesadez te ancle.", durationSeconds: 15),
                SkillStep(title: "Abdomen", instruction: "Aprieta el abdomen como si alguien fuera a tocarte... 5 segundos... y suelta. Respira hacia el abdomen relajado.", durationSeconds: 15),
                SkillStep(title: "Manos y brazos", instruction: "Cierra los puños con fuerza, tensa los brazos... 5 segundos... y suelta. Deja que los brazos caigan pesados.", durationSeconds: 15),
                SkillStep(title: "Hombros y cuello", instruction: "Sube los hombros hasta las orejas... 5 segundos... y suelta. Gira suavemente el cuello.", durationSeconds: 15),
                SkillStep(title: "Cara", instruction: "Arruga toda la cara: frente, ojos, boca... 5 segundos... y suelta. Suaviza la expresión completamente.", durationSeconds: 15),
                SkillStep(title: "Cuerpo completo", instruction: "Tensa TODO el cuerpo a la vez... 5 segundos... y suelta completamente. Quédate unos segundos disfrutando la relajación.", durationSeconds: 20),
            ],
            totalDurationSeconds: 122,
            durationLabel: "2 min",
            tips: [
                "Ideal antes de dormir — ayuda con el insomnio",
                "No tenses al punto del dolor — solo una tensión moderada",
                "Con práctica, puedes relajar directamente sin tensar primero",
            ],
            icon: "💆",
            order: 17
        ),
        Skill(
            id: "lugar_seguro",
            title: "Lugar seguro",
            description: "Visualiza un espacio de calma y protección interior.",
            longDescription: "La visualización del lugar seguro crea un refugio mental al que puedes acudir en cualquier momento de estrés. Con la práctica, tu cuerpo responde a la visualización casi como si estuvieras realmente ahí. Es una herramienta poderosa de autorregulación.",
            category: .autocuidado,
            type: .exercise,
            targetEmotions: [.ansiedad, .miedo, .tristeza, .calma],
            intensityRange: 1...4,
            steps: [
                SkillStep(title: "Relájate", instruction: "Cierra los ojos. Respira profundamente 3 veces. Con cada exhalación, deja ir un poco de tensión.", durationSeconds: 15),
                SkillStep(title: "Elige tu lugar", instruction: "Piensa en un lugar donde te sientas en total seguridad y en paz. Puede ser real o imaginario: una playa, un bosque, tu habitación, un jardín.", durationSeconds: 15),
                SkillStep(title: "Mira", instruction: "¿Qué ves en tu lugar seguro? Los colores, la luz, los objetos. Haz la imagen lo más vívida posible.", durationSeconds: 20),
                SkillStep(title: "Escucha", instruction: "¿Qué sonidos hay? Olas, pájaros, viento, silencio, música. Deja que los sonidos te envuelvan.", durationSeconds: 15),
                SkillStep(title: "Siente", instruction: "¿Qué sientes en tu piel? La brisa, la temperatura, la textura del suelo bajo tus pies. ¿Hay aromas?", durationSeconds: 15),
                SkillStep(title: "Emociones", instruction: "Nota qué emociones surgen aquí. Seguridad, calma, calidez, paz. Deja que esas emociones llenen tu cuerpo.", durationSeconds: 20),
                SkillStep(title: "Ancla", instruction: "Elige una palabra o gesto que represente este lugar (ej: \"paz\", tocar tu pecho). Úsalo para volver aquí rápidamente.", durationSeconds: 15),
                SkillStep(title: "Regresa", instruction: "Poco a poco, trae tu atención de vuelta. Mueve los dedos, abre los ojos. Tu lugar seguro siempre está contigo.", durationSeconds: 10),
            ],
            totalDurationSeconds: 125,
            durationLabel: "~2 min",
            tips: [
                "Practica cuando estés en calma para que funcione en momentos de crisis",
                "Usa siempre el mismo lugar — se fortalece con la repetición",
                "El ancla (palabra/gesto) te ayuda a activar la calma rápidamente",
            ],
            icon: "🏡",
            order: 18
        ),
    ]
}
