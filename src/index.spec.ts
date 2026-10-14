import { describe, expect, it } from "vitest";

import { base64, bytes, hex, utf8 } from "../src";

describe("public API", () => {
  it("concatenates and compares buffers", () => {
    const combined = bytes.concat(new Uint8Array([1, 2]), new Uint8Array([3, 4]));

    expect(Array.from(new Uint8Array(combined))).toEqual([1, 2, 3, 4]);
    expect(bytes.equal(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(true);
    expect(bytes.equal(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(false);
  });

  it("round-trips the common encodings", () => {
    const payload = utf8.encode("hi");

    expect(hex.encode(payload)).toBe("6869");
    expect(base64.encode(payload)).toBe("aGk=");
    expect(utf8.decode(base64.decode("aGk="))).toBe("hi");
  });
});
