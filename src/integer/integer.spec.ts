import { describe, expect, it } from "vitest";

import { int, uint } from "./index.js";

const list = (data: Uint8Array) => Array.from(data);

describe("uint", () => {
  it("encodes big-endian bytes with the fewest digits", () => {
    expect(list(uint.encode(0))).toEqual([0]);
    expect(list(uint.encode(0x7f))).toEqual([0x7f]);
    expect(list(uint.encode(0x80))).toEqual([0x80]);
    expect(list(uint.encode(0x010203))).toEqual([1, 2, 3]);
    expect(list(uint.encode(Number.MAX_SAFE_INTEGER))).toEqual([0x1f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
  });

  it("encodes base-128 digits", () => {
    // OID arc 113549 -> 86 F7 0D once continuation bits are added
    expect(list(uint.encode(113549, { bitsPerByte: 7 }))).toEqual([0x06, 0x77, 0x0d]);
    expect(uint.decode(new Uint8Array([0x06, 0x77, 0x0d]), { bitsPerByte: 7 })).toBe(113549);
  });

  it("left-pads to a fixed length and rejects values that do not fit", () => {
    expect(list(uint.encode(0x41, { length: 4 }))).toEqual([0, 0, 0, 0x41]);
    expect(() => uint.encode(0, { length: 0 })).toThrow(RangeError);
    expect(() => uint.encode(0x0100, { length: 1 })).toThrow(RangeError);
    expect(() => uint.encode(1, { length: -1 })).toThrow(RangeError);
  });

  it("round-trips values beyond 2^53 as bigint", () => {
    const value = 2n ** 64n + 1n;
    const encoded = uint.encode(value);

    expect(list(encoded)).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 1]);
    expect(uint.decodeBigInt(encoded)).toBe(value);
    expect(() => uint.decode(encoded)).toThrow(RangeError);
  });

  it("decodes numbers up to the safe integer limit", () => {
    expect(uint.decode(new Uint8Array())).toBe(0);
    expect(uint.decode(new Uint8Array([0x01, 0x00]))).toBe(256);
    expect(uint.decode(uint.encode(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => uint.decode(uint.encode(BigInt(Number.MAX_SAFE_INTEGER) + 1n))).toThrow(RangeError);
    expect(uint.decodeBigInt(new ArrayBuffer(0))).toBe(0n);
  });

  it("rejects invalid input", () => {
    expect(() => uint.encode(-1)).toThrow(RangeError);
    expect(() => uint.encode(-1n)).toThrow(RangeError);
    expect(() => uint.encode(1.5)).toThrow(RangeError);
    expect(() => uint.encode(2 ** 53)).toThrow(RangeError);
    expect(() => uint.encode(1, { bitsPerByte: 0 })).toThrow(RangeError);
    expect(() => uint.encode(1, { bitsPerByte: 9 })).toThrow(RangeError);
    expect(() => uint.decode(new Uint8Array([0x80]), { bitsPerByte: 7 })).toThrow(RangeError);
    expect(() => uint.decodeBigInt(new Uint8Array([0x80]), { bitsPerByte: 7 })).toThrow(RangeError);
  });
});

describe("int", () => {
  it("encodes minimal two's complement", () => {
    expect(list(int.encode(0))).toEqual([0x00]);
    expect(list(int.encode(127))).toEqual([0x7f]);
    expect(list(int.encode(128))).toEqual([0x00, 0x80]);
    expect(list(int.encode(256))).toEqual([0x01, 0x00]);
    expect(list(int.encode(-1))).toEqual([0xff]);
    expect(list(int.encode(-128))).toEqual([0x80]);
    expect(list(int.encode(-129))).toEqual([0xff, 0x7f]);
    expect(list(int.encode(-(2n ** 63n)))).toEqual([0x80, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("sign-extends to a fixed length", () => {
    expect(list(int.encode(1, { length: 3 }))).toEqual([0, 0, 1]);
    expect(list(int.encode(-2, { length: 3 }))).toEqual([0xff, 0xff, 0xfe]);
    expect(() => int.encode(128, { length: 1 })).toThrow(RangeError);
    expect(() => int.encode(1, { length: 0 })).toThrow(RangeError);
  });

  it("decodes two's complement", () => {
    expect(int.decode(new Uint8Array([0x00]))).toBe(0);
    expect(int.decode(new Uint8Array([0x00, 0x80]))).toBe(128);
    expect(int.decode(new Uint8Array([0xff, 0x7f]))).toBe(-129);
    expect(int.decode(new Uint8Array([0xff, 0xff]))).toBe(-1);
    expect(int.decodeBigInt(new Uint8Array([0x80, 0, 0, 0, 0, 0, 0, 0]))).toBe(-(2n ** 63n));
    expect(() => int.decode(new Uint8Array([0x80, 0, 0, 0, 0, 0, 0, 0]))).toThrow(RangeError);
    expect(() => int.decode(new Uint8Array())).toThrow(RangeError);
  });

  it("round-trips across byte boundaries", () => {
    for (const value of [0, 1, -1, 127, 128, -128, -129, 255, 256, 32767, 32768, -32768, -32769, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]) {
      expect(int.decode(int.encode(value))).toBe(value);
    }
    expect(() => int.encode(2 ** 53)).toThrow(RangeError);
  });

  it("detects needlessly long encodings", () => {
    expect(int.isMinimal(new Uint8Array())).toBe(true);
    expect(int.isMinimal(new Uint8Array([0x00]))).toBe(true);
    expect(int.isMinimal(new Uint8Array([0x00, 0x80]))).toBe(true);
    expect(int.isMinimal(new Uint8Array([0xff, 0x7f]))).toBe(true);
    expect(int.isMinimal(new Uint8Array([0x00, 0x7f]))).toBe(false);
    expect(int.isMinimal(new Uint8Array([0xff, 0x80]))).toBe(false);
  });
});
