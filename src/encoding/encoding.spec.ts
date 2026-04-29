import { afterEach, describe, expect, it, vi } from "vitest";

import * as encoding from "./index.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("encoding", () => {
  it("encodes and decodes binary, utf8, and utf16 data", () => {
    expect(encoding.binary.is("hi")).toBe(true);
    expect(encoding.binary.is(123)).toBe(false);
    expect(encoding.binary.encode(new Uint8Array([104, 105]))).toBe("hi");
    expect(Array.from(encoding.binary.decode("hi"))).toEqual([104, 105]);

    const utf8Text = "Grüße";
    expect(Array.from(encoding.utf8.encode(utf8Text))).toEqual([
      71,
      114,
      195,
      188,
      195,
      159,
      101,
    ]);
    expect(encoding.utf8.decode(encoding.utf8.encode(utf8Text))).toBe(utf8Text);

    const utf16Text = "A\u0100";
    expect(Array.from(encoding.utf16.encode(utf16Text))).toEqual([0, 65, 1, 0]);
    expect(Array.from(encoding.utf16.encode(utf16Text, { littleEndian: true }))).toEqual([
      65,
      0,
      0,
      1,
    ]);
    expect(encoding.utf16.decode(new Uint8Array([0, 65, 1, 0]))).toBe(utf16Text);
    expect(encoding.utf16.decode(new Uint8Array([65, 0, 0, 1]), { littleEndian: true })).toBe(
      utf16Text,
    );
  });

  it("handles base64 helpers with and without Buffer", () => {
    const payload = new Uint8Array([104, 105]);

    expect(encoding.base64.normalize(" aGk=\n")).toBe("aGk=");
    expect(encoding.base64.pad("aGk")).toBe("aGk=");
    expect(encoding.base64.pad("aGk=")).toBe("aGk=");
    expect(encoding.base64.is("aGk=")).toBe(true);
    expect(encoding.base64.is("aGk")).toBe(false);
    expect(encoding.base64.is(123)).toBe(false);

    expect(encoding.base64.encode(payload)).toBe("aGk=");
    expect(Array.from(encoding.base64.decode("aGk="))).toEqual([104, 105]);
    expect(() => encoding.base64.decode("aGk")).toThrow(TypeError);
    expect(() => encoding.base64.decode("aGk?")).toThrow(TypeError);

    vi.stubGlobal("Buffer", undefined);

    expect(encoding.base64.encode(payload)).toBe("aGk=");
    expect(Array.from(encoding.base64.decode("aGk="))).toEqual([104, 105]);
  });

  it("handles base64url helpers", () => {
    const payload = new Uint8Array([104, 105]);

    expect(encoding.base64url.normalize(" aGk \n")).toBe("aGk");
    expect(encoding.base64url.is("aGk")).toBe(true);
    expect(encoding.base64url.is("aGk=")).toBe(false);
    expect(encoding.base64url.encode(payload)).toBe("aGk");
    expect(Array.from(encoding.base64url.decode("aGk"))).toEqual([104, 105]);
    expect(() => encoding.base64url.decode("aGk+")).toThrow(TypeError);
  });

  it("handles hexadecimal helpers", () => {
    const payload = new Uint8Array([0, 15, 16, 255]);

    expect(encoding.hex.normalize(" 0x0A:0b-0C.0d ")).toBe("0a0b0c0d");
    expect(encoding.hex.is("0A:0b-0C.0d")).toBe(true);
    expect(encoding.hex.is("abc")).toBe(false);
    expect(encoding.hex.is("zz")).toBe(false);
    expect(encoding.hex.encode(payload)).toBe("000f10ff");
    expect(encoding.hex.encode(payload, { case: "upper" })).toBe("000F10FF");
    expect(encoding.hex.encode(payload, encoding.hex.formats.colonUpper)).toBe("00:0F:10:FF");
    expect(encoding.hex.encode(payload, encoding.hex.formats.groupsOf4)).toBe("000f10ff");
    expect(encoding.hex.encode(payload, { group: { size: 2, separator: " " } })).toBe("000f 10ff");
    expect(encoding.hex.encode(payload, encoding.hex.formats.prefixed)).toBe("0x000f10ff");
    expect(encoding.hex.encode(payload, { group: { size: 1, separator: ":" }, line: { bytesPerLine: 2 } })).toBe("00:0f\n10:ff");
    expect(Array.from(encoding.hex.decode("0a-0b:0c.0d"))).toEqual([10, 11, 12, 13]);
    expect(Array.from(encoding.hex.decode("0x0a 0B:0c\n0D"))).toEqual([10, 11, 12, 13]);
    expect(Array.from(encoding.hex.decode("abc", { allowOddLength: true }))).toEqual([10, 188]);
    expect(() => encoding.hex.decode("0x0a", { allowPrefix: false })).toThrow(TypeError);
    expect(() => encoding.hex.decode("0a 0b", { separators: "none" })).toThrow(TypeError);
    expect(() => encoding.hex.decode("abc")).toThrow(TypeError);
    expect(() => encoding.hex.decode("zz")).toThrow(TypeError);

    const parsed = encoding.hex.parse("01:02:03:04:05:06");
    expect(Array.from(parsed.bytes)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(parsed.normalized).toBe("010203040506");
    expect(parsed.format).toEqual({
      case: "lower",
      prefix: "",
      group: {
        size: 1,
        separator: ":",
      },
    });
    expect(encoding.hex.format(new Uint8Array([170, 187, 204, 221, 238, 255]), parsed.format)).toBe("aa:bb:cc:dd:ee:ff");

    const multiline = encoding.hex.parse("0x0102 0304\n0506 0708");
    expect(multiline.format).toEqual({
      case: "lower",
      prefix: "0x",
      group: {
        size: 2,
        separator: " ",
      },
      line: {
        bytesPerLine: 4,
        separator: "\n",
      },
    });
    expect(encoding.hex.format(new Uint8Array([170, 187, 204, 221, 238, 255, 17, 34]), multiline.format)).toBe("0xaabb ccdd\neeff 1122");
  });
});
