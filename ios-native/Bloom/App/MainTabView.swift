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

            InsightsView()
                .tabItem { Label("Insights", systemImage: "chart.line.uptrend.xyaxis") }

            NotesView()
                .tabItem { Label("Notas", systemImage: "note.text") }

            SkillsView()
                .tabItem { Label("Habilidades", systemImage: "sparkles") }
        }
        .tint(Theme.Palette.primary500)
    }
}
