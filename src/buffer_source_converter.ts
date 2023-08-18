export type BufferSource = ArrayBuffer | ArrayBufferView;

export interface ArrayBufferViewConstructor<T extends ArrayBufferView> {
  readonly prototype: T;
  new(length: number): T;
  // tslint:disable-next-line: unified-signatures
  new(array: ArrayLike<number> | ArrayBufferLike): T;
  new(buffer: ArrayBufferLike, byteOffset?: number, length?: number): T;
}

const ARRAY_BUFFER_NAME = "[object ArrayBuffer]";

export class BufferSourceConverter {

  /**
   * Checks if incoming data is ArrayBuffer
   * @param data Data to be checked
   * @returns Returns `true` if incoming data is ArrayBuffer, otherwise `false`
   */
  public static isArrayBuffer(data: any): data is ArrayBuffer {
    return Object.prototype.toString.call(data) === ARRAY_BUFFER_NAME;
  }

  /**
   * Converts incoming buffer source into ArrayBuffer
   * @param data Buffer source
   * @returns ArrayBuffer representation of data
   * @remarks If incoming data is ArrayBuffer then it returns it without copying,
   * otherwise it copies data into new ArrayBuffer because incoming data can be
   * ArrayBufferView with offset and length which is not equal to buffer length
   */
  public static toArrayBuffer(data: BufferSource): ArrayBuffer {
    if (this.isArrayBuffer(data)) {
      return data;
    }
    if (data.byteLength === data.buffer.byteLength) {
      // if view is not offset return it's buffer without copying
      return data.buffer;
    }

    // don't copy ArrayBufferView to ArrayBuffer if it's not needed
    if (data.byteOffset === 0 && data.byteLength === data.buffer.byteLength) {
      return data.buffer;
    }

    // passing explicit offset values to work around the surprising behavior of
    // Buffer.prototype.slice:
    // https://nodejs.org/api/buffer.html#buffers-and-typedarrays
    return this.toUint8Array(data.buffer)
      .slice(data.byteOffset, data.byteOffset + data.byteLength)
      .buffer;
  }

  /**
   * Converts incoming buffer source into Uint8Array
   * @param data Buffer source
   * @returns Uint8Array representation of data
   */
  public static toUint8Array(data: BufferSource): Uint8Array {
    return this.toView(data, Uint8Array);
  }

  /**
   * Converts a given `BufferSource` to the specified `ArrayBufferView` type.
   * @param data The `BufferSource` to convert.
   * @param type The `ArrayBufferView` constructor to use for the conversion.
   * @returns The converted `ArrayBufferView`.
   * @throws {TypeError} If the provided value is not of type `(ArrayBuffer or ArrayBufferView)`.
   * @remarks If incoming data is ArrayBufferView and it's type is equal to specified type
   * then it returns it without copying, otherwise it copies data into new ArrayBufferView
   * because incoming data can be ArrayBufferView with offset and length which is not equal
   * to buffer length
   */
  public static toView<T extends ArrayBufferView>(data: BufferSource, type: ArrayBufferViewConstructor<T>): T {
    if (data.constructor === type) {
      return data;
    }
    if (this.isArrayBuffer(data)) {
      return new type(data);
    }
    if (this.isArrayBufferView(data)) {
      return new type(data.buffer, data.byteOffset, data.byteLength);
    }
    throw new TypeError("The provided value is not of type '(ArrayBuffer or ArrayBufferView)'");
  }

  /**
   * Checks if incoming data is BufferSource
   * @param data Data to be checked
   * @returns Returns `true` if incoming data is BufferSource, otherwise `false`
   */
  public static isBufferSource(data: any): data is BufferSource {
    return this.isArrayBufferView(data)
      || this.isArrayBuffer(data);
  }

  /**
   * Checks if incoming data is ArraybufferView
   * @param data Data to be checked
   * @returns Returns `true` if incoming data is ArraybufferView, otherwise `false`
   */
  public static isArrayBufferView(data: any): data is ArrayBufferView {
    return ArrayBuffer.isView(data)
      || (data && this.isArrayBuffer(data.buffer));
  }

  /**
   * Checks if buffers are equal
   * @param a Buffer source
   * @param b Buffer source
   * @returns Returns `true` if buffers are equal, otherwise `false`
   */
  public static isEqual(a: BufferSource, b: BufferSource): boolean {
    const aView = BufferSourceConverter.toUint8Array(a);
    const bView = BufferSourceConverter.toUint8Array(b);

    if (aView.length !== bView.byteLength) {
      return false;
    }

    for (let i = 0; i < aView.length; i++) {
      if (aView[i] !== bView[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Concatenates buffers
   * @param buffers List of buffers
   * @returns Concatenated buffer
   */
  public static concat(...buffers: BufferSource[]): ArrayBuffer;
  /**
   * Concatenates buffers
   * @param buffers List of buffers
   * @returns Concatenated buffer
   */
  public static concat(buffers: BufferSource[]): ArrayBuffer;
  /**
   * Concatenates buffers and converts it into specified ArrayBufferView
   * @param buffers List of buffers
   * @param type ArrayBufferView constructor
   * @returns Concatenated buffer of specified type
   */
  public static concat<T extends ArrayBufferView>(buffers: BufferSource[], type: ArrayBufferViewConstructor<T>): T;
  public static concat(...args: any): BufferSource {
    let buffers: BufferSource[];

    // If the first argument is an array and the second is not a function (constructor for ArrayBufferView),
    // it's the single-array overload
    if (Array.isArray(args[0]) && !(args[1] instanceof Function)) {
      buffers = args[0];
    } else if (Array.isArray(args[0]) && args[1] instanceof Function) {  // The third overload with type
      buffers = args[0];
    } else {
      // Variable number of buffer arguments
      if (args[args.length - 1] instanceof Function) {
        // If the last argument is a constructor function, don't include it in buffers
        buffers = args.slice(0, args.length - 1);
      } else {
        // Else, all arguments are buffers
        buffers = args;
      }
    }

    // count total size
    let size = 0;
    for (const buffer of buffers) {
      size += buffer.byteLength;
    }

    const res = new Uint8Array(size);

    // copy all the buffers
    let offset = 0;
    for (const buffer of buffers) {
      const view = this.toUint8Array(buffer);
      res.set(view, offset);
      offset += view.length;
    }

    // convert to specified type if needed
    if (args[args.length - 1] instanceof Function) {
      return this.toView(res, args[args.length - 1]);
    }

    return res.buffer;
  }
}
