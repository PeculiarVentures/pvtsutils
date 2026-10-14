import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    converters: "src/converters/index.ts",
    bytes: "src/bytes/index.ts",
    encoding: "src/encoding/index.ts",
    pem: "src/pem/index.ts",
    legacy: "src/legacy/index.ts",
  },
  // ESM only. CommonJS consumers load it through require(esm) on Node ^20.19 / >=22.12.
  format: ["esm"],
  platform: "neutral",
  dts: true,
  clean: true,
  // Emit one file per source module. Bundled multi-entry declarations leave
  // rolldown's `__exportAll` namespace helper in shared declaration chunks
  // (see rolldown/tsdown#1051); unbundled output keeps it in its own module.
  unbundle: true,
  // Keep .js/.d.ts output names (package.json is "type": "module")
  // instead of fixed .mjs/.d.mts extensions.
  fixedExtension: false,
  deps: {
    neverBundle: true,
  },
  exports: {
    legacy: true,
  },
  outDir: "build",
  tsconfig: "tsconfig.json",
  attw: {
    level: "error",
    // Check every resolution mode, node10 included (served by the legacy fields
    // and `typesVersions`). Only CommonJS-in-TypeScript (`module: node16`)
    // resolving to ESM is expected for an ESM-only package.
    profile: "strict",
    ignoreRules: ["cjs-resolves-to-esm"],
  },
});
