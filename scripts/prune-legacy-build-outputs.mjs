import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

function pruneLegacyOutputs(dirPath) {
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "types") {
        continue;
      }
      pruneLegacyOutputs(entryPath);
      continue;
    }

    if (
      entry.name.endsWith(".mjs")
      || entry.name.endsWith(".cjs")
      || entry.name.endsWith(".d.mts")
      || entry.name.endsWith(".d.cts")
      || entry.name.endsWith(".d.ts")
    ) {
      rmSync(entryPath);
    }
  }
}

try {
  pruneLegacyOutputs("build");
} catch (error) {
  if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") {
    throw error;
  }
}
