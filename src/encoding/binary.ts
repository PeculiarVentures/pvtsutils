import type { BufferSourceLike } from "../bytes/index.js";
import { toUint8Array } from "../bytes/index.js";

/** Encodes bytes as a one-byte-per-character string. */
export function encode(data: BufferSourceLike): string {
  const bytes = toUint8Array(data);
  let result = "";
  for (const byte of bytes) {
    result += String.fromCharCode(byte);
  }
  return result;
}

/** Decodes a one-byte-per-character string into bytes. */
export function decode(text: string): Uint8Array {
  const result = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    result[i] = text.charCodeAt(i) & 0xff;
  }
  return result;
}

/** Checks whether a value is a string suitable for binary text handling. */
export function is(text: unknown): text is string {
  return typeof text === "string";
}

/** Binary codec helpers. */
export const binary = { encode, decode, is } as const;
