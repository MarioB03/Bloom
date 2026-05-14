import Foundation
import CryptoKit
import CommonCrypto

/// Cifrado de campos sensibles, compatible byte a byte con `src/lib/crypto.ts`
/// de la app React Native (CryptoJS `AES.encrypt(text, passphrase)`).
///
/// La app nativa y la app RN comparten el mismo proyecto Firestore
/// (`bloom-57653`), así que las notas y los eventos de los check-ins deben
/// poder leerse y escribirse indistintamente desde ambas.
///
/// Formato CryptoJS: `base64( "Salted__" + salt(8) + AES-256-CBC(texto) )`,
/// con clave e IV derivados por `EVP_BytesToKey` (MD5, 1 iteración) a partir
/// de la passphrase y el salt aleatorio.
enum BloomCrypto {

    /// Misma passphrase hardcodeada que la app RN. CryptoJS la trata como
    /// cadena UTF-8 (no como hex), así que aquí se usa igual.
    private static let passphrase = "70b2bec4f217fd190c7b6e43c2fab69de2bc11a7587c10bc1bf45d8aa403f038"

    private static let saltedPrefix = Data("Salted__".utf8)

    /// Cifra `text`. Devuelve el texto original si está vacío o si el cifrado
    /// falla, para no perder datos (mismo fallback que la versión RN).
    static func encrypt(_ text: String) -> String {
        guard !text.isEmpty else { return text }

        let salt = Data((0..<8).map { _ in UInt8.random(in: .min ... .max) })
        let (key, iv) = deriveKeyIV(salt: salt)

        guard let cipher = crypt(.encrypt, data: Data(text.utf8), key: key, iv: iv) else {
            return text
        }
        return (saltedPrefix + salt + cipher).base64EncodedString()
    }

    /// Descifra `ciphertext`. Si no tiene formato CryptoJS o el descifrado
    /// falla, devuelve la cadena tal cual (dato heredado sin cifrar).
    static func decrypt(_ ciphertext: String) -> String {
        guard !ciphertext.isEmpty else { return ciphertext }

        guard
            let payload = Data(base64Encoded: ciphertext),
            payload.count > 16,
            payload.prefix(8) == saltedPrefix
        else {
            return ciphertext
        }

        let salt = payload.subdata(in: 8..<16)
        let cipher = payload.subdata(in: 16..<payload.count)
        let (key, iv) = deriveKeyIV(salt: salt)

        guard
            let plain = crypt(.decrypt, data: cipher, key: key, iv: iv),
            let text = String(data: plain, encoding: .utf8)
        else {
            return ciphertext
        }
        return text
    }

    // MARK: - EVP_BytesToKey (OpenSSL, MD5, 1 iteración)

    /// Deriva 32 bytes de clave + 16 bytes de IV concatenando bloques
    /// `MD5(bloque_anterior + passphrase + salt)`.
    private static func deriveKeyIV(salt: Data) -> (key: Data, iv: Data) {
        let pass = Data(passphrase.utf8)
        var derived = Data()
        var block = Data()

        while derived.count < 48 {
            var md5 = Insecure.MD5()
            md5.update(data: block)
            md5.update(data: pass)
            md5.update(data: salt)
            block = Data(md5.finalize())
            derived.append(block)
        }

        return (derived.prefix(32), derived.subdata(in: 32..<48))
    }

    // MARK: - AES-256-CBC (CommonCrypto)

    private enum Operation {
        case encrypt, decrypt

        var ccValue: CCOperation {
            switch self {
            case .encrypt: CCOperation(kCCEncrypt)
            case .decrypt: CCOperation(kCCDecrypt)
            }
        }
    }

    private static func crypt(_ operation: Operation, data: Data, key: Data, iv: Data) -> Data? {
        let bufferSize = data.count + kCCBlockSizeAES128
        var buffer = Data(count: bufferSize)
        var bytesWritten = 0

        let status = buffer.withUnsafeMutableBytes { bufferPtr in
            data.withUnsafeBytes { dataPtr in
                key.withUnsafeBytes { keyPtr in
                    iv.withUnsafeBytes { ivPtr in
                        CCCrypt(
                            operation.ccValue,
                            CCAlgorithm(kCCAlgorithmAES),
                            CCOptions(kCCOptionPKCS7Padding),
                            keyPtr.baseAddress, key.count,
                            ivPtr.baseAddress,
                            dataPtr.baseAddress, data.count,
                            bufferPtr.baseAddress, bufferSize,
                            &bytesWritten
                        )
                    }
                }
            }
        }

        guard status == kCCSuccess else { return nil }
        return buffer.prefix(bytesWritten)
    }
}
