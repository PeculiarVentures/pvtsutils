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
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  // Emit one file per source module. Bundled multi-entry declarations leave
  // rolldown's `__exportAll` namespace helper in shared `.d.cts` chunks
  // (see rolldown/tsdown#1051); unbundled output keeps it in its own module.
  unbundle: true,
  // Keep .js/.mjs/.d.ts output names (package.json is "type": "commonjs")
  // instead of tsdown's node-platform default of fixed .cjs/.mjs extensions.
  fixedExtension: false,
  deps: {
    neverBundle: true,
  },
  exports: {
    all: false,
    legacy: true,
  },
  outDir: "build",
  tsconfig: "tsconfig.json",
  attw: {
    level: "error",
    profile: "node16",
  },
});
