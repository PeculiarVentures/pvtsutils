## [3.0.1](https://github.com/PeculiarVentures/pvtsutils/compare/v3.0.0...v3.0.1) (2026-10-13)

### Build System

* declare `node >=16` engine; build output is now lowered to Node.js 16 syntax ([#37](https://github.com/PeculiarVentures/pvtsutils/issues/37)) ([a295b30](https://github.com/PeculiarVentures/pvtsutils/commit/a295b302afc5fe9f0715a61f494638208ad45d2c))

# [3.0.0](https://github.com/PeculiarVentures/pvtsutils/compare/v2.0.3...v3.0.0) (2026-10-08)

### BREAKING CHANGES

* Removed per-file `./encoding/*` subpath exports. Import encoding helpers from `@peculiar/utils/encoding` or the package root instead.
* Build switched to tsdown; output moved from `build/{cjs,esm,types}/` to flat `build/*.js`/`.cjs` entries. Only paths listed in `exports` are supported.
