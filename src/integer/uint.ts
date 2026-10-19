import type { BufferSourceLike } from "../bytes/index.js";
import { toUint8Array } from "../bytes/index.js";

/** Options that control unsigned integer encoding. */
export interface UintEncodeOptions {
  /** Bits stored in each output byte, from 1 to 8. Defaults to 8; use 7 for base-128 digits. */
  bitsPerByte?: number;
  /** Exact output length in bytes. The value is left-padded with zero digits. */
  length?: number;
}

/** Options that control unsigned integer decoding. */
export interface UintDecodeOptions {
  /** Bits stored in each input byte, from 1 to 8. Defaults to 8; use 7 for base-128 digits. */
  bitsPerByte?: number;
}

function resolveBits(bitsPerByte = 8): number {
  if (!Number.isInteger(bitsPerByte) || bitsPerByte < 1 || bitsPerByte > 8) {
    throw new RangeError("bitsPerByte must be an integer from 1 to 8");
  }
  return bitsPerByte;
}

function pad(digits: number[], length: number | undefined): Uint8Array {
  if (length === undefined) {
    return Uint8Array.from(digits);
  }
  if (!Number.isInteger(length) || length < 0) {
    throw new RangeError("length must be a non-negative integer");
  }
  if (digits.length > length) {
    throw new RangeError(`Value does not fit into ${length} byte(s)`);
  }
  const result = new Uint8Array(length);
  result.set(digits, length - digits.length);
  return result;
}

/** Encodes a non-negative integer as big-endian digits of `bitsPerByte` bits. Zero encodes as one byte. */
export function encode(value: number | bigint, options: UintEncodeOptions = {}): Uint8Array {
  const bits = resolveBits(options.bitsPerByte);
  const digits: number[] = [];

  if (typeof value === "bigint") {
    if (value < 0n) {
      throw new RangeError("Unsigned integer must not be negative");
    }
    const shift = BigInt(bits);
    const mask = (1n << shift) - 1n;
    do {
      digits.push(Number(value & mask));
      value >>= shift;
    } while (value > 0n);
  } else {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError("Unsigned integer must be a non-negative safe integer; use bigint for larger values");
    }
    const radix = 2 ** bits;
    do {
      digits.push(value % radix);
      value = Math.floor(value / radix);
    } while (value > 0);
  }

  return pad(digits.reverse(), options.length);
}

/** Decodes big-endian digits into a bigint. An empty input decodes as zero. */
export function decodeBigInt(data: BufferSourceLike, options: UintDecodeOptions = {}): bigint {
  const bits = resolveBits(options.bitsPerByte);
  const shift = BigInt(bits);
  const radix = 1 << bits;
  let result = 0n;
  for (const digit of toUint8Array(data)) {
    if (digit >= radix) {
      throw new RangeError(`Byte 0x${digit.toString(16)} exceeds ${bits} bits`);
    }
    result = (result << shift) | BigInt(digit);
  }
  return result;
}

/** Decodes big-endian digits into a number. Throws a RangeError when the value is not a safe integer. */
export function decode(data: BufferSourceLike, options: UintDecodeOptions = {}): number {
  const bits = resolveBits(options.bitsPerByte);
  const radix = 2 ** bits;
  let result = 0;
  for (const digit of toUint8Array(data)) {
    if (digit >= radix) {
      throw new RangeError(`Byte 0x${digit.toString(16)} exceeds ${bits} bits`);
    }
    if (result > (Number.MAX_SAFE_INTEGER - digit) / radix) {
      throw new RangeError("Value exceeds Number.MAX_SAFE_INTEGER; use decodeBigInt instead");
    }
    result = result * radix + digit;
  }
  return result;
}

/** Unsigned big-endian integer codec helpers. */
export const uint = { encode, decode, decodeBigInt } as const;
