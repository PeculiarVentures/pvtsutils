# Project Guide

## Architecture

- `src/index.ts` is the public entry point and should stay aligned with package exports.
- `src/bytes/` contains BufferSource and ArrayBuffer helpers.
- `src/encoding/` contains hex, binary, UTF-8, UTF-16, base64, and base64url helpers.
- `src/converters/` contains the converter registry and default adapters.
- `src/pem/` contains PEM parsing and formatting helpers.
- `src/legacy/` keeps the compatibility layer for older APIs.

## Build And Release

- Build with `npm run build`; tsdown (`tsdown.config.ts`) writes an unbundled tree under `build/` that mirrors `src/`, with `.mjs`/`.cjs` output and `.d.mts`/`.d.cts` declarations.
- Package exports use `module` (ESM, for bundlers) and `default` (CJS) conditions so Node always loads a single copy of the package. Inside `default`, `node` serves CJS types and runtime to Node and TS `nodenext`, and a types-only `import` branch gives TS `bundler` mode the `.d.mts` types that match the ESM file bundlers load; keep this shape for every subpath.
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
- Run `npm run lint`, `npm run format:check`, `npm run typecheck`, and `npm test` before finishing any code change task.
- `npm test` must run once and exit.
- `npm run coverage` must produce coverage output without counting test files.

## Linting And Formatting

- Use oxlint (`.oxlintrc.json`) for linting and oxfmt (`.oxfmtrc.json`) for formatting, including save-time formatting.
- Keep the oxlint config practical; disable rules only when they fight the established code style.
- Prefer source fixes over expanding the rule set when a rule only creates noisy churn.
