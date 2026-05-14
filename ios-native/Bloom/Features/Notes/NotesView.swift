import SwiftUI

/// Notas y registros emocionales.
/// Equivalente a `app/(tabs)/notas.tsx` en la app React Native.
struct NotesView: View {
    var body: some View {
        PlaceholderScreen(title: "Notas", systemImage: "note.text")
    }
}

#Preview {
    NotesView()
}
