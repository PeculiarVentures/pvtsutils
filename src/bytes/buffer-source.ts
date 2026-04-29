import type { ArrayBufferViewConstructor, ArrayBufferViewLike, BufferSourceLike, ViewConstructor } from "./types.js";

const ARRAY_BUFFER_TAG = "[object ArrayBuffer]";
const SHARED_ARRAY_BUFFER_TAG = "[object SharedArrayBuffer]";

function tagOf(value: unknown): string {
  return Object.prototype.toString.call(value);
}

function isDataViewConstructor(type: ViewConstructor): boolean {
  return type === DataView || type.prototype instanceof DataView;
}

function bytesPerElement(type: ViewConstructor): number {
  if (isDataViewConstructor(type)) {
    return 1;
  }

  const value = (type as unknown as { BYTES_PER_ELEMENT?: number }).BYTES_PER_ELEMENT;
  return value ?? 1;
}

function copyBytes(data: BufferSourceLike): Uint8Array {
  const view = toUint8Array(data);
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy;
}

/** Checks whether a value is an ArrayBuffer. */
export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return tagOf(value) === ARRAY_BUFFER_TAG;
}

/** Checks whether a value is a SharedArrayBuffer. */
export function isSharedArrayBuffer(value: unknown): value is SharedArrayBuffer {
  return typeof SharedArrayBuffer !== "undefined" && tagOf(value) === SHARED_ARRAY_BUFFER_TAG;
}

/** Checks whether a value is an ArrayBuffer-like object. */
export function isArrayBufferLike(value: unknown): value is ArrayBufferLike {
  return isArrayBuffer(value) || isSharedArrayBuffer(value);
}

/** Checks whether a value is an ArrayBufferView. */
export function isArrayBufferView(value: unknown): value is ArrayBufferViewLike {
  return ArrayBuffer.isView(value);
}

/** Checks whether a value can be treated as a buffer source. */
export function isBufferSource(value: unknown): value is BufferSourceLike {
  return isArrayBufferLike(value) || isArrayBufferView(value);
}

/** Throws when a value is not a supported buffer source. */
export function assertBufferSource(value: unknown): asserts value is BufferSourceLike {
  if (!isBufferSource(value)) {
    throw new TypeError("Expected ArrayBuffer, SharedArrayBuffer, or ArrayBufferView");
  }
}

/** Returns a Uint8Array view over the input without copying. */
export function toUint8Array(data: BufferSourceLike): Uint8Array {
  assertBufferSource(data);

  if (isArrayBufferLike(data)) {
    return new Uint8Array(data);
  }

  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

/** Returns a copied Uint8Array for the input buffer source. */
export function toUint8ArrayCopy(data: BufferSourceLike): Uint8Array {
  return copyBytes(data);
}

/** Returns the underlying ArrayBuffer, copying when required. */
export function toArrayBuffer(data: BufferSourceLike): ArrayBuffer {
  assertBufferSource(data);

  if (isArrayBuffer(data)) {
    return data;
  }

  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(toUint8Array(data));
  return buffer;
}

/** Returns an ArrayBuffer-like value, copying only when needed. */
export function toArrayBufferLike(data: BufferSourceLike): ArrayBufferLike {
  assertBufferSource(data);

  if (isArrayBufferLike(data)) {
    return data;
  }

  if (data.byteOffset === 0 && data.byteLength === data.buffer.byteLength) {
    return data.buffer;
  }

  return copyBytes(data).buffer;
}

/** Casts buffer data into the requested view type. */
export function toView<T extends ArrayBufferViewLike>(
  data: BufferSourceLike,
  type: ViewConstructor<T>,
): T {
  assertBufferSource(data);

  if (ArrayBuffer.isView(data) && data.constructor === type) {
    return data as T;
  }

  const view = toUint8Array(data);
  const elementSize = bytesPerElement(type);

  if (view.byteOffset % elementSize !== 0 || view.byteLength % elementSize !== 0) {
    throw new RangeError(`Cannot create ${type.name} over unaligned byte range`);
  }

  if (isDataViewConstructor(type)) {
    return new (type as unknown as DataViewConstructor)(view.buffer, view.byteOffset, view.byteLength) as unknown as T;
  }

  return new (type as ArrayBufferViewConstructor<T>)(
    view.buffer,
    view.byteOffset,
    view.byteLength / elementSize,
  );
}

/** Copies buffer data into the requested view type. */
export function toViewCopy<T extends ArrayBufferViewLike>(
  data: BufferSourceLike,
  type: ViewConstructor<T>,
): T {
  const copy = toUint8ArrayCopy(data);
  return toView(copy, type);
}
