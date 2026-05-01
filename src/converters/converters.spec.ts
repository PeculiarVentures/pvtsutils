import { describe, expect, expectTypeOf, it } from "vitest";

import { toUint8Array } from "../bytes/index.js";
import type { BufferSourceLike } from "../bytes/index.js";
import { hex } from "../encoding/index.js";
import type { HexFormat } from "../encoding/hex.js";
import { createConverterRegistry } from "./registry.js";
import type { Converter, DecodeResult, ParsedBytes } from "./types.js";
import { convert, defaultConverterRegistry, defaultConverters, pemConverter } from "./index.js";

const demoConverter: Converter = {
  name: "demo",
  aliases: ["alias", "alt"],
  encode(data: BufferSourceLike): string {
    return `demo:${Array.from(toUint8Array(data)).join(",")}`;
  },
  decode(text: string): Uint8Array {
    const payload = text.slice("demo:".length);
    return payload ? new Uint8Array(payload.split(",").map((value) => Number(value))) : new Uint8Array();
  },
  is(text: unknown): text is string {
    return typeof text === "string" && text.startsWith("demo:");
  },
} as const;

function assertBuiltInConverterTypeErrors(payload: Uint8Array): void {
  // @ts-expect-error hex encode does not accept PEM label options
  convert.encode("hex", payload, { label: "DATA" });
  // @ts-expect-error PEM encode requires a label option
  convert.encode("pem", payload);
}

describe("converters", () => {
  it("manages registered converters and aliases", () => {
    const registry = createConverterRegistry();

    expect(registry.register(demoConverter)).toBe(registry);
    expect(registry.has("demo")).toBe(true);
    expect(registry.has("alias")).toBe(true);
    expect(registry.has(" alt ")).toBe(true);
    expect(registry.get("alias")).toBe(demoConverter);
    expect(registry.list()).toEqual([demoConverter]);
    expect(registry.encode("alt", new Uint8Array([1, 2]))).toBe("demo:1,2");
    expect(Array.from(registry.decode("alias", "demo:3,4"))).toEqual([3, 4]);
    expect(registry.unregister("demo")).toBe(true);
    expect(registry.has("demo")).toBe(false);
    expect(registry.unregister("missing")).toBe(false);
  });

  it("guards against duplicate and invalid registrations", () => {
    const registry = createConverterRegistry([demoConverter]);

    expect(() => registry.register({ ...demoConverter, name: "demo" })).toThrow(
      "Converter 'demo' is already registered",
    );
    expect(() => registry.register({ ...demoConverter, name: " " })).toThrow(TypeError);

    const overridden = registry.register(
      {
        ...demoConverter,
        encode: () => "demo:9",
        decode: () => new Uint8Array([9]),
      },
      { override: true },
    );

    expect(overridden).toBe(registry);
    expect(registry.encode("demo", new Uint8Array([1]))).toBe("demo:9");
    expect(Array.from(registry.decode("demo", "demo:9"))).toEqual([9]);
  });

  it("exposes the built-in converters through the default registry and facade", () => {
    expect(defaultConverters.map((converter) => converter.name)).toEqual([
      "binary",
      "hex",
      "base64",
      "base64url",
      "utf8",
      "utf16be",
      "utf16le",
      "pem",
    ]);
    expect(defaultConverterRegistry.get("latin1")).toBe(defaultConverters[0]);
    expect(defaultConverterRegistry.get("b64url")).toBe(defaultConverters[3]);
    expect(defaultConverterRegistry.get("utf16")).toBe(defaultConverters[5]);
    expect(defaultConverterRegistry.get("pem")).toBe(pemConverter);

    const payload = new Uint8Array([104, 105]);
    const pemText = convert.encode("pem", payload, { label: "DATA" });

    expect(convert.encode("latin1", payload)).toBe("hi");
    expect(Array.from(convert.decode("latin1", "hi"))).toEqual([104, 105]);
    expect(convert.toString(payload, "utf-8")).toBe("hi");
    expect(Array.from(new Uint8Array(convert.fromString("hi", "utf-8")))).toEqual([104, 105]);
    expect(convert.toString(payload, "utf16le")).not.toBe("");
    expect(convert.toBase64(payload)).toBe("aGk=");
    expect(Array.from(new Uint8Array(convert.fromBase64("aGk=")))).toEqual([104, 105]);
    expect(convert.toBase64Url(payload)).toBe("aGk");
    expect(Array.from(new Uint8Array(convert.fromBase64Url("aGk")))).toEqual([104, 105]);
    expect(convert.toHex(new Uint8Array([0, 15]))).toBe("000f");
    expect(Array.from(new Uint8Array(convert.fromString("abc", "hex")))).toEqual([10, 188]);
    expect(Array.from(new Uint8Array(convert.fromHex("abc")))).toEqual([10, 188]);
    expect(convert.toBinary(payload)).toBe("hi");
    expect(Array.from(new Uint8Array(convert.fromBinary("hi")))).toEqual([104, 105]);
    expect(convert.toUtf8String(new Uint8Array([71, 114, 195, 188, 195, 159, 101]))).toBe(
      "Grüße",
    );
    expect(Array.from(new Uint8Array(convert.fromUtf8String("Grüße")))).toEqual([
      71,
      114,
      195,
      188,
      195,
      159,
      101,
    ]);
    expect(convert.toUtf16String(new Uint8Array([0, 65, 1, 0]))).toBe("AĀ");
    expect(Array.from(new Uint8Array(convert.fromUtf16String("AĀ", true)))).toEqual([65, 0, 0, 1]);
    expect(convert.isHex("0a")).toBe(true);
    expect(convert.isBase64("aGk=")).toBe(true);
    expect(convert.isBase64Url("aGk")).toBe(true);
    expect(convert.formatString(" aGk=\n")).toBe("aGk=");
    expect(Array.from(convert.decode("pem", pemText, { label: "DATA" }))).toEqual([104, 105]);
    expect(Array.from(convert.from("pem", pemText, { label: "DATA" }))).toEqual([104, 105]);
  });

  it("supports normalize, parse, format, transcode, tryDecode, and detect", () => {
    const registry = createConverterRegistry(defaultConverters);

    expect(registry.normalize("hex", "0x01:02:0A")).toBe("01020a");

    const parsed = registry.parse("hex", "01:02:03:04");
    expect(parsed).toEqual({
      bytes: new Uint8Array([1, 2, 3, 4]),
      format: {
        case: "lower",
        prefix: "",
        group: {
          size: 1,
          separator: ":",
        },
      },
      normalized: "01020304",
    });
    expect(registry.format("hex", new Uint8Array([170, 187, 204, 221]), parsed.format)).toBe("aa:bb:cc:dd");
    expect(() => registry.parse("base64", "AQID")).toThrow("Converter 'base64' does not support parse()");
    expect(() => registry.format("base64", new Uint8Array([1]), {} as never)).toThrow("Converter 'base64' does not support format()");

    expect(registry.transcode("AQID", { from: "base64", to: "hex", toOptions: hex.formats.colonUpper })).toBe("01:02:03");
    expect(convert.transcode("AQID", { from: "base64", to: "pem", toOptions: { label: "DATA" } })).toBe(
      "-----BEGIN DATA-----\nAQID\n-----END DATA-----\n",
    );

    const ok = registry.tryDecode("hex", "0a0b");
    expect(ok).toEqual({ ok: true, bytes: new Uint8Array([10, 11]) });

    const failure = convert.tryDecode("hex", "oops");
    expect(failure.ok).toBe(false);
    if (!failure.ok) {
      expect(failure.error).toBeInstanceOf(Error);
      expect(failure.error.message).toContain("hexadecimal");
    }

    const detections = convert.detect("-----BEGIN DATA-----\nAQID\n-----END DATA-----\n", {
      formats: ["pem", "base64", "hex"],
    });
    expect(detections[0]).toEqual({ format: "pem", confidence: 1 });
    expect(detections.map((item) => item.format)).toContain("pem");
  });

  it("exposes typed built-in converter options", () => {
    const payload = new Uint8Array([1, 2, 3]);
    const encoded = convert.encode("hex", payload, { case: "upper" });
    const parsed = convert.parse("hex", "01:02:03");
    const decodeResult = convert.tryDecode("hex", "010203");
    const pemText = convert.encode("pem", payload, { label: "DATA" });

    expect(encoded).toBe("010203");
    expect(parsed.normalized).toBe("010203");
    expect(decodeResult.ok).toBe(true);
    expect(pemText).toContain("-----BEGIN DATA-----");

    expectTypeOf(encoded).toEqualTypeOf<string>();
    expectTypeOf(parsed).toEqualTypeOf<ParsedBytes<HexFormat>>();
    expectTypeOf(decodeResult).toEqualTypeOf<DecodeResult>();

    expect(assertBuiltInConverterTypeErrors).toBeTypeOf("function");
  });
});
