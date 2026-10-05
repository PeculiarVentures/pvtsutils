import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*.ts", "!src/**/*.spec.ts"],
  // Keep one output file per source file so subpath exports, including `./encoding/*`, map directly onto the build tree.
  unbundle: true,
  format: ["esm", "cjs"],
  fixedExtension: true,
  dts: true,
  clean: true,
  deps: {
    neverBundle: true,
  },
  outDir: "build",
  tsconfig: "tsconfig.json",
});
