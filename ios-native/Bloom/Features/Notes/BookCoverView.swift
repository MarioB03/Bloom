import SwiftUI

/// Portada del diario a pantalla completa, usada en la animación de apertura.
/// Portado de `BookCover` en `app/agenda.tsx`.
struct BookCoverView: View {
    var body: some View {
        ZStack(alignment: .leading) {
            Theme.Palette.primary600

            // Lomo
            Rectangle()
                .fill(Theme.Palette.primary700)
                .frame(width: 6)
                .frame(maxHeight: .infinity)

            // Contenido de la portada, con marco decorativo
            VStack(spacing: 12) {
                Text("📓")
                    .font(.system(size: 48))
                Text("Mi Diario")
                    .font(.displayLarge)
                    .foregroundStyle(Theme.Palette.neutral50)
                Capsule()
                    .fill(Theme.Palette.accent400)
                    .frame(width: 60, height: 2)
                Text("BLOOM")
                    .font(.caption)
                    .tracking(2)
                    .foregroundStyle(Theme.Palette.accent200)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .strokeBorder(Theme.Palette.primary300, lineWidth: 1)
            )
            .padding(28)
        }
        .ignoresSafeArea()
    }
}

/// Mini-libro flotante del home: toca para abrir el diario.
/// Portado del `miniBook` de `app/(tabs)/index.tsx`.
struct MiniDiaryBook: View {
    var body: some View {
        ZStack(alignment: .leading) {
            Theme.Palette.primary600

            // Lomo
            Rectangle()
                .fill(Theme.Palette.primary700)
                .frame(width: 4)
                .frame(maxHeight: .infinity)

            // Contenido de la portada
            VStack(spacing: 2) {
                Text("📓")
                    .font(.system(size: 22))
                Text("Mi Diario")
                    .font(.custom("DMSerifDisplay-Regular", size: 9))
                    .foregroundStyle(Theme.Palette.neutral50)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            // Cantos de las páginas (lado derecho)
            HStack {
                Spacer()
                Rectangle()
                    .fill(Color.black.opacity(0.08))
                    .frame(width: 2)
                    .frame(maxHeight: .infinity)
            }
        }
        .frame(width: 64, height: 82)
        .clipShape(RoundedRectangle(cornerRadius: 6))
        .bloomShadow(.warm)
    }
}
