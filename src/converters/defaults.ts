import { base64, base64url, binary, hex, utf8, utf16 } from "../encoding/index.js";
import { pemConverter } from "../pem/index.js";
export { pemConverter } from "../pem/index.js";
import type { Converter } from "./types.js";
import { createConverterRegistry } from "./registry.js";

/** Converter for binary text where each character maps to one byte. */
export const binaryConverter: Converter = {
  name: "binary",
  aliases: ["latin1"],
  encode: binary.encode,
  decode: binary.decode,
  is: binary.is,
};

/** Converter for hexadecimal text. */
export const hexConverter: Converter = {
  name: "hex",
  encode: hex.encode,
  decode: hex.decode,
  format: hex.format,
  is: hex.is,
  normalize: hex.normalize,
  parse: hex.parse,
};

/** Converter for standard Base64 text. */
export const base64Converter: Converter = {
  name: "base64",
  aliases: ["b64"],
  encode: base64.encode,
  decode: base64.decode,
  is: base64.is,
  normalize: base64.normalize,
};

/** Converter for URL-safe Base64 text. */
export const base64urlConverter: Converter = {
  name: "base64url",
  aliases: ["base64-url", "b64url"],
  encode: base64url.encode,
  decode: base64url.decode,
  is: base64url.is,
  normalize: base64url.normalize,
};

/** Converter for UTF-8 text. */
export const utf8Converter: Converter = {
  name: "utf8",
  aliases: ["utf-8"],
  encode: (data) => utf8.decode(data),
  decode: (text) => utf8.encode(text),
  is: (text): text is string => typeof text === "string",
};

/** Converter for big-endian UTF-16 text. */
export const utf16beConverter: Converter = {
  name: "utf16be",
  aliases: ["utf16", "utf-16", "utf-16be"],
  encode: (data) => utf16.decode(data),
  decode: (text) => utf16.encode(text),
  is: (text): text is string => typeof text === "string",
};

/** Converter for little-endian UTF-16 text. */
export const utf16leConverter: Converter = {
  name: "utf16le",
  aliases: ["utf-16le", "ucs2", "usc2"],
  encode: (data) => utf16.decode(data, { littleEndian: true }),
  decode: (text) => utf16.encode(text, { littleEndian: true }),
  is: (text): text is string => typeof text === "string",
};

/** The built-in converter set shipped with the package. */
export const defaultConverters = [
  binaryConverter,
  hexConverter,
  base64Converter,
  base64urlConverter,
  utf8Converter,
  utf16beConverter,
  utf16leConverter,
  pemConverter,
] as const;

/** The default registry preloaded with the built-in converters. */
export const defaultConverterRegistry = createConverterRegistry(defaultConverters);
