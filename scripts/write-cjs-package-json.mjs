import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("build/cjs", { recursive: true });
writeFileSync("build/cjs/package.json", "{\n  \"type\": \"commonjs\"\n}\n");
