import SwiftUI

/// Navegación principal con las 5 pestañas de Bloom.
/// Equivalente a `app/(tabs)/_layout.tsx` en la app React Native.
struct MainTabView: View {
    var body: some View {
        TabView {
            CheckInHomeView()
                .tabItem { Label("Hoy", systemImage: "leaf.fill") }

            CalendarView()
                .tabItem { Label("Calendario", systemImage: "calendar") }

            NotesView()
                .tabItem { Label("Registros", systemImage: "note.text") }

            SkillsView()
                .tabItem { Label("Habilidades", systemImage: "sparkles") }

            ProfileView()
                .tabItem { Label(Strings.Profile.tabTitle, systemImage: "person.fill") }
        }
        .tint(Theme.Palette.primary500)
    }
}
