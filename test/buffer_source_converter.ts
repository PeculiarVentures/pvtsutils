import * as assert from "assert";
import { BufferSourceConverter, Convert } from "../src";

context("BufferSourceConverter", () => {

  const vectorHex = "1234567890abcdef";
  const vector = Convert.FromHex("1234567890abcdef");

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

});
