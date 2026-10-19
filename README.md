<h1 align="center">
  @peculiar/utils
</h1>

<div align="center">

![NPM License](https://img.shields.io/npm/l/@peculiar/utils)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/PeculiarVentures/pvtsutils/publish.yml?branch=master&label=publish)
[![npm version](https://img.shields.io/npm/v/@peculiar/utils.svg)](https://www.npmjs.com/package/@peculiar/utils)
![Coveralls](https://img.shields.io/coverallsCoverage/github/PeculiarVentures/pvtsutils)
[![npm downloads](https://img.shields.io/npm/dm/@peculiar/utils.svg)](https://www.npmjs.com/package/@peculiar/utils)

</div>

Modern byte, text, converter registry, and PEM utilities for TypeScript projects.

The package is designed around a modular v2 API:

- multi-entry exports for tree-shake-friendly imports;
- `encode` and `decode` terminology;
- an extensible runtime converter registry;
- generic PEM helpers without PKI-specific parsing;
- a legacy compatibility layer for historical `pvtsutils` consumers.

## Install

```bash
npm install @peculiar/utils
```

## Breaking Changes In v4

v4 ships ESM only. The CommonJS build (`*.cjs` files and `require` export conditions) has been removed.

- **Node.js `^20.19.0 || >=22.12.0` is required** (previously `>=16`). These versions support `require()` of ES modules, so CommonJS code can keep using `require("@peculiar/utils")` without changes.
- **TypeScript projects that compile to CommonJS** need `"module": "node20"` or `"nodenext"` (TypeScript 5.9+). With `"module": "node16"` the compiler reports TS1479.
- **ESM and bundler setups** (`"module": "preserve"`, `"moduleResolution": "bundler"`) work without changes.
- **Legacy `"moduleResolution": "node"` (node10)** resolves only the root entry through `types`. Subpath imports such as `@peculiar/utils/encoding` need one of the settings above.

The public API is unchanged; only packaging and runtime requirements changed.

## Entry Points

```ts
import { bytes } from "@peculiar/utils";
import { hex, base64, base64url } from "@peculiar/utils/encoding";
import { int, uint } from "@peculiar/utils/integer";
import { pem } from "@peculiar/utils/pem";
import { convert, createConverterRegistry, defaultConverters } from "@peculiar/utils/converters";
import { Convert } from "@peculiar/utils/legacy";
```

## Bytes Helpers

`@peculiar/utils/bytes` stays focused on stateless byte sequence utilities. It does not include stateful readers, writers, ASN.1 parsing, PDF parsing, or other structured binary readers. For structured binary parsing, use a dedicated binary reader package.

```ts
import { bytes } from "@peculiar/utils";

const offset = bytes.indexOf(new Uint8Array([0x25, 0x25, 0x45, 0x4f, 0x46]), "%%EOF", {
  encoding: "ascii",
});

const suffix = bytes.endsWith(new Uint8Array([0x25, 0x25, 0x45, 0x4f, 0x46]), "%%EOF", {
  encoding: "ascii",
});
```

### Find `startxref` In A PDF Tail

```ts
import { lastIndexOf } from "@peculiar/utils/bytes";

const tailStart = Math.max(0, pdf.byteLength - 4096);

const offset = lastIndexOf(pdf, "startxref", {
  encoding: "ascii",
  start: pdf.byteLength,
  end: tailStart,
});

if (offset === -1) {
  throw new Error("PDF startxref marker not found");
}
```

### Find `startxref` Via `tail`

```ts
import { lastIndexOf, tail } from "@peculiar/utils/bytes";

const pdfTail = tail(pdf, 4096);

const localOffset = lastIndexOf(pdfTail, "startxref", {
  encoding: "ascii",
});

const offset = localOffset === -1 ? -1 : pdf.byteLength - pdfTail.byteLength + localOffset;
```

### Check Prefixes And Suffixes

```ts
import { bytes } from "@peculiar/utils";

bytes.startsWith(data, "-----BEGIN", { encoding: "ascii" });
bytes.endsWith(data, "%%EOF", { encoding: "ascii" });
```

### Compare Byte Sequences

```ts
import { bytes } from "@peculiar/utils";

const result = bytes.compare(a, b);

if (result === 0) {
  console.log("equal");
}
```

## Convert API

The default `convert` facade is a convenience singleton backed by the built-in registry.

```ts
import { convert } from "@peculiar/utils/converters";

const bytes = convert.decode("base64", "AQID");
const text = convert.encode("hex", bytes, { case: "upper" });
```

Deprecated `convert.to(...)` and `convert.from(...)` aliases are still available for temporary migration, but the primary v2 API is `encode` and `decode`.

## Transcode

Direct text-to-text transcoding goes through the registry without a manual intermediate step.

```ts
import { convert } from "@peculiar/utils/converters";
import { hex } from "@peculiar/utils/encoding";

const pemText = convert.transcode("AQID", {
  from: "base64",
  to: "pem",
  toOptions: {
    label: "CERTIFICATE",
  },
});

const hexText = convert.transcode(pemText, {
  from: "pem",
  fromOptions: { label: "CERTIFICATE" },
  to: "hex",
  toOptions: hex.formats.colonUpper,
});
```

There is intentionally no chain API.

## Integer Codecs

`@peculiar/utils/integer` converts integers to and from big-endian bytes. Both codecs accept `number` or `bigint`; `decode` returns a `number` and throws a `RangeError` outside the safe integer range, while `decodeBigInt` has no limit.

```ts
import { int, uint } from "@peculiar/utils/integer";

uint.encode(0x010203); // Uint8Array [1, 2, 3]
uint.encode(0x41, { length: 4 }); // Uint8Array [0, 0, 0, 65]
uint.encode(113549, { bitsPerByte: 7 }); // base-128 digits: Uint8Array [6, 119, 13]
uint.decode(new Uint8Array([6, 119, 13]), { bitsPerByte: 7 }); // 113549
uint.decodeBigInt(new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0, 1])); // 18446744073709551617n

int.encode(128); // two's complement: Uint8Array [0, 128]
int.encode(-129); // Uint8Array [255, 127]
int.encode(-2, { length: 3 }); // sign-extended: Uint8Array [255, 255, 254]
int.decode(new Uint8Array([255, 127])); // -129
int.isMinimal(new Uint8Array([0, 127])); // false: redundant leading 0x00
```

`bitsPerByte: 7` produces the raw base-128 digits only. Set the continuation bits yourself when you need an ASN.1 OID arc or tag number.

## Hex Formatting

The `hex` codec accepts common input styles and can format output explicitly.

```ts
import { hex } from "@peculiar/utils/encoding";

hex.decode("0102030405060708090a0b0c");
hex.decode("01020304 05060708 090a0b0c");
hex.decode("01:02:03:04:05:06:07:08:09:0A:0B:0C");
hex.decode("0x0102030405060708090a0b0c");

hex.encode(new Uint8Array([1, 2, 3, 4]), hex.formats.colonUpper);
hex.encode(new Uint8Array([1, 2, 3, 4]), {
  prefix: "0x",
  group: {
    size: 2,
    separator: " ",
  },
});
```

Available presets:

- `hex.formats.compact`
- `hex.formats.upper`
- `hex.formats.colon`
- `hex.formats.colonUpper`
- `hex.formats.groupsOf4`
- `hex.formats.prefixed`

## Preserve Formatting

Use `parse` and `format` when you want to keep the original visual style of a hex string.

```ts
import { hex } from "@peculiar/utils/encoding";

const parsed = hex.parse("01:02:03:04:05:06");

parsed.bytes;
parsed.format;
parsed.normalized;

const updated = hex.format(new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff]), parsed.format);
```

The same capabilities are available through the registry facade:

```ts
import { convert } from "@peculiar/utils/converters";

const parsed = convert.parse("hex", "01:02:03:04");
const formatted = convert.format("hex", new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]), parsed.format);
```

## PEM Helpers

PEM support stays generic. The package does not parse ASN.1, validate PKI semantics, or handle encrypted PEM containers.

```ts
import { pem } from "@peculiar/utils/pem";

const text = pem.encode("CERTIFICATE", new Uint8Array([1, 2, 3]));
const blocks = pem.decode(text);
const block = pem.find(text, "CERTIFICATE");
const matches = pem.findAll(text, "CERTIFICATE");

const bundle = pem.encodeMany([
  { label: "CERTIFICATE", data: new Uint8Array([1, 2, 3]) },
  { label: "PRIVATE KEY", data: new Uint8Array([4, 5, 6]) },
]);
```

## Safe Decode And Detection

```ts
import { convert } from "@peculiar/utils/converters";

const result = convert.tryDecode("hex", "01:02:03");

if (result.ok) {
  console.log(result.bytes);
} else {
  console.error(result.error);
}

const candidates = convert.detect("-----BEGIN DATA-----\nAQID\n-----END DATA-----\n", {
  formats: ["pem", "base64", "hex"],
});
```

## Custom Registries

Applications can create isolated registries instead of mutating global state.

```ts
import { createConverterRegistry, defaultConverters } from "@peculiar/utils/converters";

const registry = createConverterRegistry(defaultConverters);

registry.register({
  name: "base58btc",
  aliases: ["b58"],
  encode(data) {
    return base58btcEncode(data);
  },
  decode(text) {
    return base58btcDecode(text);
  },
});
```

Name and alias conflicts throw by default. Use `{ override: true }` only when replacement is intentional.

## Typed Converter Options

Built-in converters expose typed options through the registry facade.

```ts
import { convert } from "@peculiar/utils/converters";

convert.encode("hex", new Uint8Array([1, 2, 3]), {
  case: "upper",
});
```

Wrong options are rejected by TypeScript:

```ts
convert.encode("hex", new Uint8Array([1, 2, 3]), {
  label: "CERTIFICATE",
});
```

Custom converters can extend the options map via module augmentation:

```ts
declare module "@peculiar/utils/converters" {
  interface ConverterOptionsMap {
    base58btc: {
      encode: Base58EncodeOptions;
      decode: Base58DecodeOptions;
    };
  }
}
```

## Legacy Compatibility

The old `pvtsutils`-style surface is preserved under the legacy entry point.

```ts
import { BufferSourceConverter, Convert, assign, combine, isEqual } from "@peculiar/utils/legacy";
```

Unlike the lenient `utf8` codec, the legacy UTF-8 helpers (`ToUtf8String`, `FromUtf8String`, and `ToString`/`FromString` with `"utf8"`) are strict, as in `pvtsutils` 1.x: malformed bytes and lone surrogates throw instead of being replaced with U+FFFD, and a leading BOM is preserved. The error is a `TypeError` (`pvtsutils` threw `URIError`).

## Migrating From `pvutils`

`pvutils` is superseded by this package. It has no compatibility layer; use the replacements below.

| `pvutils`                                        | Replacement                                                                        |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `utilToBase(value, base, reserved)`              | `uint.encode(value, { bitsPerByte: base, length: reserved })`                      |
| `utilFromBase(data, base)`                       | `uint.decode(data, { bitsPerByte: base })` or `uint.decodeBigInt(...)`             |
| `utilEncodeTC(value)`                            | `int.encode(value)`                                                                |
| `utilDecodeTC.call(block)`                       | `int.decode(block.valueHex)`; `int.isMinimal(...)` for the "Needlessly long" check |
| `isEqualBuffer(a, b)`                            | `bytes.equal(a, b)`                                                                |
| `utilConcatBuf(...)` / `utilConcatView(...)`     | `bytes.concat(...)` / `bytes.concatToUint8Array([...])`                            |
| `bufferToHexCodes(data)`                         | `hex.encode(data, { case: "upper" })`                                              |
| `toBase64(arrayBufferToString(data), url, ...)`  | `base64.encode(data)` / `base64url.encode(data)`                                   |
| `stringToArrayBuffer(fromBase64(text, url))`     | `base64.decode(text)` / `base64url.decode(text)`                                   |
| `arrayBufferToString` / `stringToArrayBuffer`    | `binary.encode` / `binary.decode`                                                  |
| `padNumber(value, length)`                       | `String(value).padStart(length, "0")`                                              |
| `getParametersValue(params, name, defaultValue)` | `params[name] ?? defaultValue`                                                     |
| `clearProps(object, names)`                      | `delete object[name]`                                                              |

Behavior differences:

- The integer codecs throw a `RangeError` for values they cannot represent. `pvutils` returned an empty buffer, and it lost precision above 2^53 (above 2^47 for negative two's complement values).
- `base64.decode` and `base64url.decode` reject invalid text. `pvutils` decoded garbage silently and added zero bytes to unpadded input, so code that trimmed its output (for example to a power-of-two length) no longer needs to.
- `base64url.decode` rejects `=` padding, which `pvutils` accepted.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup, required checks, and release process.
