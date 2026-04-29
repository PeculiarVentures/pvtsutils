import { describe, expect, expectTypeOf, it } from "vitest";

import { BufferSourceConverter, Convert, assign, combine, isEqual } from "./index.js";

describe("legacy", () => {
  it("assigns object properties and skips empty sources", () => {
    const target = { a: 1, b: 2 };

    expect(assign(target, undefined, null, { b: 3 } as Partial<typeof target>)).toBe(target);
    expect(target).toEqual({ a: 1, b: 3 });
  });

  it("combines buffers and compares them by value", () => {
    const left = new Uint8Array([1, 2]);
    const right = new Uint8Array([3, 4]);

    expect(Array.from(new Uint8Array(combine(left, right)))).toEqual([1, 2, 3, 4]);
    expect(isEqual(left, new Uint8Array([1, 2]))).toBe(true);
    expect(isEqual(left, right)).toBe(false);
  });

  it("mirrors the historical Convert API", () => {
    const payload = new Uint8Array([104, 105]);

    expect(Convert.DEFAULT_UTF8_ENCODING).toBe("utf8");
    expect(Convert.isHex("0f")).toBe(true);
    expect(Convert.isBase64("aGk=")).toBe(true);
    expect(Convert.isBase64Url("aGk")).toBe(true);
    expect(Convert.ToString(payload)).toBe("hi");
    expect(Convert.ToUtf8String(payload, "ascii")).toBe("hi");
    expect(Array.from(new Uint8Array(Convert.FromString("", "utf8")))).toEqual([]);
    expect(Array.from(new Uint8Array(Convert.FromString("hi", "utf8")))).toEqual([104, 105]);
    expect(Convert.ToBase64(payload)).toBe("aGk=");
    expect(Array.from(new Uint8Array(Convert.FromBase64("aGk=")))).toEqual([104, 105]);
    expect(Convert.ToBase64Url(payload)).toBe("aGk");
    expect(Array.from(new Uint8Array(Convert.FromBase64Url("aGk")))).toEqual([104, 105]);
    expect(Convert.ToUtf8String(payload)).toBe("hi");
    expect(Convert.ToUtf8String(payload, "ascii")).toBe("hi");
    expect(Convert.ToUtf8String(new Uint8Array([65, 0, 0, 1]), "utf16le")).toBe("AĀ");
    expect(Array.from(new Uint8Array(Convert.FromUtf8String("hi")))).toEqual([104, 105]);
    expect(Array.from(new Uint8Array(Convert.FromUtf8String("hi", "ascii")))).toEqual([
      104,
      105,
    ]);
    expect(Array.from(new Uint8Array(Convert.FromUtf8String("AĀ", "utf16le")))).toEqual([
      65,
      0,
      0,
      1,
    ]);
    expect(Convert.ToBinary(payload)).toBe("hi");
    expect(Array.from(new Uint8Array(Convert.FromBinary("hi")))).toEqual([104, 105]);
    expect(Convert.ToHex(new Uint8Array([0, 15]))).toBe("000f");
    expect(Array.from(new Uint8Array(Convert.FromHex("abc")))).toEqual([10, 188]);
    expect(Convert.ToUtf16String(new Uint8Array([0, 65, 1, 0]))).toBe("AĀ");
    expect(Array.from(new Uint8Array(Convert.FromUtf16String("AĀ", true)))).toEqual([65, 0, 0, 1]);
    expect(Convert.formatString(" aGk=\n")).toBe("aGk=");
  });

  it("exposes the buffer source converter facade", () => {
    const buffer = new Uint8Array([1, 2, 3, 4]);

    expectTypeOf(BufferSourceConverter.toArrayBuffer(buffer)).toEqualTypeOf<ArrayBuffer>();

    expect(BufferSourceConverter.isArrayBuffer(buffer.buffer)).toBe(true);
    expect(BufferSourceConverter.isArrayBufferView(buffer)).toBe(true);
    expect(BufferSourceConverter.isBufferSource(buffer)).toBe(true);
    expect(BufferSourceConverter.toArrayBuffer(buffer.subarray(1, 3))).not.toBe(buffer.buffer);
    expect(Array.from(BufferSourceConverter.toUint8Array(buffer.buffer))).toEqual([1, 2, 3, 4]);
    expect(BufferSourceConverter.toView(buffer, DataView)).toBeInstanceOf(DataView);
    expect(BufferSourceConverter.isEqual(buffer, new Uint8Array([1, 2, 3, 4]))).toBe(true);
    expect(Array.from(new Uint8Array(BufferSourceConverter.concat([buffer.subarray(0, 2), buffer.subarray(2)])))).toEqual([
      1,
      2,
      3,
      4,
    ]);
    expect(Array.from(new Uint8Array(BufferSourceConverter.concat(buffer.subarray(0, 2), buffer.subarray(2))))).toEqual([
      1,
      2,
      3,
      4,
    ]);
    expect(
      BufferSourceConverter.concat([buffer.subarray(0, 2), buffer.subarray(2)], Uint16Array),
    ).toBeInstanceOf(Uint16Array);
  });
});
