import * as assert from "assert";
import { Convert, isEqual } from "../src";

describe("Convert", () => {

  ["utf8", "binary", "hex", "base64", "base64url"].forEach((enc) => {
    [
      new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]).buffer,
      Convert.FromString("Привет", "utf8"),
      Convert.FromString("123456789", "binary"),
      Convert.FromString("010203040506070809", "hex"),
      Convert.FromString("Awa=", "base64"),
      Convert.FromString("Aw_", "base64url"),
    ].forEach((buf, index) => {
      it(`Encoding ${enc} buf:${Convert.ToString(buf, enc)}`, () => {
        const str = Convert.ToString(buf, enc);
        assert.strictEqual(typeof str, "string");
        const newBuf = Convert.FromString(str, enc);
        assert.strictEqual(isEqual(buf, newBuf), true);
      });
    });
  });

  context("encoding type", () => {
    it("wrong", () => {
      assert.throws(() => {
        Convert.ToString(new Uint8Array([1]), "wrong");
      });
      assert.throws(() => {
        Convert.FromString("test", "wrong");
      });
    });

    it("optional", () => {
      const str = "Привет";
      const buf = Convert.FromString(str);
      const res = Convert.ToString(buf);
      assert.strictEqual(str, res);
    });

  });

  context("hex", () => {
    it("decode odd size", () => {
      const buf = Convert.FromHex("10203");
      console.log(buf);
      const hex = Convert.ToHex(buf);
      assert.strictEqual(hex, "010203");
    })
  });

  context("isHex", () => {
    it("correct", () => {
      assert.strictEqual(Convert.isHex("1234567890ABCDEF"), true);
    });
    it("wrong", () => {
      assert.strictEqual(Convert.isHex("1234567890ABCDEF!"), false);
    });
  });

  context("isBase64", () => {
    it("correct", () => {
      assert.strictEqual(Convert.isBase64("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890+/AA=="), true);
    });
    it("wrong size", () => {
      assert.strictEqual(Convert.isBase64("ABA"), false);
    });
    it("wrong chars", () => {
      assert.strictEqual(Convert.isBase64("ABA$"), false);
    });
  });

  context("isBase64Url", () => {
    it("correct", () => {
      assert.strictEqual(Convert.isBase64Url("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890-_"), true);
    });
    it("wrong chars", () => {
      assert.strictEqual(Convert.isBase64Url("ABA$"), false);
    });
  });

});
