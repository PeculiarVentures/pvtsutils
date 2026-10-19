declare const TextEncoder: new () => { encode(text: string): Uint8Array };
declare const TextDecoder: new (
  label?: string,
  options?: { fatal?: boolean; ignoreBOM?: boolean },
) => {
  decode(data: Uint8Array): string;
};

import { toArrayBuffer, toUint8Array, type BufferSourceLike } from "../bytes/index.js";
import { convert, type BufferEncoding } from "../converters/index.js";
import type { Utf16Options } from "../encoding/utf16.js";

/** Legacy text encodings accepted by the deprecated facade. */
export type TextEncoding = "ascii" | "utf8" | "utf-8" | "utf16" | "utf16be" | "utf16le" | "usc2";

function normalizeTextEncoding(encoding: TextEncoding): BufferEncoding {
  return encoding === "ascii" ? "binary" : encoding;
}

function isUtf8Encoding(encoding: BufferEncoding): boolean {
  const name = encoding.toLowerCase();
  return name === "utf8" || name === "utf-8";
}

/** Matches lone surrogates; well-formed pairs are a single code point in `u` mode. */
const LONE_SURROGATE = /\p{Cs}/u;

/**
 * Strict UTF-8 encoder matching `pvtsutils` 1.x: throws on lone surrogates
 * instead of replacing them with U+FFFD.
 */
function encodeUtf8Strict(text: string): ArrayBufferLike {
  if (LONE_SURROGATE.test(text)) {
    throw new TypeError("The string contains lone surrogates and cannot be encoded as UTF-8");
  }
  return toArrayBuffer(new TextEncoder().encode(text));
}

/**
 * Strict UTF-8 decoder matching `pvtsutils` 1.x: throws on malformed input
 * and keeps a leading BOM.
 */
function decodeUtf8Strict(data: BufferSourceLike): string {
  return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(toUint8Array(data));
}

/**
 * Legacy converter facade that mirrors the historical API surface.
 * @deprecated Use the camelCase `convert` object or specific encoding modules instead.
 */
export class Convert {
  /** Default UTF-8 encoding used by the legacy facade. */
  public static DEFAULT_UTF8_ENCODING: TextEncoding = "utf8";

  /** Checks whether the input is hexadecimal text. */
  public static isHex(data: unknown): data is string {
    return convert.isHex(data);
  }

  /** Checks whether the input is Base64 text. */
  public static isBase64(data: unknown): data is string {
    return convert.isBase64(data);
  }

  /** Checks whether the input is Base64Url text. */
  public static isBase64Url(data: unknown): data is string {
    return convert.isBase64Url(data);
  }

  /** Converts buffer data to text. */
  public static ToString(buffer: BufferSourceLike, enc: BufferEncoding = "utf8"): string {
    if (isUtf8Encoding(enc)) {
      return decodeUtf8Strict(buffer);
    }
    return convert.toString(buffer, enc);
  }

  /** Converts text to bytes. */
  public static FromString(str: string, enc: BufferEncoding = "utf8"): ArrayBufferLike {
    if (!str) {
      return new ArrayBuffer(0);
    }
    if (isUtf8Encoding(enc)) {
      return encodeUtf8Strict(str);
    }
    return convert.fromString(str, enc);
  }

  /** Encodes bytes as Base64 text. */
  public static ToBase64(buffer: BufferSourceLike): string {
    return convert.toBase64(buffer);
  }

  /** Decodes Base64 text into bytes. */
  public static FromBase64(base64: string): ArrayBufferLike {
    return convert.fromBase64(base64);
  }

  /** Decodes Base64Url text into bytes. */
  public static FromBase64Url(base64url: string): ArrayBufferLike {
    return convert.fromBase64Url(base64url);
  }

  /** Encodes bytes as Base64Url text. */
  public static ToBase64Url(data: BufferSourceLike): string {
    return convert.toBase64Url(data);
  }

  /**
   * Converts UTF-8 or UTF-16 text to bytes.
   * @throws {TypeError} When UTF-8 is requested and the text contains lone surrogates.
   */
  public static FromUtf8String(text: string, encoding: TextEncoding = Convert.DEFAULT_UTF8_ENCODING): ArrayBufferLike {
    if (isUtf8Encoding(encoding)) {
      return encodeUtf8Strict(text);
    }
    return convert.fromString(text, normalizeTextEncoding(encoding));
  }

  /**
   * Converts bytes to UTF-8 or UTF-16 text. A leading UTF-8 BOM is preserved.
   * @throws {TypeError} When UTF-8 is requested and the bytes are not valid UTF-8.
   */
  public static ToUtf8String(buffer: BufferSourceLike, encoding: TextEncoding = Convert.DEFAULT_UTF8_ENCODING): string {
    if (isUtf8Encoding(encoding)) {
      return decodeUtf8Strict(buffer);
    }
    return convert.toString(buffer, normalizeTextEncoding(encoding));
  }

  /** Decodes binary text into bytes. */
  public static FromBinary(text: string): ArrayBufferLike {
    return convert.fromBinary(text);
  }

  /** Encodes bytes as binary text. */
  public static ToBinary(buffer: BufferSourceLike): string {
    return convert.toBinary(buffer);
  }

  /** Encodes bytes as hexadecimal text. */
  public static ToHex(buffer: BufferSourceLike): string {
    return convert.toHex(buffer);
  }

  /** Decodes hexadecimal text into bytes. */
  public static FromHex(hexString: string): ArrayBufferLike {
    return convert.fromHex(hexString);
  }

  /** Converts UTF-16 bytes into text. */
  public static ToUtf16String(buffer: BufferSourceLike, littleEndian = false): string {
    return convert.toUtf16String(buffer, littleEndian);
  }

  /** Converts UTF-16 text into bytes. */
  public static FromUtf16String(text: string, littleEndian = false): ArrayBufferLike {
    return convert.fromUtf16String(text, littleEndian);
  }

  protected static Base64Padding(base64: string): string {
    const padCount = 4 - (base64.length % 4);
    return padCount < 4 ? base64 + "=".repeat(padCount) : base64;
  }

  /** Normalizes whitespace in Base64-style text. */
  public static formatString(data: string): string {
    return convert.formatString(data);
  }
}

/** Legacy text encoding aliases re-exported for compatibility. */
export type { BufferEncoding, Utf16Options };
