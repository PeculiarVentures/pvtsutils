import type { ArrayBufferViewConstructor, ArrayBufferViewLike, BufferSourceLike, ViewConstructor } from "../bytes/index.js";
import {
  concat,
  equal,
  isArrayBuffer,
  isArrayBufferView,
  isBufferSource,
  toArrayBuffer,
  toUint8Array,
  toView,
} from "../bytes/index.js";

/** Legacy static helpers for buffer source conversion.
 * @deprecated Use functions from `@peculiar/utils/bytes` instead.
 */
export class BufferSourceConverter {
  /** Checks whether a value is an ArrayBuffer. */
  public static isArrayBuffer(data: unknown): data is ArrayBuffer {
    return isArrayBuffer(data);
  }

  /** Converts buffer data to an ArrayBuffer. */
  public static toArrayBuffer(data: BufferSourceLike): ArrayBuffer {
    return toArrayBuffer(data);
  }

  /** Converts buffer data to a Uint8Array view. */
  public static toUint8Array(data: BufferSourceLike): Uint8Array {
    return toUint8Array(data);
  }

  /** Converts buffer data into the requested view type. */
  public static toView<T extends ArrayBufferViewLike>(
    data: BufferSourceLike,
    type: ViewConstructor<T>,
  ): T {
    return toView(data, type);
  }

  /** Checks whether a value can be treated as a buffer source. */
  public static isBufferSource(data: unknown): data is BufferSourceLike {
    return isBufferSource(data);
  }

  /** Checks whether a value is an ArrayBufferView. */
  public static isArrayBufferView(data: unknown): data is ArrayBufferViewLike {
    return isArrayBufferView(data);
  }

  /** Compares two buffer sources for byte equality. */
  public static isEqual(a: BufferSourceLike, b: BufferSourceLike): boolean {
    return equal(a, b);
  }

  /** Concatenates buffer sources into an ArrayBuffer or a typed view. */
  public static concat(...buffers: BufferSourceLike[]): ArrayBufferLike;
  public static concat(buffers: BufferSourceLike[]): ArrayBufferLike;
  public static concat<T extends ArrayBufferViewLike>(
    buffers: BufferSourceLike[],
    type: ArrayBufferViewConstructor<T>,
  ): T;
  public static concat<T extends ArrayBufferViewLike>(
    first: BufferSourceLike | BufferSourceLike[],
    second?: BufferSourceLike | ArrayBufferViewConstructor<T>,
    ...rest: BufferSourceLike[]
  ): ArrayBufferLike | T {
    if (Array.isArray(first)) {
      return typeof second === "function"
        ? concat(first, second as ArrayBufferViewConstructor<T>)
        : concat(first);
    }

    const buffers = [first, second, ...rest].filter(Boolean) as BufferSourceLike[];
    return concat(buffers);
  }
}
