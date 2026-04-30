import { describe, expect, expectTypeOf, it } from "vitest";

import {
  assertBufferSource,
  isArrayBuffer,
  isArrayBufferLike,
  isArrayBufferView,
  isBufferSource,
  isSharedArrayBuffer,
  toArrayBuffer,
  toArrayBufferLike,
  toUint8Array,
  toUint8ArrayCopy,
  toView,
  toViewCopy,
} from "./buffer-source.js";
import { concat, concatToUint8Array } from "./concat.js";
import { equal } from "./equal.js";
import { compare, copy, endsWith, includes, indexOf, lastIndexOf, slice, startsWith, tail } from "./sequence.js";
import type { BufferSource, BufferSourceLike } from "./types.js";
import * as bytesApi from "./index.js";

function* makeBuffers(): Iterable<Uint8Array> {
  yield new Uint8Array([1, 2]);
  yield new Uint8Array([3, 4]);
}

describe("bytes", () => {
  it("identifies buffer sources", () => {
    const buffer = new ArrayBuffer(4);
    const view = new Uint8Array(buffer);

    expect(isArrayBuffer(buffer)).toBe(true);
    expect(isArrayBuffer(view)).toBe(false);
    expect(isArrayBufferLike(buffer)).toBe(true);
    expect(isArrayBufferView(view)).toBe(true);
    expect(isBufferSource(buffer)).toBe(true);
    expect(isBufferSource(view)).toBe(true);
    expect(isBufferSource("nope")).toBe(false);
    expect(() => assertBufferSource("nope")).toThrow(TypeError);

    if (typeof SharedArrayBuffer !== "undefined") {
      const sharedBuffer = new SharedArrayBuffer(4);

      expect(isSharedArrayBuffer(sharedBuffer)).toBe(true);
      expect(isArrayBufferLike(sharedBuffer)).toBe(true);
      expect(isBufferSource(sharedBuffer)).toBe(true);
    }
  });

  it("preserves the historical BufferSource type alias", () => {
    expectTypeOf<BufferSource>().toEqualTypeOf<BufferSourceLike>();
    expectTypeOf<BufferSourceLike>().toMatchTypeOf<BufferSource>();
  });

  it("normalizes buffer sources to Uint8Array views", () => {
    const buffer = new ArrayBuffer(4);
    new Uint8Array(buffer).set([1, 2, 3, 4]);
    const view = new Uint8Array(buffer, 1, 2);

    expect(Array.from(toUint8Array(buffer))).toEqual([1, 2, 3, 4]);
    expect(toUint8Array(buffer).buffer).toBe(buffer);

    const normalizedView = toUint8Array(view);
    expect(normalizedView.buffer).toBe(buffer);
    expect(normalizedView.byteOffset).toBe(1);
    expect(Array.from(normalizedView)).toEqual([2, 3]);

    const copied = toUint8ArrayCopy(view);
    view[0] = 9;

    expect(Array.from(copied)).toEqual([2, 3]);
  });

  it("returns ArrayBuffers and ArrayBuffer-like values with the expected copying behavior", () => {
    const buffer = new ArrayBuffer(4);
    new Uint8Array(buffer).set([1, 2, 3, 4]);
    const fullView = new Uint8Array(buffer);
    const partialView = fullView.subarray(1, 3);

    expectTypeOf(toArrayBuffer(buffer)).toEqualTypeOf<ArrayBuffer>();
    expectTypeOf(toArrayBuffer(partialView)).toEqualTypeOf<ArrayBuffer>();
    expectTypeOf(toArrayBufferLike(buffer)).toEqualTypeOf<ArrayBufferLike>();

    expect(toArrayBuffer(buffer)).toBe(buffer);

    const copiedBuffer = toArrayBuffer(partialView);
    expect(copiedBuffer).not.toBe(buffer);
    expect(Array.from(new Uint8Array(copiedBuffer))).toEqual([2, 3]);

    expect(toArrayBufferLike(fullView)).toBe(buffer);

    const copiedLike = toArrayBufferLike(partialView);
    expect(copiedLike).not.toBe(buffer);
    expect(Array.from(new Uint8Array(copiedLike))).toEqual([2, 3]);

    if (typeof SharedArrayBuffer !== "undefined") {
      const sharedBuffer = new SharedArrayBuffer(4);

      expect(toArrayBufferLike(sharedBuffer)).toBe(sharedBuffer);
    }
  });

  it("casts views and copies them when requested", () => {
    const source = new Uint8Array([1, 2, 3, 4]);

    expect(toView(source, Uint8Array)).toBe(source);

    const dataView = toView(source, DataView);
    expect(dataView).toBeInstanceOf(DataView);
    expect(dataView.byteLength).toBe(4);
    expect(dataView.getUint8(0)).toBe(1);

    const uint16View = toView(source, Uint16Array);
    expect(uint16View).toBeInstanceOf(Uint16Array);
    expect(uint16View.byteLength).toBe(4);
    expect(Array.from(new Uint8Array(uint16View.buffer))).toEqual([1, 2, 3, 4]);

    expect(() => toView(new Uint8Array([1, 2, 3]).subarray(1), Uint16Array)).toThrow(RangeError);

    const copiedView = toViewCopy(source, Uint16Array);
    source.fill(9);

    expect(Array.from(new Uint8Array(copiedView.buffer))).toEqual([1, 2, 3, 4]);
  });

  it("concatenates buffer sources in every supported shape", () => {
    expect(Array.from(concatToUint8Array(makeBuffers()))).toEqual([1, 2, 3, 4]);

    const directConcat = concat(new Uint8Array([1]), undefined as unknown as BufferSourceLike, new Uint8Array([2]));
    expect(Array.from(new Uint8Array(directConcat))).toEqual([1, 2]);

    const iterableConcat = concat(makeBuffers());
    expect(Array.from(new Uint8Array(iterableConcat))).toEqual([1, 2, 3, 4]);

    const typedConcat = concat(makeBuffers(), Uint16Array);
    expect(typedConcat).toBeInstanceOf(Uint16Array);
    expect(Array.from(new Uint8Array(typedConcat.buffer))).toEqual([1, 2, 3, 4]);
  });

  it("compares buffers by value and through the barrel export", () => {
    expect(equal(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(true);
    expect(equal(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(false);
    expect(equal(new Uint8Array([1]), new Uint8Array([1, 2]))).toBe(false);
    expect(equal(new Uint8Array([1]), new Uint8Array([1, 2]), { constantTime: true })).toBe(false);

    expect(bytesApi.concat).toBe(concat);
    expect(bytesApi.concatToUint8Array).toBe(concatToUint8Array);
    expect(bytesApi.compare).toBe(compare);
    expect(bytesApi.copy).toBe(copy);
    expect(bytesApi.endsWith).toBe(endsWith);
    expect(bytesApi.equal).toBe(equal);
    expect(bytesApi.includes).toBe(includes);
    expect(bytesApi.indexOf).toBe(indexOf);
    expect(bytesApi.lastIndexOf).toBe(lastIndexOf);
    expect(bytesApi.slice).toBe(slice);
    expect(bytesApi.startsWith).toBe(startsWith);
    expect(bytesApi.tail).toBe(tail);
    expect(bytesApi.toView).toBe(toView);
  });

  it("searches byte patterns across supported buffer inputs", () => {
    const buffer = new Uint8Array([1, 2, 3, 2, 3, 4]).buffer;
    const data = new Uint8Array(buffer);
    const view = new Uint8Array(buffer, 1, 4);

    expect(indexOf(buffer, new Uint8Array([2, 3]))).toBe(1);
    expect(indexOf(data, new Uint8Array([2, 3]), { start: 2 })).toBe(3);
    expect(indexOf(data, new Uint8Array([2, 3]), { start: 2, end: 4 })).toBe(-1);
    expect(indexOf(view, new Uint8Array([2, 3]))).toBe(0);

    expect(lastIndexOf(buffer, new Uint8Array([2, 3]))).toBe(3);
    expect(lastIndexOf(data, new Uint8Array([2, 3]), { start: 4 })).toBe(1);
    expect(lastIndexOf(data, new Uint8Array([2, 3]), { start: 6, end: 2 })).toBe(3);
    expect(lastIndexOf(view, new Uint8Array([2, 3]))).toBe(2);

    expect(indexOf(data, new Uint8Array([]))).toBe(0);
    expect(lastIndexOf(data, new Uint8Array([]))).toBe(data.byteLength);
    expect(indexOf(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(-1);
    expect(lastIndexOf(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(-1);
  });

  it("supports ascii and utf8 string patterns", () => {
    const ascii = new Uint8Array([0x25, 0x25, 0x45, 0x4f, 0x46]);
    const utf8Data = new Uint8Array([0x6e, 0x61, 0xc3, 0xaf, 0x76, 0x65]);

    expect(indexOf(ascii, "%%EOF", { encoding: "ascii" })).toBe(0);
    expect(lastIndexOf(new Uint8Array([0x78, 0x72, 0x65, 0x66, 0x20, 0x78, 0x72, 0x65, 0x66]), "xref", {
      encoding: "ascii",
    })).toBe(5);
    expect(includes(new Uint8Array([0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66]), "startxref", {
      encoding: "ascii",
    })).toBe(true);
    expect(startsWith(new Uint8Array([0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x42]), "-----B", { encoding: "ascii" })).toBe(true);
    expect(endsWith(ascii, "%%EOF", { encoding: "ascii" })).toBe(true);

    expect(indexOf(utf8Data, "ï", { encoding: "utf8" })).toBe(2);
    expect(includes(utf8Data, "naï", { encoding: "utf8" })).toBe(true);
    expect(startsWith(utf8Data, "na", { encoding: "utf8" })).toBe(true);
    expect(endsWith(utf8Data, "ïve", { encoding: "utf8" })).toBe(true);
  });

  it("checks includes and prefix or suffix without scanning the full buffer", () => {
    const data = new Uint8Array([1, 2, 3, 4]);

    expect(includes(data, new Uint8Array([2, 3]))).toBe(true);
    expect(includes(data, new Uint8Array([3, 5]))).toBe(false);
    expect(startsWith(data, new Uint8Array([]))).toBe(true);
    expect(startsWith(data, new Uint8Array([1, 2]))).toBe(true);
    expect(startsWith(data, new Uint8Array([2, 3]))).toBe(false);
    expect(endsWith(data, new Uint8Array([]))).toBe(true);
    expect(endsWith(data, new Uint8Array([3, 4]))).toBe(true);
    expect(endsWith(data, new Uint8Array([2, 3]))).toBe(false);
    expect(endsWith(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
  });

  it("creates slices, tails, and independent copies", () => {
    const source = new Uint8Array([1, 2, 3, 4, 5]);
    const offsetView = new Uint8Array(new Uint8Array([9, 1, 2, 3, 4, 5, 9]).buffer, 1, 5);

    expect(Array.from(slice(source, 1, 4))).toEqual([2, 3, 4]);
    expect(Array.from(slice(source, -3, -1))).toEqual([3, 4]);
    expect(Array.from(slice(offsetView, -2))).toEqual([4, 5]);
    expect(Array.from(slice(source, 4, 1))).toEqual([]);

    expect(Array.from(tail(source, 2))).toEqual([4, 5]);
    expect(Array.from(tail(source, 99))).toEqual([1, 2, 3, 4, 5]);
    expect(Array.from(tail(source, 0))).toEqual([]);

    const copied = copy(offsetView);
    offsetView[0] = 8;

    expect(Array.from(copied)).toEqual([1, 2, 3, 4, 5]);
    expect(copied.buffer).not.toBe(offsetView.buffer);
  });

  it("compares byte sequences lexicographically", () => {
    expect(compare(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(0);
    expect(compare(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(-1);
    expect(compare(new Uint8Array([1, 3]), new Uint8Array([1, 2]))).toBe(1);
    expect(compare(new Uint8Array([1, 2]), new Uint8Array([1, 2, 0]))).toBe(-1);
    expect(compare(new Uint8Array([1, 2, 0]), new Uint8Array([1, 2]))).toBe(1);
  });

  it("accepts modern typed array inputs without BufferSource narrowing issues", () => {
    const value = new Uint8Array<ArrayBufferLike>(new ArrayBuffer(4));

    expectTypeOf(indexOf(value, new Uint8Array([1, 2]))).toEqualTypeOf<number>();
    expectTypeOf(lastIndexOf(value, "xref", { encoding: "ascii" })).toEqualTypeOf<number>();
    expectTypeOf(copy(value)).toEqualTypeOf<Uint8Array>();
    expectTypeOf(tail(value, 1024)).toEqualTypeOf<Uint8Array>();
  });
});
