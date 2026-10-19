import type { BufferSourceLike } from "../bytes/index.js";
import { base64 } from "./base64.js";

const BASE64URL_REGEX = /^[A-Za-z0-9_-]*$/;
const PADDED_BASE64URL_REGEX = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2}==|[A-Za-z0-9_-]{3}=)?$/;

/** Options that control Base64Url encoding. */
export interface Base64UrlEncodeOptions {
  readonly __base64UrlEncodeOptionsBrand?: never;
}

/** Options that control Base64Url decoding. */
export interface Base64UrlDecodeOptions {
  /** Accepts correctly padded input such as `aGk=` in addition to unpadded text. Defaults to `false`. */
  allowPadding?: boolean;
}

/** Removes whitespace from Base64Url text. */
export function normalize(text: string): string {
  return text.replace(/[\n\r\t ]/g, "");
}

/** Checks whether a value is valid Base64Url text. */
export function is(text: unknown, options: Base64UrlDecodeOptions = {}): text is string {
  if (typeof text !== "string") {
    return false;
  }
  const normalized = normalize(text);
  return BASE64URL_REGEX.test(normalized) || (!!options.allowPadding && PADDED_BASE64URL_REGEX.test(normalized));
}

/** Encodes buffer data as Base64Url text. */
export function encode(data: BufferSourceLike, _options?: Base64UrlEncodeOptions): string {
  return base64.encode(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Decodes Base64Url text into bytes. */
export function decode(text: string, options: Base64UrlDecodeOptions = {}): Uint8Array {
  const normalized = normalize(text);
  if (!is(normalized, options)) {
    throw new TypeError("Input is not valid Base64Url text");
  }
  return base64.decode(base64.pad(normalized.replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/")));
}

/** Base64Url codec helpers. */
export const base64url = { encode, decode, is, normalize } as const;
