import { mkdirSync, writeFileSync } from "node:fs";

// The package root declares "type": "module", so every nested file would be
// treated as ESM. These markers tell Node and TypeScript that the CommonJS
// output directories - both the JavaScript and its declarations - are CommonJS.
for (const dir of ["build/cjs", "build/types-cjs"]) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/package.json`, "{\n  \"type\": \"commonjs\"\n}\n");
}
