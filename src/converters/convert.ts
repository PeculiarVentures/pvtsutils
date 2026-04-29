import type { BufferSourceLike } from "../bytes/index.js";
import { toArrayBuffer } from "../bytes/index.js";
import { base64, base64url, binary, hex, utf8, utf16 } from "../encoding/index.js";
import { defaultConverterRegistry } from "./defaults.js";
import type {
  DecodeOptionsFor,
  DetectOptions,
  EncodeOptionsFor,
  FormatDetection,
  FormatFor,
  OptionsArgument,
  ParsedBytes,
  TranscodeOptions,
  DecodeResult,
} from "./types.js";

/** Text encodings supported by the legacy converter facade. */
export type BufferEncoding = "utf8" | "utf-8" | "binary" | "latin1" | "base64" | "base64url" | "base64-url" | "hex" | "utf16" | "utf16be" | "utf16le" | string;

/** Public converter facade backed by the default registry. */
export interface ConvertFacade {
  /** Encodes bytes with a named converter. */
  encode<TName extends string>(name: TName, data: BufferSourceLike, ...args: OptionsArgument<EncodeOptionsFor<TName>>): string;
  /** Decodes text with a named converter. */
  decode<TName extends string>(name: TName, text: string, ...args: OptionsArgument<DecodeOptionsFor<TName>>): Uint8Array;
  /** Safely decodes text with a named converter. */
  tryDecode<TName extends string>(name: TName, text: string, ...args: OptionsArgument<DecodeOptionsFor<TName>>): DecodeResult;
  /** Normalizes text with a named converter. */
  normalize<TName extends string>(name: TName, text: string, ...args: OptionsArgument<DecodeOptionsFor<TName>>): string;
  /** Parses text while preserving formatting metadata. */
  parse<TName extends string>(name: TName, text: string, ...args: OptionsArgument<DecodeOptionsFor<TName>>): ParsedBytes<FormatFor<TName>>;
  /** Formats bytes using preserved formatting metadata. */
  format<TName extends string>(name: TName, data: BufferSourceLike, format: FormatFor<TName>): string;
  /** Converts text directly between registered formats. */
  transcode<TFrom extends string, TTo extends string>(text: string, options: TranscodeOptions<TFrom, TTo>): string;
  /** Detects likely formats for an input string. */
  detect<TName extends string = string>(text: string, options?: DetectOptions<TName>): FormatDetection[];
  /** @deprecated Use encode() instead. */
  to<TName extends string>(format: TName, data: BufferSourceLike, ...args: OptionsArgument<EncodeOptionsFor<TName>>): string;
  /** @deprecated Use decode() instead. */
  from<TName extends string>(format: TName, text: string, ...args: OptionsArgument<DecodeOptionsFor<TName>>): Uint8Array;
  /** Converts buffer data to a string using a known encoding. */
  toString(data: BufferSourceLike, encoding?: BufferEncoding): string;
  /** Converts a string to bytes using a known encoding. */
  fromString(text: string, encoding?: BufferEncoding): ArrayBufferLike;
  /** Encodes bytes as Base64 text. */
  toBase64(data: BufferSourceLike): string;
  /** Decodes Base64 text into bytes. */
  fromBase64(text: string): ArrayBufferLike;
  /** Encodes bytes as Base64Url text. */
  toBase64Url(data: BufferSourceLike): string;
  /** Decodes Base64Url text into bytes. */
  fromBase64Url(text: string): ArrayBufferLike;
  /** Encodes bytes as hexadecimal text. */
  toHex(data: BufferSourceLike): string;
  /** Decodes hexadecimal text into bytes. */
  fromHex(text: string): ArrayBufferLike;
  /** Encodes bytes as binary text. */
  toBinary(data: BufferSourceLike): string;
  /** Decodes binary text into bytes. */
  fromBinary(text: string): ArrayBufferLike;
  /** Decodes UTF-8 bytes into text. */
  toUtf8String(data: BufferSourceLike): string;
  /** Encodes UTF-8 text into bytes. */
  fromUtf8String(text: string): ArrayBufferLike;
  /** Decodes UTF-16 bytes into text. */
  toUtf16String(data: BufferSourceLike, littleEndian?: boolean): string;
  /** Encodes UTF-16 text into bytes. */
  fromUtf16String(text: string, littleEndian?: boolean): ArrayBufferLike;
  /** Checks whether a value is hexadecimal text. */
  isHex(text: unknown): text is string;
  /** Checks whether a value is Base64 text. */
  isBase64(text: unknown): text is string;
  /** Checks whether a value is Base64Url text. */
  isBase64Url(text: unknown): text is string;
  /** Normalizes whitespace in a Base64-style string. */
  formatString(text: string): string;
}

function encode<TName extends string>(name: TName, data: BufferSourceLike, ...args: OptionsArgument<EncodeOptionsFor<TName>>): string {
  return defaultConverterRegistry.encode(name, data, ...args);
}

function decode<TName extends string>(name: TName, text: string, ...args: OptionsArgument<DecodeOptionsFor<TName>>): Uint8Array {
  return defaultConverterRegistry.decode(name, text, ...args);
}

function tryDecode<TName extends string>(name: TName, text: string, ...args: OptionsArgument<DecodeOptionsFor<TName>>): DecodeResult {
  return defaultConverterRegistry.tryDecode(name, text, ...args);
}

function normalize<TName extends string>(name: TName, text: string, ...args: OptionsArgument<DecodeOptionsFor<TName>>): string {
  return defaultConverterRegistry.normalize(name, text, ...args);
}

function parse<TName extends string>(name: TName, text: string, ...args: OptionsArgument<DecodeOptionsFor<TName>>): ParsedBytes<FormatFor<TName>> {
  return defaultConverterRegistry.parse(name, text, ...args);
}

function format<TName extends string>(name: TName, data: BufferSourceLike, value: FormatFor<TName>): string {
  return defaultConverterRegistry.format(name, data, value);
}

function transcode<TFrom extends string, TTo extends string>(text: string, options: TranscodeOptions<TFrom, TTo>): string {
  return defaultConverterRegistry.transcode(text, options);
}

function detect<TName extends string = string>(text: string, options?: DetectOptions<TName>): FormatDetection[] {
  return defaultConverterRegistry.detect(text, options);
}

/** Converter helpers for common text and binary encodings. */
export const convert: ConvertFacade = {
  encode,
  decode,
  tryDecode,
  normalize,
  parse,
  format,
  transcode,
  detect,

  to(format, data, ...args) {
    return encode(format, data, ...args);
  },

  from(format, text, ...args) {
    return decode(format, text, ...args);
  },

  /** Converts buffer data to a string using a known encoding. */
  toString(data: BufferSourceLike, encoding: BufferEncoding = "utf8"): string {
    return encode(encoding, data);
  },

  /** Converts a string to bytes using a known encoding. */
  fromString(text: string, encoding: BufferEncoding = "utf8"): ArrayBufferLike {
    return toArrayBuffer(decode(encoding, text));
  },

  /** Encodes bytes as Base64 text. */
  toBase64: base64.encode,
  /** Decodes Base64 text into bytes. */
  fromBase64: (text: string): ArrayBufferLike => toArrayBuffer(base64.decode(text)),
  /** Encodes bytes as Base64Url text. */
  toBase64Url: base64url.encode,
  /** Decodes Base64Url text into bytes. */
  fromBase64Url: (text: string): ArrayBufferLike => toArrayBuffer(base64url.decode(text)),
  /** Encodes bytes as hexadecimal text. */
  toHex: hex.encode,
  /** Decodes hexadecimal text into bytes. */
  fromHex: (text: string): ArrayBufferLike => toArrayBuffer(hex.decode(text, { allowOddLength: true })),
  /** Encodes bytes as binary text. */
  toBinary: binary.encode,
  /** Decodes binary text into bytes. */
  fromBinary: (text: string): ArrayBufferLike => toArrayBuffer(binary.decode(text)),
  /** Decodes UTF-8 bytes into text. */
  toUtf8String: utf8.decode,
  /** Encodes UTF-8 text into bytes. */
  fromUtf8String: (text: string): ArrayBufferLike => toArrayBuffer(utf8.encode(text)),
  /** Decodes UTF-16 bytes into text. */
  toUtf16String: (data: BufferSourceLike, littleEndian = false): string => utf16.decode(data, { littleEndian }),
  /** Encodes UTF-16 text into bytes. */
  fromUtf16String: (text: string, littleEndian = false): ArrayBufferLike =>
    toArrayBuffer(utf16.encode(text, { littleEndian })),
  /** Checks whether a value is hexadecimal text. */
  isHex: hex.is,
  /** Checks whether a value is Base64 text. */
  isBase64: base64.is,
  /** Checks whether a value is Base64Url text. */
  isBase64Url: base64url.is,
  /** Normalizes whitespace in a Base64-style string. */
  formatString: base64.normalize,
} as const;
