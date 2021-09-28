// tslint:disable: unified-signatures
export type BufferSource = ArrayBuffer | ArrayBufferView;

export interface ArrayBufferViewConstructor<T extends ArrayBufferView> {
  readonly prototype: T;
  new(length: number): T;
  new(array: ArrayLike<number> | ArrayBufferLike): T;
  new(buffer: ArrayBufferLike, byteOffset?: number, length?: number): T;
}

export class BufferSourceConverter {

  public static isArrayBuffer(data: any): data is ArrayBuffer {
    return Object.prototype.toString.call(data) === '[object ArrayBuffer]'
  }

  public static toArrayBuffer(data: BufferSource): ArrayBuffer {
    const buf = this.toUint8Array(data);
    if (buf.byteOffset || buf.length) {
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    return buf.buffer;
  }

  public static toUint8Array(data: BufferSource): Uint8Array {
    return this.toView(data, Uint8Array);
  }

  /**
   * Converts BufferSource to ArrayBufferView specified view
   * @param data Buffer source
   * @param type Type of ArrayBufferView
   * @returns Specified ArrayBufferView
   */
  public static toView<T extends ArrayBufferView>(data: BufferSource, type: ArrayBufferViewConstructor<T>): T {
    if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) {
      return new type(data.buffer, data.byteOffset, data.byteLength);
    }
    if (this.isArrayBuffer(data)) {
      return new type(data);
    }
    if (this.isArrayBufferView(data)) {
      return new type(data.buffer, data.byteOffset, data.byteLength);
    }
    throw new TypeError("The provided value is not of type '(ArrayBuffer or ArrayBufferView)'");
  }

  public static isBufferSource(data: any): data is BufferSource {
    return this.isArrayBufferView(data)
      || this.isArrayBuffer(data);
  }

  public static isArrayBufferView(data: any): data is ArrayBufferView {
    return ArrayBuffer.isView(data)
      || (data && this.isArrayBuffer(data.buffer));
  }

  public static isEqual(a: BufferSource, b: BufferSource): boolean {
    const aView = BufferSourceConverter.toUint8Array(a);
    const bView = BufferSourceConverter.toUint8Array(b);

    if (aView.length !== bView.byteLength) {
      return false;
    }

    for (let i =0; i < aView.length; i++) {
      if (aView[i] !== bView[i]) {
        return false;
      }
    }

    return true;
  }

}
