# Project Guide

## Architecture

- `src/index.ts` is the public entry point and should stay aligned with package exports.
- `src/bytes/` contains BufferSource and ArrayBuffer helpers.
- `src/encoding/` contains hex, binary, UTF-8, UTF-16, base64, and base64url helpers.
- `src/converters/` contains the converter registry and default adapters.
- `src/pem/` contains PEM parsing and formatting helpers.
- `src/legacy/` keeps the compatibility layer for older APIs.

## Build And Release

- Build with `npm run build`; tsdown (`tsdown.config.ts`) bundles one named entry per public subpath (`index`, `bytes`, `encoding`, `converters`, `pem`, `legacy`) into `build/<entry>.mjs`/`.cjs` files with `.d.mts`/`.d.cts` declarations. Output is unbundled (`unbundle: true`): every source module is emitted under `build/` mirroring `src/`, plus rolldown's runtime helpers in `build/_virtual/`. Only the entry files are reachable through `exports`.
- tsdown generates `exports`, `main`, `module`, and `types` in `package.json` on every build, using plain `import`/`require` conditions. Do not hand-edit those fields; add or rename a public subpath by changing `entry` in `tsdown.config.ts`, then rebuild and commit the regenerated `package.json`.
- Encoding helpers are published only through `./encoding` (and the root entry) as namespaces; there are no per-file `./encoding/*` subpaths.
- Do not commit generated build artifacts.
- Releases are managed by [release-please](https://github.com/googleapis/release-please) (`release-please-config.json`, `.release-please-manifest.json`). On every push to `master`, the **Publish** workflow opens or updates a `chore(release): v<version>` PR that bumps `package.json`/`package-lock.json`; the version is derived from the commits (breaking change → major, `feat` → minor, anything else → patch). Merging that PR makes release-please create the `v<version>` tag and the GitHub Release with the notes from the PR; the workflow then runs checks on the tagged commit, publishes to npm, and moves the major tag. Run **Publish** manually to retry a failed npm publish for the current version. Set the optional `RELEASE_TOKEN` secret (PAT or GitHub App token) so checks run on the release PR.
- Release notes live only in GitHub Releases; there is no `CHANGELOG.md`. Only `feat`, `fix`, `perf`, `build`, `revert`, and breaking changes are listed, and only those trigger a release PR. Force a version with a `Release-As: x.y.z` line in a commit body. To fix the notes for a merged change, add a `BEGIN_COMMIT_OVERRIDE` … `END_COMMIT_OVERRIDE` block with the corrected commit message to that PR's description; edits to the release PR description are overwritten when new commits land.
- Use Conventional Commit messages (and squash-merge PR titles) so they land in the release notes.

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
