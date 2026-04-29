declare const TextEncoder: new() => { encode(text: string): Uint8Array };
declare const TextDecoder: new(label?: string, options?: { fatal?: boolean }) => {
  decode(data: Uint8Array): string;
};

import type { BufferSourceLike } from "../bytes/index.js";
import { toUint8Array } from "../bytes/index.js";

/** Encodes UTF-8 text into bytes. */
export function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text) as Uint8Array;
}

/** Decodes UTF-8 bytes into text. */
export function decode(data: BufferSourceLike): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(toUint8Array(data));
}

/** UTF-8 codec helpers. */
export const utf8 = { encode, decode } as const;
