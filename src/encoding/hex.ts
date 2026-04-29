import type { BufferSourceLike } from "../bytes/index.js";
import { toUint8Array } from "../bytes/index.js";
import type { ParsedBytes } from "../converters/types.js";

const HEX_CHARACTER_REGEX = /^[0-9a-f]$/i;
const COMMON_SEPARATORS = [" ", "\t", "\n", "\r", ":", "-", "."] as const;

/** Hex casing modes used by format-aware helpers. */
export type HexCase = "lower" | "upper";

/** Options that control hexadecimal decoding. */
export interface HexDecodeOptions {
  allowPrefix?: boolean;
  allowOddLength?: boolean;
  separators?: readonly string[] | "common" | "none";
  strict?: boolean;
}

/** Grouping information for formatted hexadecimal output. */
export interface HexGroupFormat {
  size: number;
  separator: string;
}

/** Line wrapping information for formatted hexadecimal output. */
export interface HexLineFormat {
  bytesPerLine: number;
  separator?: "\n" | "\r\n";
}

/** Options that control hexadecimal encoding. */
export interface HexEncodeOptions {
  case?: HexCase;
  prefix?: "" | "0x";
  group?: HexGroupFormat;
  line?: HexLineFormat;
}

/** Preserved formatting metadata for parsed hexadecimal text. */
export interface HexFormat {
  case: HexCase;
  prefix: "" | "0x";
  group?: HexGroupFormat;
  line?: {
    bytesPerLine: number;
    separator: "\n" | "\r\n";
  };
}

function resolveSeparators(options: HexDecodeOptions): readonly string[] {
  if (options.separators === "none") {
    return [];
  }
  if (!options.separators || options.separators === "common") {
    return COMMON_SEPARATORS;
  }
  return options.separators;
}

function validateSeparator(separator: string): void {
  if (!separator) {
    throw new TypeError("Hex separators must be non-empty strings");
  }
}

function matchSeparator(text: string, index: number, separators: readonly string[]): string | undefined {
  for (const separator of separators) {
    if (text.startsWith(separator, index)) {
      return separator;
    }
  }
  return undefined;
}

function detectCase(text: string): HexCase {
  const hasUpper = /[A-F]/.test(text);
  const hasLower = /[a-f]/.test(text);
  return hasUpper && !hasLower ? "upper" : "lower";
}

function detectLineSeparator(text: string): "\n" | "\r\n" | undefined {
  const match = /\r\n|\n/.exec(text);
  if (!match) {
    return undefined;
  }
  return match[0] === "\r\n" ? "\r\n" : "\n";
}

function compactForDetection(text: string): string {
  return text.replace(/[^0-9a-f]/gi, "");
}

function detectGroup(text: string): HexGroupFormat | undefined {
  const segments = text.match(/[0-9A-Fa-f]+|[^0-9A-Fa-f]+/g) ?? [];
  if (segments.length < 3) {
    return undefined;
  }

  const hexSegments = segments.filter((_, index) => index % 2 === 0);
  const separators = segments.filter((_, index) => index % 2 === 1);
  const separator = separators[0];
  if (!separator || separators.some((item) => item !== separator)) {
    return undefined;
  }
  if (hexSegments.some((segment) => segment.length === 0 || segment.length % 2 !== 0)) {
    return undefined;
  }

  const firstLength = hexSegments[0]?.length ?? 0;
  if (!firstLength) {
    return undefined;
  }
  if (hexSegments.slice(0, -1).some((segment) => segment.length !== firstLength)) {
    return undefined;
  }
  if ((hexSegments[hexSegments.length - 1]?.length ?? 0) > firstLength) {
    return undefined;
  }

  return {
    size: firstLength / 2,
    separator,
  };
}

function detectFormat(text: string): HexFormat {
  const trimmed = text.trim();
  const prefix = /^0x/i.test(trimmed) ? "0x" : "";
  const body = prefix ? trimmed.slice(2) : trimmed;
  const lineSeparator = detectLineSeparator(body);
  const lines = body.split(/\r\n|\n/).filter((line) => line.length > 0);
  const sampleLine = lines[0]?.trim() ?? "";
  const group = detectGroup(sampleLine);
  const format: HexFormat = {
    case: detectCase(trimmed),
    prefix,
  };

  if (group) {
    format.group = group;
  }

  if (lineSeparator && lines.length > 1) {
    const firstLineBytes = compactForDetection(lines[0] ?? "").length / 2;
    if (firstLineBytes > 0 && lines.slice(0, -1).every((line) => compactForDetection(line).length / 2 === firstLineBytes)) {
      format.line = {
        bytesPerLine: firstLineBytes,
        separator: lineSeparator,
      };
    }
  }

  return format;
}

function normalizeText(text: string, options: HexDecodeOptions): string {
  const allowPrefix = options.allowPrefix ?? true;
  const separators = [...resolveSeparators(options)].sort((left, right) => right.length - left.length);
  for (const separator of separators) {
    validateSeparator(separator);
  }

  let working = text.trim();
  if (/^0x/i.test(working)) {
    if (!allowPrefix) {
      throw new TypeError("Hexadecimal text must not include a 0x prefix");
    }
    working = working.slice(2);
  }

  let normalized = "";
  let lastTokenWasSeparator = false;

  for (let index = 0; index < working.length;) {
    const character = working[index] ?? "";
    if (HEX_CHARACTER_REGEX.test(character)) {
      normalized += character;
      lastTokenWasSeparator = false;
      index += 1;
      continue;
    }

    const separator = matchSeparator(working, index, separators);
    if (!separator) {
      throw new TypeError("Input is not valid hexadecimal text");
    }
    if (options.strict && (lastTokenWasSeparator || normalized.length === 0)) {
      throw new TypeError("Hexadecimal text contains misplaced separators");
    }
    lastTokenWasSeparator = true;
    index += separator.length;
  }

  if (options.strict && lastTokenWasSeparator && normalized.length > 0) {
    throw new TypeError("Hexadecimal text must not end with a separator");
  }

  if (normalized.length % 2 !== 0) {
    if (!options.allowOddLength) {
      throw new TypeError("Hexadecimal text must contain an even number of characters");
    }
    normalized = `0${normalized}`;
  }

  return normalized.toLowerCase();
}

function groupPairs(pairs: readonly string[], group?: HexGroupFormat): string {
  if (!group) {
    return pairs.join("");
  }
  if (!Number.isInteger(group.size) || group.size < 1) {
    throw new RangeError("Hex group size must be a positive integer");
  }

  const chunks: string[] = [];
  for (let index = 0; index < pairs.length; index += group.size) {
    chunks.push(pairs.slice(index, index + group.size).join(""));
  }
  return chunks.join(group.separator);
}

/** Removes separators and normalizes hexadecimal text. */
export function normalize(text: string, options: HexDecodeOptions = {}): string {
  return normalizeText(text, options);
}

/** Checks whether a value is normalized hexadecimal text. */
export function is(text: unknown, options: HexDecodeOptions = {}): text is string {
  if (typeof text !== "string") {
    return false;
  }
  try {
    normalize(text, options);
    return true;
  } catch {
    return false;
  }
}

/** Encodes buffer data as formatted hexadecimal text. */
export function encode(data: BufferSourceLike, options: HexEncodeOptions = {}): string {
  const bytes = toUint8Array(data);
  const casing = options.case ?? "lower";
  const pairs = Array.from(bytes, (byte) => {
    const text = byte.toString(16).padStart(2, "0");
    return casing === "upper" ? text.toUpperCase() : text;
  });

  let body = "";
  if (options.line) {
    const bytesPerLine = options.line.bytesPerLine;
    if (!Number.isInteger(bytesPerLine) || bytesPerLine < 1) {
      throw new RangeError("Hex bytesPerLine must be a positive integer");
    }
    const separator = options.line.separator ?? "\n";
    const lines: string[] = [];
    for (let index = 0; index < pairs.length; index += bytesPerLine) {
      lines.push(groupPairs(pairs.slice(index, index + bytesPerLine), options.group));
    }
    body = lines.join(separator);
  } else {
    body = groupPairs(pairs, options.group);
  }

  return `${options.prefix ?? ""}${body}`;
}

/** Decodes hexadecimal text into bytes. */
export function decode(text: string, options: HexDecodeOptions = {}): Uint8Array {
  const normalized = normalize(text, options);

  const result = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    result[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }

  return result;
}

/** Parses hexadecimal text into bytes plus detected formatting metadata. */
export function parse(text: string, options: HexDecodeOptions = {}): ParsedBytes<HexFormat> {
  const normalized = normalize(text, options);
  return {
    bytes: decode(normalized),
    format: detectFormat(text),
    normalized,
  };
}

/** Formats bytes using preserved hexadecimal formatting metadata. */
export function format(data: BufferSourceLike, value: HexFormat): string {
  return encode(data, value);
}

/** Reusable hexadecimal formatting presets. */
export const formats = {
  compact: Object.freeze({} as HexEncodeOptions),
  upper: Object.freeze({ case: "upper" } as HexEncodeOptions),
  colon: Object.freeze({ group: { size: 1, separator: ":" } } as HexEncodeOptions),
  colonUpper: Object.freeze({ case: "upper", group: { size: 1, separator: ":" } } as HexEncodeOptions),
  groupsOf4: Object.freeze({ group: { size: 4, separator: " " } } as HexEncodeOptions),
  prefixed: Object.freeze({ prefix: "0x" } as HexEncodeOptions),
} as const;

/** Hexadecimal codec helpers. */
export const hex = { encode, decode, format, formats, is, normalize, parse } as const;
