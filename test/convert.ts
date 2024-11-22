import * as assert from "assert";
import { Convert, isEqual } from "../src";

describe("Convert", () => {

  ["utf8", "binary", "hex", "base64", "base64url"].forEach((enc) => {
    [
      new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]).buffer,
      Convert.FromString("Привет", "utf8"),
      Convert.FromString("123456789", "binary"),
      Convert.FromString("010203040506070809", "hex"),
      Convert.FromString("Awa=", "base64"),
      Convert.FromString("Aw_", "base64url"),
      Buffer.from("text")
    ].forEach((buf, index) => {
      it(`Encoding ${enc} buf: 0x${Convert.ToHex(buf)}`, () => {
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

  context("base64", () => {
    it("decode empty string", () => {
      const buf = Convert.FromBase64("\n\r ");
      assert.strictEqual(buf.byteLength, 0);
    });
    it("decode with space chars", () => {
      const buf = Convert.FromBase64("A\nQ\rA =");
      assert.strictEqual(buf.byteLength, 2);
    });
  });

  context("base64url", () => {
    it("decode empty string", () => {
      const buf = Convert.FromBase64Url("\n\r ");
      assert.strictEqual(buf.byteLength, 0);
    });
    it("decode with space chars", () => {
      const buf = Convert.FromBase64Url("A\nQ\rA ");
      assert.strictEqual(buf.byteLength, 2);
    });
  });

  context("hex", () => {
    it("decode empty string", () => {
      const buf = Convert.FromHex("\n\r ");
      assert.strictEqual(buf.byteLength, 0);
    });
    it("decode with space chars", () => {
      const buf = Convert.FromHex("01\n02\r03 ");
      assert.strictEqual(buf.byteLength, 3);
    });
    it("decode odd size", () => {
      const buf = Convert.FromHex("10203");
      const hex = Convert.ToHex(buf);
      assert.strictEqual(hex, "010203");
    });
    it("decode with space and new line chars", () => {
      const buf = Convert.FromHex(" 01\n02\r03 04\n");
      assert.strictEqual(buf.byteLength, 4);
    });
  });

  context("utf16", () => {
    context("to/from Utf8String", () => {
      it("LE", () => {
        const text = "Привет";
        const buf = Convert.FromUtf8String(text, "utf16le");
        assert.strictEqual(buf.byteLength, 12);
        assert.strictEqual(Convert.ToHex(buf), "1f0440043804320435044204");

        const text2 = Convert.ToUtf8String(buf, "utf16le");
        assert.strictEqual(text2, text);
      });
      it("BE", () => {
        const text = "Привет";
        const buf = Convert.FromUtf8String(text, "utf16be");
        assert.strictEqual(buf.byteLength, 12);
        assert.strictEqual(Convert.ToHex(buf), "041f04400438043204350442");

        const text2 = Convert.ToUtf8String(buf, "utf16be");
        assert.strictEqual(text2, text);
      });
    });
    context("to/from Utf16String", () => {
      it("LE", () => {
        const text = "Привет";
        const buf = Convert.FromUtf16String(text, true);
        assert.strictEqual(buf.byteLength, 12);
        assert.strictEqual(Convert.ToHex(buf), "1f0440043804320435044204");

        const text2 = Convert.ToUtf16String(buf, true);
        assert.strictEqual(text2, text);
      });
      it("BE", () => {
        const text = "Привет";
        const buf = Convert.FromUtf16String(text);
        assert.strictEqual(buf.byteLength, 12);
        assert.strictEqual(Convert.ToHex(buf), "041f04400438043204350442");

        const text2 = Convert.ToUtf16String(buf);
        assert.strictEqual(text2, text);
      });
    });
  });

  context("isHex", () => {
    it("correct", () => {
      assert.strictEqual(Convert.isHex("1234567890ABCDEF"), true);
    });
    it("wrong", () => {
      assert.strictEqual(Convert.isHex("1234567890ABCDEF!"), false);
    });
    it("spaces and new lines", () => {
      assert.strictEqual(Convert.isHex("1234\n5678 90AB\rCDEF"), true);
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
