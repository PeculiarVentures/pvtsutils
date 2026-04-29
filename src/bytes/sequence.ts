declare const TextEncoder: new() => { encode(text: string): Uint8Array };

import { toUint8Array, toUint8ArrayCopy } from "./buffer-source.js";
import type { BufferSourceLike } from "./types.js";

/** String or byte pattern accepted by the byte search helpers. */
export type BytePattern = BufferSourceLike | string;

/** Options shared by the stateless byte search helpers. */
export interface ByteSearchOptions {
  /**
   * Start offset for forward search.
   * For reverse search this is the upper bound / starting point.
   */
  start?: number;

  /**
   * End offset, exclusive.
   * For reverse search this is the lower bound.
   */
  end?: number;

  /**
   * Encoding used when pattern is a string.
   * Defaults to ASCII for marker-style byte searches.
   */
  encoding?: "ascii" | "utf8";
}

function clampIndex(value: number | undefined, fallback: number, length: number): number {
  const normalized = Number.isFinite(value) ? Math.trunc(value as number) : fallback;
  if (normalized <= 0) {
    return 0;
  }
  if (normalized >= length) {
    return length;
  }
  return normalized;
}

function normalizeForwardRange(length: number, options?: ByteSearchOptions): [number, number] {
  const start = clampIndex(options?.start, 0, length);
  const end = clampIndex(options?.end, length, length);
  return end >= start ? [start, end] : [start, start];
}

function normalizeReverseRange(length: number, options?: ByteSearchOptions): [number, number] {
  const start = clampIndex(options?.start, length, length);
  const end = clampIndex(options?.end, 0, length);
  return start >= end ? [end, start] : [start, start];
}

function normalizeSliceIndex(value: number | undefined, fallback: number, length: number): number {
  const normalized = Number.isFinite(value) ? Math.trunc(value as number) : fallback;
  if (normalized < 0) {
    return Math.max(length + normalized, 0);
  }
  if (normalized > length) {
    return length;
  }
  return normalized;
}

function encodeAscii(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function encodeUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text) as Uint8Array;
}

function toPatternBytes(pattern: BytePattern, options?: Pick<ByteSearchOptions, "encoding">): Uint8Array {
  if (typeof pattern === "string") {
    return options?.encoding === "utf8" ? encodeUtf8(pattern) : encodeAscii(pattern);
  }
  return toUint8Array(pattern);
}

function bytesEqualAt(data: Uint8Array, pattern: Uint8Array, offset: number): boolean {
  for (let index = 0; index < pattern.byteLength; index++) {
    if (data[offset + index] !== pattern[index]) {
      return false;
    }
  }
  return true;
}

/**
 * Searches for the first occurrence of a byte pattern within the requested range.
 * Returns the absolute byte offset or `-1` when the pattern is not found.
 */
export function indexOf(data: BufferSourceLike, pattern: BytePattern, options?: ByteSearchOptions): number {
  const bytes = toUint8Array(data);
  const needle = toPatternBytes(pattern, options);
  const [start, end] = normalizeForwardRange(bytes.byteLength, options);

  if (needle.byteLength === 0) {
    return start;
  }

  const lastOffset = end - needle.byteLength;
  if (lastOffset < start) {
    return -1;
  }

  for (let offset = start; offset <= lastOffset; offset++) {
    if (bytesEqualAt(bytes, needle, offset)) {
      return offset;
    }
  }

  return -1;
}

/**
 * Searches backwards for the last occurrence of a byte pattern within the requested range.
 * Returns the absolute byte offset or `-1` when the pattern is not found.
 */
export function lastIndexOf(data: BufferSourceLike, pattern: BytePattern, options?: ByteSearchOptions): number {
  const bytes = toUint8Array(data);
  const needle = toPatternBytes(pattern, options);
  const [end, start] = normalizeReverseRange(bytes.byteLength, options);

  if (needle.byteLength === 0) {
    return start;
  }

  const firstOffset = start - needle.byteLength;
  if (firstOffset < end) {
    return -1;
  }

  for (let offset = firstOffset; offset >= end; offset--) {
    if (bytesEqualAt(bytes, needle, offset)) {
      return offset;
    }
  }

  return -1;
}

/** Returns `true` when the pattern exists anywhere in the requested range. */
export function includes(data: BufferSourceLike, pattern: BytePattern, options?: ByteSearchOptions): boolean {
  return indexOf(data, pattern, options) !== -1;
}

/** Returns `true` when the byte sequence starts with the requested pattern. */
export function startsWith(
  data: BufferSourceLike,
  pattern: BytePattern,
  options?: Pick<ByteSearchOptions, "encoding">,
): boolean {
  const bytes = toUint8Array(data);
  const needle = toPatternBytes(pattern, options);

  if (needle.byteLength > bytes.byteLength) {
    return false;
  }

  return bytesEqualAt(bytes, needle, 0);
}

/** Returns `true` when the byte sequence ends with the requested pattern. */
export function endsWith(
  data: BufferSourceLike,
  pattern: BytePattern,
  options?: Pick<ByteSearchOptions, "encoding">,
): boolean {
  const bytes = toUint8Array(data);
  const needle = toPatternBytes(pattern, options);

  if (needle.byteLength > bytes.byteLength) {
    return false;
  }

  return bytesEqualAt(bytes, needle, bytes.byteLength - needle.byteLength);
}

/**
 * Returns a Uint8Array view over the requested byte range.
 * Negative indexes follow `Array.prototype.slice` semantics.
 */
export function slice(data: BufferSourceLike, start?: number, end?: number): Uint8Array {
  const bytes = toUint8Array(data);
  const normalizedStart = normalizeSliceIndex(start, 0, bytes.byteLength);
  const normalizedEnd = normalizeSliceIndex(end, bytes.byteLength, bytes.byteLength);

  if (normalizedEnd <= normalizedStart) {
    return bytes.subarray(normalizedStart, normalizedStart);
  }

  return bytes.subarray(normalizedStart, normalizedEnd);
}

/** Returns the last `length` bytes of the input as a Uint8Array view. */
export function tail(data: BufferSourceLike, length: number): Uint8Array {
  const bytes = toUint8Array(data);
  const normalizedLength = Number.isFinite(length) ? Math.max(0, Math.trunc(length)) : 0;

  if (normalizedLength >= bytes.byteLength) {
    return bytes;
  }

  return bytes.subarray(bytes.byteLength - normalizedLength);
}

/** Returns a new Uint8Array copy that never shares memory with the input. */
export function copy(data: BufferSourceLike): Uint8Array {
  return toUint8ArrayCopy(data);
}

/** Compares two byte sequences lexicographically. */
export function compare(a: BufferSourceLike, b: BufferSourceLike): -1 | 0 | 1 {
  const left = toUint8Array(a);
  const right = toUint8Array(b);
  const limit = Math.min(left.byteLength, right.byteLength);

  for (let index = 0; index < limit; index++) {
    if (left[index] < right[index]) {
      return -1;
    }
    if (left[index] > right[index]) {
      return 1;
    }
  }

  if (left.byteLength < right.byteLength) {
    return -1;
  }
  if (left.byteLength > right.byteLength) {
    return 1;
  }
  return 0;
}
