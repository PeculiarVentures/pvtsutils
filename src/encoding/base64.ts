import type { BufferSourceLike } from "../bytes/index.js";
import { toUint8Array } from "../bytes/index.js";
import { encode as encodeBinary, decode as decodeBinary } from "./binary.js";

const BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

declare function btoa(data: string): string;
declare function atob(data: string): string;

/** Options that control Base64 encoding. */
export interface Base64EncodeOptions {
  readonly __base64EncodeOptionsBrand?: never;
}

/** Options that control Base64 decoding. */
export interface Base64DecodeOptions {
  readonly __base64DecodeOptionsBrand?: never;
}

interface NodeBufferConstructor {
  from(data: Uint8Array | string, encoding?: string): { toString(encoding?: string): string };
}

function nodeBuffer(): NodeBufferConstructor | undefined {
  return (globalThis as unknown as { Buffer?: NodeBufferConstructor }).Buffer;
}

/** Removes whitespace from Base64 text. */
export function normalize(text: string): string {
  return text.replace(/[\n\r\t ]/g, "");
}

/** Pads Base64 text to a multiple of four characters. */
export function pad(text: string): string {
  const remainder = text.length % 4;
  return remainder ? text + "=".repeat(4 - remainder) : text;
}

/** Checks whether a value is valid Base64 text. */
export function is(text: unknown): text is string {
  if (typeof text !== "string") {
    return false;
  }
  const normalized = normalize(text);
  return normalized === "" || BASE64_REGEX.test(normalized);
}

/** Encodes buffer data as Base64 text. */
export function encode(data: BufferSourceLike, _options?: Base64EncodeOptions): string {
  const bytes = toUint8Array(data);
  const buffer = nodeBuffer();
  if (buffer) {
    return buffer.from(bytes).toString("base64");
  }
  return btoa(encodeBinary(bytes));
}

/** Decodes Base64 text into bytes. */
export function decode(text: string, _options?: Base64DecodeOptions): Uint8Array {
  const normalized = normalize(text);
  if (!is(normalized)) {
    throw new TypeError("Input is not valid Base64 text");
  }

  const buffer = nodeBuffer();
  if (buffer) {
    return new Uint8Array(buffer.from(normalized, "base64") as unknown as ArrayLike<number>);
  }
  return decodeBinary(atob(normalized));
}

/** Base64 codec helpers. */
export const base64 = { encode, decode, is, normalize, pad } as const;
