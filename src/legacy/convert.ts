import type { BufferSourceLike } from "../bytes/index.js";
import { convert, type BufferEncoding } from "../converters/index.js";
import type { Utf16Options } from "../encoding/utf16.js";

/** Legacy text encodings accepted by the deprecated facade. */
export type TextEncoding = "ascii" | "utf8" | "utf16" | "utf16be" | "utf16le" | "usc2";

function normalizeTextEncoding(encoding: TextEncoding): BufferEncoding {
  return encoding === "ascii" ? "binary" : encoding;
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
    return convert.toString(buffer, enc);
  }

  /** Converts text to bytes. */
  public static FromString(str: string, enc: BufferEncoding = "utf8"): ArrayBufferLike {
    if (!str) {
      return new ArrayBuffer(0);
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

  /** Converts UTF-8 or UTF-16 text to bytes. */
  public static FromUtf8String(text: string, encoding: TextEncoding = Convert.DEFAULT_UTF8_ENCODING): ArrayBufferLike {
    return convert.fromString(text, normalizeTextEncoding(encoding));
  }

  /** Converts bytes to UTF-8 or UTF-16 text. */
  public static ToUtf8String(buffer: BufferSourceLike, encoding: TextEncoding = Convert.DEFAULT_UTF8_ENCODING): string {
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
