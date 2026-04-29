import type { BufferSourceLike } from "./types.js";
import { toUint8Array } from "./buffer-source.js";

/** Options that control how byte comparisons are performed. */
export interface EqualOptions {
  constantTime?: boolean;
}

/** Compares two buffer sources for byte equality. */
export function equal(a: BufferSourceLike, b: BufferSourceLike, options: EqualOptions = {}): boolean {
  const left = toUint8Array(a);
  const right = toUint8Array(b);

  if (!options.constantTime && left.byteLength !== right.byteLength) {
    return false;
  }

  const length = Math.max(left.byteLength, right.byteLength);
  let diff = left.byteLength ^ right.byteLength;

  for (let i = 0; i < length; i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }

  return diff === 0;
}
