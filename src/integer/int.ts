import type { BufferSourceLike } from "../bytes/index.js";
import { toUint8Array } from "../bytes/index.js";
import { decodeBigInt as decodeUnsigned, encode as encodeUnsigned } from "./uint.js";

/** Options that control two's complement encoding. */
export interface IntEncodeOptions {
  /** Exact output length in bytes. The value is sign-extended to fill it. */
  length?: number;
}

function toBigInt(value: number | bigint): bigint {
  if (typeof value === "bigint") {
    return value;
  }
  if (!Number.isSafeInteger(value)) {
    throw new RangeError("Integer must be a safe integer; use bigint for larger values");
  }
  return BigInt(value);
}

/** Encodes an integer as big-endian two's complement, using the fewest bytes unless `length` is set. */
export function encode(value: number | bigint, options: IntEncodeOptions = {}): Uint8Array {
  const integer = toBigInt(value);

  let size = 1;
  while (integer < -(1n << BigInt(size * 8 - 1)) || integer >= 1n << BigInt(size * 8 - 1)) {
    size++;
  }

  const length = options.length ?? size;
  if (!Number.isInteger(length) || length < 1) {
    throw new RangeError("length must be a positive integer");
  }
  if (size > length) {
    throw new RangeError(`Value does not fit into ${length} byte(s)`);
  }

  const unsigned = integer < 0n ? integer + (1n << BigInt(length * 8)) : integer;
  return encodeUnsigned(unsigned, { length });
}

/** Decodes big-endian two's complement bytes into a bigint. */
export function decodeBigInt(data: BufferSourceLike): bigint {
  const bytes = toUint8Array(data);
  if (!bytes.byteLength) {
    throw new RangeError("Two's complement input must not be empty");
  }
  const unsigned = decodeUnsigned(bytes);
  return bytes[0] & 0x80 ? unsigned - (1n << BigInt(bytes.byteLength * 8)) : unsigned;
}

/** Decodes big-endian two's complement bytes into a number. Throws a RangeError when the value is not a safe integer. */
export function decode(data: BufferSourceLike): number {
  const value = decodeBigInt(data);
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError("Value is outside the safe integer range; use decodeBigInt instead");
  }
  return Number(value);
}

/** Checks that two's complement bytes have no redundant leading 0x00 or 0xff byte (X.690 8.3.2). */
export function isMinimal(data: BufferSourceLike): boolean {
  const bytes = toUint8Array(data);
  if (bytes.byteLength < 2) {
    return true;
  }
  const redundantZero = bytes[0] === 0x00 && (bytes[1] & 0x80) === 0;
  const redundantOnes = bytes[0] === 0xff && (bytes[1] & 0x80) !== 0;
  return !redundantZero && !redundantOnes;
}

/** Signed two's complement integer codec helpers. */
export const int = { encode, decode, decodeBigInt, isMinimal } as const;
