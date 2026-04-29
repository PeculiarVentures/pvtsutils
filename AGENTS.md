# Project Guide

## Architecture

- `src/index.ts` is the public entry point and should stay aligned with package exports.
- `src/bytes/` contains BufferSource and ArrayBuffer helpers.
- `src/encoding/` contains hex, binary, UTF-8, UTF-16, base64, and base64url helpers.
- `src/converters/` contains the converter registry and default adapters.
- `src/pem/` contains PEM parsing and formatting helpers.
- `src/legacy/` keeps the compatibility layer for older APIs.

## Build And Release

- Build with `npm run build`; the project now uses `tsc -b` and writes ESM/CJS JS output plus declarations under `build/`.
- Keep published paths in `package.json` in sync with the actual build output.
- Do not commit generated build artifacts.

## Code Rules

- Prefer BufferSource-based public APIs over Node-specific `Buffer` types.
- Keep changes small and localized to the owning module.
- Preserve the existing dual-module packaging model unless a change explicitly updates both sides.
- Keep exports stable unless the user explicitly asks for a breaking change.
- Document every public exported type, function, method, and exported object member with concise TSDoc.

## Testing

- Use `vitest` for tests.
- Put co-located tests next to source files as `*.spec.ts`.
- Put shared or cross-cutting cases in `tests/*.test.ts`.
- Run `npm run check` before finishing any code change task.
- `npm test` must run once and exit.
- `npm run coverage` must produce coverage output without counting test files.

## Linting And Formatting

- Use ESLint for linting and save-time formatting.
- Keep the ESLint config practical; disable style rules only when they fight the established code style.
- Prefer source fixes over expanding the rule set when a rule only creates noisy churn.
