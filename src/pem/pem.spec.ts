import { describe, expect, it } from "vitest";

import { decode, decodeFirst, encode, encodeMany, find, findAll, format, parse, pemConverter } from "./index.js";

describe("pem", () => {
  it("decodes adjacent single-line blocks surrounded by unrelated text", () => {
    const text = "before -----BEGIN DATA-----AQID-----END DATA----------BEGIN OTHER-----BAUG-----END OTHER----- after";

    expect(decode(text)).toEqual([
      { label: "DATA", data: new Uint8Array([1, 2, 3]) },
      { label: "OTHER", data: new Uint8Array([4, 5, 6]) },
    ]);
    expect(parse(text).format).toEqual({ label: "DATA", headers: undefined, lineLength: 4, newline: "\n" });
    expect(pemConverter.parse?.(text, { label: "OTHER" }).bytes).toEqual(new Uint8Array([4, 5, 6]));
  });

  it("matches raw labels exactly before trimming or filtering them", () => {
    expect(decode("-----BEGIN  data -----AQID-----END  data -----", { label: "data" })).toEqual([{ label: "data", data: new Uint8Array([1, 2, 3]) }]);
    expect(decode("-----BEGIN DATA-----AQID-----END data-----")).toEqual([]);
    expect(decode("-----BEGIN  DATA -----AQID-----END DATA-----")).toEqual([]);
    expect(decode("-----BEGIN BAD?-----AQID-----END BAD?-----", { label: "DATA" })).toEqual([]);
  });

  it("skips unmatched markers and recovers subsequent complete blocks", () => {
    const first = encode("DATA", new Uint8Array([1]));
    const second = encode("DATA", new Uint8Array([2]));
    const text = `-----END DATA-----\n-----BEGIN MISSING-----\n${first}-----END DATA-----\n${second}-----BEGIN DATA-----`;

    expect(decode(text)).toEqual([
      { label: "DATA", data: new Uint8Array([1]) },
      { label: "DATA", data: new Uint8Array([2]) },
    ]);
    expect(decode("-----BEGIN DATA-----AQID-----END OTHER-----")).toEqual([]);
    expect(decode("-----BEGIN -----\n-----BEGIN DATA\n-----BEGIN DATA-----AQID-----END DATA-----")).toEqual([{ label: "DATA", data: new Uint8Array([1, 2, 3]) }]);
  });

  it("preserves matching behavior for nested and overlapping boundaries", () => {
    const nested = "-----BEGIN OUTER-----\n-----BEGIN DATA-----AQID-----END DATA-----\n-----END OUTER-----";

    expect(() => decode(nested)).toThrow("Input is not valid Base64 text");
    expect(decode(nested, { label: "DATA" })).toEqual([]);
    expect(decode("-----BEGIN MISSING-----BEGIN DATA-----AQID-----END DATA-----")).toEqual([{ label: "DATA", data: new Uint8Array([1, 2, 3]) }]);
    expect(() => decode("-----BEGIN DATA-----AQID-----END OTHER-----END DATA-----")).toThrow("Input is not valid Base64 text");
    expect(decode("-----BEGIN DATA-----AQID-----END DATA-----ignored-----END DATA-----")).toEqual([{ label: "DATA", data: new Uint8Array([1, 2, 3]) }]);
  });

  it("preserves empty-body decoding and CRLF formatting metadata", () => {
    expect(decode("-----BEGIN DATA----------END DATA-----")).toEqual([{ label: "DATA", data: new Uint8Array() }]);
    const text = "-----BEGIN DATA-----\r\nProc-Type: 4,ENCRYPTED\r\n\r\nAQID\r\nBAUG\r\n-----END DATA-----\r\n";
    const parsed = parse(text);

    expect(parsed.bytes).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
    expect(parsed.format).toEqual({ label: "DATA", headers: { "Proc-Type": "4,ENCRYPTED" }, lineLength: 4, newline: "\r\n" });
    expect(parsed.normalized).toBe(text);
  });

  it("preserves missing-block behavior across all decoding APIs", () => {
    const text = "-----BEGIN DATA-----\n".repeat(10);

    expect(decode(text)).toEqual([]);
    expect(find(text, "DATA")).toBeUndefined();
    expect(findAll(text, "DATA")).toEqual([]);
    expect(() => decode(text, { strict: true })).toThrow("No PEM blocks were found");
    expect(() => decodeFirst(text)).toThrow("No PEM blocks were found");
    expect(() => decodeFirst(text, "DATA")).toThrow("No PEM block with label 'DATA' was found");
    expect(() => parse(text)).toThrow("No PEM blocks were found");
    expect(() => pemConverter.decode(text)).toThrow("No PEM blocks were found");
    expect(() => pemConverter.parse?.(text)).toThrow("No PEM blocks were found");
  });

  it.each([
    ["repeated BEGIN markers", () => "-----BEGIN CERTIFICATE-----\n".repeat(50_000)],
    ["distinct BEGIN labels", () => Array.from({ length: 50_000 }, (_, index) => `-----BEGIN LABEL${index}-----\n`).join("")],
    ["mismatched END markers", () => "-----BEGIN DATA-----\n-----END OTHER-----\n".repeat(50_000)],
  ])("processes %s without excessive scanning", (_name, createText) => {
    const text = createText();
    const start = Date.now();

    expect(decode(text)).toEqual([]);
    // A generous budget for linear scanning; the old parser takes seconds on these inputs.
    expect(Date.now() - start).toBeLessThan(1_000);
  });

  it("advances past large runs of obsolete END markers", () => {
    const text = `${"-----END DATA-----\n".repeat(50_000)}${encode("DATA", new Uint8Array([1]))}`;

    expect(decode(text)).toEqual([{ label: "DATA", data: new Uint8Array([1]) }]);
  });

  it("encodes and decodes PEM blocks with headers", () => {
    const data = new Uint8Array([104, 105]);

    const text = encode("DATA", data, {
      headers: {
        "Proc-Type": "4,ENCRYPTED",
      },
      lineLength: 4,
      newline: "\r\n",
    });

    expect(text).toBe("-----BEGIN DATA-----\r\nProc-Type: 4,ENCRYPTED\r\n\r\naGk=\r\n-----END DATA-----\r\n");
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
    expect(format(new Uint8Array([170, 187]), parsed.format)).toBe("-----BEGIN DATA-----\r\nProc-Type: 4,ENCRYPTED\r\n\r\nqrs=\r\n-----END DATA-----\r\n");
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
    expect(() => decode(text, { label: "MISSING", strict: true })).toThrow("No PEM block with label 'MISSING' was found");
    expect(() => decode("not pem", { strict: true })).toThrow("No PEM blocks were found");
    expect(() => encode("bad label!", new Uint8Array([1]))).toThrow(TypeError);
    expect(() => encode("DATA", new Uint8Array([1]), { lineLength: 0 })).toThrow(RangeError);
    expect(() => decode("-----BEGIN BAD?-----\naGk=\n-----END BAD?-----\n")).toThrow(TypeError);
    expect(find(text, "SECOND")).toEqual({
      label: "SECOND",
      data: new Uint8Array([2]),
    });
    expect(find(text, "MISSING")).toBeUndefined();
    expect(findAll(text, "FIRST")).toEqual([{ label: "FIRST", data: new Uint8Array([1]) }]);
    expect(
      encodeMany([
        { label: "FIRST", data: new Uint8Array([1]) },
        { label: "SECOND", data: new Uint8Array([2]) },
      ]),
    ).toBe(text);
    expect(pemConverter.is?.("-----BEGIN DATA-----\naGk=\n-----END DATA-----\n")).toBe(true);
    expect(pemConverter.is?.("plain text")).toBe(false);
    expect(pemConverter.encode(new Uint8Array([1]), { label: "ALT" })).toContain("-----BEGIN ALT-----");
    expect(() => pemConverter.encode(new Uint8Array([1]), {} as never)).toThrow("PEM label is required");
  });
});
