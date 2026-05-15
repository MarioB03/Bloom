import SwiftUI

/// Navegación principal con las 5 pestañas de Bloom.
/// Equivalente a `app/(tabs)/_layout.tsx` en la app React Native.
struct MainTabView: View {

    @Environment(AuthService.self) private var auth
    @Environment(FirestoreService.self) private var firestore
    @Environment(PremiumService.self) private var premium
    @Environment(SharingService.self) private var sharing

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

            // La pestaña Compartido solo aparece cuando alguien me ha
            // compartido su jardín (mismo criterio que el `href: null` de RN).
            if sharing.sharedAccount != nil {
                SharedTabView()
                    .tabItem { Label(Strings.Sharing.tabTitle, systemImage: "person.2.fill") }
            }

            ProfileView()
                .tabItem { Label(Strings.Profile.tabTitle, systemImage: "person.fill") }
        }
        .tint(Theme.Palette.primary500)
        .task(id: auth.currentUserID) {
            await premium.refresh(userID: auth.currentUserID, firestore: firestore)
            await sharing.refresh(userID: auth.currentUserID, firestore: firestore)
        }
    }
}
