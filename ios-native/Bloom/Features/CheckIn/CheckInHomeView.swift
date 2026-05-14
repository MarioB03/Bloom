import SwiftUI

/// Pantalla principal: check-in del día y "jardín de bienestar".
/// Equivalente a `app/(tabs)/index.tsx` en la app React Native.
struct CheckInHomeView: View {
    var body: some View {
        PlaceholderScreen(title: "Tu jardín de hoy", systemImage: "leaf.fill")
    }
}

#Preview {
    CheckInHomeView()
}
