import { describe, expect, it } from "vitest";

import { decode, decodeFirst, encode, encodeMany, find, findAll, format, parse, pemConverter } from "./index.js";

describe("pem", () => {
  it("encodes and decodes PEM blocks with headers", () => {
    const data = new Uint8Array([104, 105]);

    const text = encode("DATA", data, {
      headers: {
        "Proc-Type": "4,ENCRYPTED",
      },
      lineLength: 4,
      newline: "\r\n",
    });

    expect(text).toBe(
      "-----BEGIN DATA-----\r\nProc-Type: 4,ENCRYPTED\r\n\r\naGk=\r\n-----END DATA-----\r\n",
    );
    expect(decode(text)).toEqual([
      {
        label: "DATA",
        data: data,
        headers: {
          "Proc-Type": "4,ENCRYPTED",
        },
      },
    ]);
    expect(Array.from(decodeFirst(text))).toEqual([104, 105]);
    expect(Array.from(pemConverter.decode(text, { label: "DATA" }))).toEqual([104, 105]);

    const parsed = parse(text);
    expect(parsed.format).toEqual({
      label: "DATA",
      headers: {
        "Proc-Type": "4,ENCRYPTED",
      },
      lineLength: 4,
      newline: "\r\n",
    });
    expect(format(new Uint8Array([170, 187]), parsed.format)).toBe(
      "-----BEGIN DATA-----\r\nProc-Type: 4,ENCRYPTED\r\n\r\nqrs=\r\n-----END DATA-----\r\n",
    );
  });

  it("filters labels and rejects invalid PEM input", () => {
    const first = encode("FIRST", new Uint8Array([1]));
    const second = encode("SECOND", new Uint8Array([2]));
    const text = `${first}${second}`;

    expect(decode(text, { label: "SECOND" })).toEqual([
      {
        label: "SECOND",
        data: new Uint8Array([2]),
      },
    ]);
    expect(decode(text, { label: "MISSING" })).toEqual([]);
    expect(() => decode(text, { label: "MISSING", strict: true })).toThrow(
      "No PEM block with label 'MISSING' was found",
    );
    expect(() => decode("not pem", { strict: true })).toThrow("No PEM blocks were found");
    expect(() => encode("bad label!", new Uint8Array([1]))).toThrow(TypeError);
    expect(() => encode("DATA", new Uint8Array([1]), { lineLength: 0 })).toThrow(RangeError);
    expect(() =>
      decode("-----BEGIN BAD?-----\naGk=\n-----END BAD?-----\n"),
    ).toThrow(TypeError);
    expect(find(text, "SECOND")).toEqual({
      label: "SECOND",
      data: new Uint8Array([2]),
    });
    expect(find(text, "MISSING")).toBeUndefined();
    expect(findAll(text, "FIRST")).toEqual([{ label: "FIRST", data: new Uint8Array([1]) }]);
    expect(encodeMany([
      { label: "FIRST", data: new Uint8Array([1]) },
      { label: "SECOND", data: new Uint8Array([2]) },
    ])).toBe(text);
    expect(pemConverter.is?.("-----BEGIN DATA-----\naGk=\n-----END DATA-----\n")).toBe(true);
    expect(pemConverter.is?.("plain text")).toBe(false);
    expect(pemConverter.encode(new Uint8Array([1]), { label: "ALT" })).toContain(
      "-----BEGIN ALT-----",
    );
    expect(() => pemConverter.encode(new Uint8Array([1]), {} as never)).toThrow("PEM label is required");
  });
});
