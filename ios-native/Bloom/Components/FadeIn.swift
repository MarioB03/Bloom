import SwiftUI

/// Envuelve contenido y lo anima con un fade + slide-up al aparecer.
/// Portado de `src/components/ui/FadeIn.tsx`.
struct FadeIn<Content: View>: View {

    var delay: Double = 0
    var duration: Double = 0.5
    var slideUp: CGFloat = 20
    @ViewBuilder var content: Content

    @State private var opacity: Double = 0
    @State private var offsetY: CGFloat

    init(
        delay: Double = 0,
        duration: Double = 0.5,
        slideUp: CGFloat = 20,
        @ViewBuilder content: () -> Content
    ) {
        self.delay = delay
        self.duration = duration
        self.slideUp = slideUp
        self.content = content()
        self._offsetY = State(initialValue: slideUp)
    }

    var body: some View {
        content
            .opacity(opacity)
            .offset(y: offsetY)
            .onAppear {
                withAnimation(.easeOut(duration: duration).delay(delay)) {
                    opacity = 1
                    offsetY = 0
                }
            }
    }
}
