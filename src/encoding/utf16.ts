import type { BufferSourceLike } from "../bytes/index.js";
import { toArrayBuffer } from "../bytes/index.js";

/** Options that control UTF-16 endianness. */
export interface Utf16Options {
  littleEndian?: boolean;
}

/** Encodes UTF-16 text into bytes. */
export function encode(text: string, options: Utf16Options = {}): Uint8Array {
  const result = new ArrayBuffer(text.length * 2);
  const view = new DataView(result);
  for (let i = 0; i < text.length; i++) {
    view.setUint16(i * 2, text.charCodeAt(i), options.littleEndian ?? false);
  }
  return new Uint8Array(result);
}

/** Decodes UTF-16 bytes into text. */
export function decode(data: BufferSourceLike, options: Utf16Options = {}): string {
  const buffer = toArrayBuffer(data);
  const view = new DataView(buffer);
  let result = "";
  for (let i = 0; i < buffer.byteLength; i += 2) {
    result += String.fromCharCode(view.getUint16(i, options.littleEndian ?? false));
  }
  return result;
}

/** UTF-16 codec helpers. */
export const utf16 = { encode, decode } as const;
