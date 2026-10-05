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
  deps: {
    neverBundle: true,
  },
  exports: {
    all: false,
    legacy: true,
  },
  outDir: "build",
  tsconfig: "tsconfig.json",
});
