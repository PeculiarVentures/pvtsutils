import { existsSync } from "node:fs";
import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const hasBuild = existsSync("build/bytes.mjs");

/** Published subpaths from package.json exports (tsdown entry names). */
const PUBLISHED_SUBPATHS = ["", "/bytes", "/encoding", "/converters", "/pem", "/legacy"] as const;

describe.skipIf(!hasBuild)("published package subpaths", () => {
  it("does not expose rolldown namespace helper exports", () => {
    for (const subpath of PUBLISHED_SUBPATHS) {
      const id = `@peculiar/utils${subpath}`;
      const keys = Object.keys(require(id));
      expect(keys.filter((key) => /_exports$/.test(key))).toEqual([]);
    }
  });

  it("keeps namespace objects on the root and encoding barrels", () => {
    const root = require("@peculiar/utils");
    const encoding = require("@peculiar/utils/encoding");

    expect(typeof root.bytes.concat).toBe("function");
    expect(typeof root.hex.encode).toBe("function");
    expect(typeof encoding.hex.encode).toBe("function");
    expect(root.hex.encode(new Uint8Array([1]))).toBe("01");
  });
});
