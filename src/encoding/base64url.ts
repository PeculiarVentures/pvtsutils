import type { BufferSourceLike } from "../bytes/index.js";
import { base64 } from "./base64.js";

const BASE64URL_REGEX = /^[A-Za-z0-9_-]*$/;

/** Options that control Base64Url encoding. */
export interface Base64UrlEncodeOptions {
  readonly __base64UrlEncodeOptionsBrand?: never;
}

/** Options that control Base64Url decoding. */
export interface Base64UrlDecodeOptions {
  readonly __base64UrlDecodeOptionsBrand?: never;
}

/** Removes whitespace from Base64Url text. */
export function normalize(text: string): string {
  return text.replace(/[\n\r\t ]/g, "");
}

/** Checks whether a value is valid Base64Url text. */
export function is(text: unknown): text is string {
  return typeof text === "string" && BASE64URL_REGEX.test(normalize(text));
}

/** Encodes buffer data as Base64Url text. */
export function encode(data: BufferSourceLike, _options?: Base64UrlEncodeOptions): string {
  return base64.encode(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Decodes Base64Url text into bytes. */
export function decode(text: string, _options?: Base64UrlDecodeOptions): Uint8Array {
  const normalized = normalize(text);
  if (!is(normalized)) {
    throw new TypeError("Input is not valid Base64Url text");
  }
  return base64.decode(base64.pad(normalized.replace(/-/g, "+").replace(/_/g, "/")));
}

/** Base64Url codec helpers. */
export const base64url = { encode, decode, is, normalize } as const;
