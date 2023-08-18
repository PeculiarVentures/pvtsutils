import * as assert from "assert";
import { BufferSourceConverter, Convert } from "../src";
import { Buffer } from "node:buffer";

context("BufferSourceConverter", () => {

  const vectorHex = "1234567890abcdef";
  const vector = Convert.FromHex("1234567890abcdef");

  context("toView", () => {

    it("Buffer to Uint8Array", () => {
      const data = BufferSourceConverter.toView(Buffer.from(vector), Uint8Array);
      assert.strictEqual(data.constructor, Uint8Array);
      assert.equal(data.buffer.byteLength, vector.byteLength);
    });

    it("Uint16Array to Uint8Array", () => {
      const data = BufferSourceConverter.toView(new Uint16Array(vector), Uint8Array);
      assert.strictEqual(data.constructor, Uint8Array);
    });

    it("Uint8Array with offset to Uint8Array", () => {
      const data = BufferSourceConverter.toView(new Uint8Array(vector, 2, 4), Uint8Array);
      assert.strictEqual(data.constructor, Uint8Array);
      assert.equal(data.buffer.byteLength, vector.byteLength);
    });

    it("Uint8Array to Uint8Array", () => {
      const a = new Uint8Array(vector);
      const data = BufferSourceConverter.toView(a, Uint8Array);
      assert.strictEqual(data, a);
    });

  });

  it("convert from Uint8Array", () => {
    const data = BufferSourceConverter.toUint8Array(new Uint8Array(vector));
    assert.strictEqual(Convert.ToHex(data), vectorHex);
  });

  it("convert from Uint16Array", () => {
    const data = BufferSourceConverter.toUint8Array(new Uint16Array(vector));
    assert.strictEqual(Convert.ToHex(data), vectorHex);
  });

  it("convert from ArrayBuffer", () => {
    const data = BufferSourceConverter.toUint8Array(vector);
    assert.strictEqual(Convert.ToHex(data), vectorHex);
  });

  it("convert from Buffer", () => {
    const data = BufferSourceConverter.toUint8Array(Buffer.from(vector));
    assert.strictEqual(Convert.ToHex(data), vectorHex);
  });

  it("convert from object with ArrayBuffer buffer property", () => {
    const data = BufferSourceConverter.toUint8Array({ buffer: vector } as ArrayBufferView);
    assert.strictEqual(Convert.ToHex(data), vectorHex);
  });

  it("convert from offset to Uint8Array", () => {
    const source = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const offset = source.subarray(5, 10);
    const data = BufferSourceConverter.toUint8Array(offset);
    assert.strictEqual(Convert.ToHex(data), "0506070809");
  });

  it("convert from offset to ArrayBuffer", () => {
    const source = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const offset = source.subarray(5, 10);
    const data = BufferSourceConverter.toArrayBuffer(offset);
    assert.strictEqual(Convert.ToHex(data), "0506070809");
  });

  it("convert incorrect type", () => {
    const source = "wrong data";
    assert.throws(() => {
      BufferSourceConverter.toArrayBuffer(source as any);
    }, TypeError);
  });

  context("toArrayBuffer", () => {

    it("keeps slice offsets for Node.js buffer slices", () => {
      const size = 3;
      const slice = Buffer.from(vector).slice(0, size);
      const data = BufferSourceConverter.toArrayBuffer(slice);
      assert.equal(data.byteLength, size);
    });

  });

  context("isBufferSource", () => {

    it("ArrayBufferView", () => {
      assert.strictEqual(BufferSourceConverter.isBufferSource(new Uint16Array(0)), true);
    });

    it("ArrayBuffer", () => {
      assert.strictEqual(BufferSourceConverter.isBufferSource(new ArrayBuffer(0)), true);
    });

    it("Buffer", () => {
      assert.strictEqual(BufferSourceConverter.isBufferSource(Buffer.alloc(0)), true);
    });

    it("Not BufferSource", () => {
      assert.strictEqual(BufferSourceConverter.isBufferSource([1, 2, 3, 4, 5, 6, 7]), false);
    });

  });

  context("isEqual", () => {

    it("not equal, the same length", () => {
      const a = new Uint8Array([1, 2, 3, 4, 5]);
      const b = new Uint8Array([1, 2, 3, 4, 6]);

      const res = BufferSourceConverter.isEqual(a, b);
      assert.strictEqual(res, false);
    });

    it("not equal", () => {
      const a = new Uint8Array([1, 2, 3, 4, 5]);
      const b = new Uint8Array([1, 2, 3, 4, 5, 6]);

      const res = BufferSourceConverter.isEqual(a, b);
      assert.strictEqual(res, false);
    });

    it("equal", () => {
      const a = new Uint8Array([1, 2, 3, 4, 5]);
      const b = new Uint8Array([1, 2, 3, 4, 5]);

      const res = BufferSourceConverter.isEqual(a, b);
      assert.strictEqual(res, true);
    });

  });

  context("concat", () => {
    const buf1 = new ArrayBuffer(1);
    const buf2 = new Uint8Array([1, 2, 3, 4]);
    const buf3 = new Uint16Array([5, 6]);
    const buf4 = buf2.subarray(1, 3);
    const testVector = "0001020304050006000203";

    it("spread arguments", () => {
      const res = BufferSourceConverter.concat(buf1, buf2, buf3, buf4);
      assert.ok(res instanceof ArrayBuffer);
      assert.strictEqual(Convert.ToHex(res), testVector);
    });

    it("array", () => {
      const res = BufferSourceConverter.concat([buf1, buf2, buf3, buf4]);
      assert.ok(res instanceof ArrayBuffer);
      assert.strictEqual(Convert.ToHex(res), testVector);
    });

    it("type", () => {
      const res = BufferSourceConverter.concat([buf1, buf2, buf3, buf4], Uint8Array);
      assert.strictEqual(Convert.ToHex(res), testVector);
      assert.ok(res instanceof Uint8Array);
    });
  });

});
