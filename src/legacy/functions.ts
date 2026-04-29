import type { BufferSourceLike } from "../bytes/index.js";
import { concat, equal } from "../bytes/index.js";

/**
 * Assigns own properties from source objects into the target object.
 * @deprecated Prefer object spread or Object.assign.
 */
export function assign<T extends object>(target: T, ...sources: (Partial<T> | undefined | null)[]): T {
  for (const source of sources) {
    if (!source) {
      continue;
    }
    for (const prop in source) {
      target[prop] = source[prop] as T[Extract<keyof T, string>];
    }
  }
  return target;
}

/**
 * Concatenates buffer sources into a single ArrayBuffer.
 * @deprecated Use `concat` from `@peculiar/utils/bytes` instead.
 */
export function combine(...buf: BufferSourceLike[]): ArrayBufferLike {
  return concat(buf);
}

/**
 * Compares two buffer sources for equality.
 * @deprecated Use `equal` from `@peculiar/utils/bytes` instead.
 */
export function isEqual(bytes1: BufferSourceLike, bytes2: BufferSourceLike): boolean {
  return equal(bytes1, bytes2);
}
