import * as assert from "assert";
import { assign, combine, isEqual } from "../src";

describe("helper", () => {

  it("assign", () => {
    const obj = assign({}, { a: 1 }, { b: 2 }, { b: 3 });
    assert.equal(obj.a, 1);
    assert.equal(obj.b, 3);
  });

  it("combine", () => {
    const b1 = new Uint8Array([1]).buffer;
    const b2 = new Uint8Array([2]).buffer;
    const b3 = new Uint8Array([3]).buffer;

    const b = new Uint8Array(combine(b1, b2, b3));

    assert.equal(b.byteLength, 3);
    assert.equal(b[0], 1);
    assert.equal(b[1], 2);
    assert.equal(b[2], 3);
  });

  context("isEqual", () => {

    it("empty buffer", () => {
      const b1 = new ArrayBuffer(1);
      const b2: any = null;

      assert.equal(isEqual(b1, b2), false);
    });

    it("different length", () => {
      const b1 = new ArrayBuffer(1);
      const b2 = new ArrayBuffer(2);

      assert.equal(isEqual(b1, b2), false);
    });

    it("different value", () => {
      const b1 = new Uint8Array([1, 2, 3]);
      const b2 = new Uint8Array([1, 2, 0]);

      assert.equal(isEqual(b1, b2), false);
    });

    it("equal", () => {
      const b1 = new Uint8Array([1, 2, 3]);
      const b2 = new Uint8Array([1, 2, 3]);

      assert.equal(isEqual(b1, b2), true);
    });

  });

});
