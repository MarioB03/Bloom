# CI iOS → TestFlight (sin Mac local)

Bloom se compila en **GitHub Actions** (`macos-15`) y se sube a App Store Connect / TestFlight.

## Secrets de GitHub (Settings → Secrets and variables → Actions)

Crea una **App Store Connect API Key** (Users and Access → Integrations → Team Keys):

| Secret | Qué es |
|--------|--------|
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID (ej. `AB12CD34EF`) |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID (UUID de la página de keys) |
| `APP_STORE_CONNECT_API_KEY` | Contenido completo del `.p8` (incluye `-----BEGIN PRIVATE KEY-----`) |

Rol mínimo de la key: **App Manager** (o Admin).

No subas el `.p8` al repo.

## Cómo lanzar el build

1. Mergea el PR de CI a `main`.
2. GitHub → Actions → **iOS TestFlight** → **Run workflow**.
3. Espera ~20–40 min.
4. En App Store Connect → TestFlight, cuando el build esté Ready to Test, asígnalo a **GP Grupo Pruebas**.

## Notas

- El proyecto se genera con **XcodeGen** (`xcodegen generate`) en el runner.
- Bundle IDs: `com.akemi01.bloom` + widget `com.akemi01.bloom.widget`.
- Team: `LLU2292H63`.
- Build number actual en `project.yml`: `20`. Si ASC rechaza un duplicado, súbelo en `CURRENT_PROJECT_VERSION` y vuelve a lanzar.
