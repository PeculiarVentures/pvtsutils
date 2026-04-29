import type { BufferSourceLike } from "../bytes/index.js";
import { base64 } from "../encoding/base64.js";
import type { ParsedBytes, Converter } from "../converters/types.js";
import type { PemBlock, PemDecodeOptions, PemEncodeBlock, PemEncodeOptions, PemFormat } from "./types.js";

const LABEL_REGEX = /^[A-Z0-9][A-Z0-9 ._-]*[A-Z0-9]$/i;
const PEM_BLOCK_REGEX = /-----BEGIN ([^-]+)-----([\s\S]*?)-----END \1-----/g;

interface ParsedPemBody {
  headers?: Record<string, string>;
  base64Lines: string[];
  base64Text: string;
}

interface MatchedPemBlock extends PemBlock {
  lineLength: number;
  newline: "\n" | "\r\n";
}

function assertLabel(label: string): void {
  if (!LABEL_REGEX.test(label)) {
    throw new TypeError(`Invalid PEM label '${label}'`);
  }
}

function wrap(text: string, lineLength: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < text.length; i += lineLength) {
    result.push(text.slice(i, i + lineLength));
  }
  return result;
}

function parseBody(body: string): ParsedPemBody {
  const normalized = body.trim().replace(/\r\n/g, "\n");
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const headers: Record<string, string> = {};
  let index = 0;

  for (; index < lines.length; index++) {
    const line = lines[index];
    const separator = line.indexOf(":");
    if (separator <= 0) {
      break;
    }
    headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }

  return {
    headers: Object.keys(headers).length ? headers : undefined,
    base64Lines: lines.slice(index),
    base64Text: lines.slice(index).join(""),
  };
}

function detectNewline(text: string): "\n" | "\r\n" {
  return /\r\n/.test(text) ? "\r\n" : "\n";
}

function collectBlocks(text: string, options: PemDecodeOptions = {}): MatchedPemBlock[] {
  const blocks: MatchedPemBlock[] = [];
  const requestedLabel = options.label;
  let match: RegExpExecArray | null;

  PEM_BLOCK_REGEX.lastIndex = 0;
  while ((match = PEM_BLOCK_REGEX.exec(text))) {
    const label = match[1].trim();
    if (requestedLabel && label !== requestedLabel) {
      continue;
    }

    assertLabel(label);
    const parsed = parseBody(match[2]);
    blocks.push({
      label,
      data: base64.decode(parsed.base64Text),
      headers: parsed.headers,
      lineLength: parsed.base64Lines[0]?.length ?? 64,
      newline: detectNewline(match[0]),
    });
  }

  if (options.strict && blocks.length === 0) {
    throw new TypeError(requestedLabel
      ? `No PEM block with label '${requestedLabel}' was found`
      : "No PEM blocks were found");
  }

  return blocks;
}

/** Encodes buffer data into a PEM block. */
export function encode(label: string, data: BufferSourceLike, options: PemEncodeOptions = {}): string {
  assertLabel(label);
  const lineLength = options.lineLength ?? 64;
  if (!Number.isInteger(lineLength) || lineLength < 1) {
    throw new RangeError("PEM lineLength must be a positive integer");
  }

  const newline = options.newline ?? "\n";
  const lines = [`-----BEGIN ${label}-----`];

  if (options.headers) {
    for (const [name, value] of Object.entries(options.headers)) {
      lines.push(`${name}: ${value}`);
    }
    lines.push("");
  }

  lines.push(...wrap(base64.encode(data), lineLength));
  lines.push(`-----END ${label}-----`);
  return `${lines.join(newline)}${newline}`;
}

/** Encodes multiple PEM blocks into one PEM bundle. */
export function encodeMany(blocks: readonly PemEncodeBlock[], options: PemEncodeOptions = {}): string {
  return blocks.map((block) => encode(block.label, block.data, { ...options, headers: block.headers ?? options.headers })).join("");
}

/** Decodes PEM text into the contained blocks. */
export function decode(text: string, options: PemDecodeOptions = {}): PemBlock[] {
  return collectBlocks(text, options).map(({ lineLength: _lineLength, newline: _newline, ...block }) => block);
}

/** Finds the first PEM block with the requested label. */
export function find(text: string, label: string): PemBlock | undefined {
  return decode(text, { label })[0];
}

/** Finds all PEM blocks with the requested label. */
export function findAll(text: string, label: string): PemBlock[] {
  return decode(text, { label });
}

/** Decodes the first matching PEM block. */
export function decodeFirst(text: string, label?: string): Uint8Array {
  const [block] = decode(text, { label, strict: true });
  return block.data;
}

/** Parses the first matching PEM block and preserves its formatting metadata. */
export function parse(text: string, options: PemDecodeOptions = {}): ParsedBytes<PemFormat> {
  const [block] = collectBlocks(text, { ...options, strict: true });
  const format: PemFormat = {
    label: block.label,
    headers: block.headers,
    lineLength: block.lineLength,
    newline: block.newline,
  };

  return {
    bytes: block.data,
    format,
    normalized: encode(block.label, block.data, format),
  };
}

/** Formats bytes with preserved PEM metadata. */
export function format(data: BufferSourceLike, value: PemFormat): string {
  return encode(value.label, data, value);
}

/** PEM codec helpers. */
export const pem = { decode, decodeFirst, encode, encodeMany, find, findAll, format, parse } as const;

/** Converter wrapper for PEM text. */
export const pemConverter: Converter<PemEncodeOptions & { label: string }, PemDecodeOptions, PemFormat> = {
  name: "pem",
  encode: (data, options) => {
    if (!options?.label) {
      throw new TypeError("PEM label is required");
    }
    return encode(options.label, data, options);
  },
  decode: (text, options) => decodeFirst(text, options?.label),
  format,
  is: (text): text is string => typeof text === "string" && /-----BEGIN [^-]+-----/.test(text),
  parse,
};
