import type { ArrayBufferViewLike, BufferSourceLike, ViewConstructor } from "./types.js";
import { isBufferSource, toUint8Array, toView } from "./buffer-source.js";

/** Concatenates buffer sources into a new Uint8Array. */
export function concatToUint8Array(buffers: Iterable<BufferSourceLike>): Uint8Array {
  const views: Uint8Array[] = [];
  let length = 0;

  for (const buffer of buffers) {
    const view = toUint8Array(buffer);
    views.push(view);
    length += view.byteLength;
  }

  const result = new Uint8Array(length);
  let offset = 0;
  for (const view of views) {
    result.set(view, offset);
    offset += view.byteLength;
  }

  return result;
}

/** Concatenates buffer sources and returns either an ArrayBufferLike or a typed view. */
export function concat(...buffers: BufferSourceLike[]): ArrayBufferLike;
export function concat(buffers: Iterable<BufferSourceLike>): ArrayBufferLike;
export function concat<T extends ArrayBufferViewLike>(buffers: Iterable<BufferSourceLike>, type: ViewConstructor<T>): T;
export function concat<T extends ArrayBufferViewLike>(
  first: BufferSourceLike | Iterable<BufferSourceLike>,
  second?: BufferSourceLike | ViewConstructor<T>,
  ...rest: BufferSourceLike[]
): ArrayBufferLike | T {
  let buffers: BufferSourceLike[];
  let type: ViewConstructor<T> | undefined;

  if (typeof second === "function") {
    buffers = Array.from(first as Iterable<BufferSourceLike>);
    type = second;
  } else if (isBufferSource(first)) {
    buffers = [first, second, ...rest].filter(isBufferSource);
  } else {
    buffers = Array.from(first as Iterable<BufferSourceLike>);
    if (second) {
      buffers.push(second);
    }
    buffers.push(...rest);
  }

  const bytes = concatToUint8Array(buffers);
  return type ? toView(bytes, type) : bytes.buffer;
}
