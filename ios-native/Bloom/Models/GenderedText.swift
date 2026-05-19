import Foundation

/// Texto con tres flexiones (femenino, masculino, neutro). Equivalente al
/// objeto `{ f, m, n }` que la app RN pasa a `g(...)` en `GenderContext`.
///
/// Para resolverlo a `String` se usa `GenderService.resolve(_:)`, que aplica
/// la forma elegida por el usuario. Si el usuario aún no ha tocado el
/// selector, el servicio devuelve la forma `.neutro`.
struct GenderedText: Sendable {
    let f: String
    let m: String
    let n: String

    init(f: String, m: String, n: String) {
        self.f = f
        self.m = m
        self.n = n
    }
}
