# [3.0.0](https://github.com/PeculiarVentures/pvtsutils/compare/v2.0.3...v3.0.0) (2026-10-08)

### BREAKING CHANGES

* Removed per-file `./encoding/*` subpath exports. Import encoding helpers from `@peculiar/utils/encoding` or the package root instead.
* Build switched to tsdown; output moved from `build/{cjs,esm,types}/` to flat `build/*.js`/`.cjs` entries. Only paths listed in `exports` are supported.
