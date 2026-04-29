import type { BufferSourceLike } from "../bytes/index.js";
import type {
  Converter,
  ConverterRegistry,
  DetectOptions,
  FormatDetection,
  RegisterOptions,
  TranscodeOptions,
} from "./types.js";

function keyOf(name: string): string {
  return name.trim().toLowerCase();
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function removeConverter(converters: Map<string, Converter>, primaryNames: Set<string>, converter: Converter): void {
  for (const alias of [converter.name, ...(converter.aliases ?? [])]) {
    converters.delete(keyOf(alias));
  }
  primaryNames.delete(keyOf(converter.name));
}

function requireCapability<TCapability extends "normalize" | "parse" | "format">(
  converter: Converter,
  name: string,
  capability: TCapability,
): NonNullable<Converter[TCapability]> {
  const method = converter[capability];
  if (typeof method !== "function") {
    throw new Error(`Converter '${name}' does not support ${capability}()`);
  }
  return method;
}

function detectConfidence(name: string, text: string, converter: Converter): number {
  const normalizedName = keyOf(converter.name || name);
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }

  let accepted = false;
  if (converter.is) {
    accepted = converter.is(text);
  }

  let decodable = false;
  try {
    converter.decode(text);
    decodable = true;
  } catch {
    decodable = false;
  }

  if (!accepted && !decodable) {
    return 0;
  }

  switch (normalizedName) {
    case "pem":
      return /-----BEGIN [^-]+-----/.test(text) ? 1 : 0;
    case "hex": {
      const compact = trimmed.replace(/^0x/i, "").replace(/[\s:.-]/g, "");
      if (!compact || /[^0-9a-f]/i.test(compact) || compact.length % 2 !== 0) {
        return 0;
      }
      if (/^0x/i.test(trimmed) || /[:\s.-]/.test(trimmed)) {
        return 0.95;
      }
      if (/[a-f]/.test(trimmed) || /[A-F]/.test(trimmed)) {
        return 0.8;
      }
      return 0.45;
    }
    case "base64url":
      if (/[-_]/.test(trimmed)) {
        return 0.95;
      }
      if (/=/.test(trimmed)) {
        return 0.1;
      }
      return 0.6;
    case "base64":
      if (/[+/=]/.test(trimmed)) {
        return 0.9;
      }
      return 0.55;
    case "binary":
    case "utf8":
    case "utf16be":
    case "utf16le":
      return 0;
    default:
      return accepted && decodable ? 0.75 : 0.5;
  }
}

/** Creates a converter registry and optionally seeds it with converters. */
export function createConverterRegistry(initialConverters: Iterable<Converter> = []): ConverterRegistry {
  const converters = new Map<string, Converter>();
  const primaryNames = new Set<string>();

  const api: ConverterRegistry = {
    register(converter: Converter, options: RegisterOptions = {}) {
      if (!converter.name || !keyOf(converter.name)) {
        throw new TypeError("Converter name is required");
      }
      const names = [...new Set([converter.name, ...(converter.aliases ?? [])].map(keyOf))];
      const conflicts = new Set<Converter>();
      for (const name of names) {
        const existing = converters.get(name);
        if (!existing) {
          continue;
        }
        if (!options.override) {
          throw new Error(`Converter '${name}' is already registered`);
        }
        conflicts.add(existing);
      }
      for (const conflicting of conflicts) {
        removeConverter(converters, primaryNames, conflicting);
      }
      for (const name of names) {
        converters.set(name, converter);
      }
      primaryNames.add(keyOf(converter.name));
      return this;
    },

    unregister(name: string) {
      const converter = converters.get(keyOf(name));
      if (!converter) {
        return false;
      }
      removeConverter(converters, primaryNames, converter);
      return true;
    },

    has(name: string) {
      return converters.has(keyOf(name));
    },

    get(name: string) {
      const converter = converters.get(keyOf(name));
      if (!converter) {
        throw new Error(`Converter '${name}' is not registered`);
      }
      return converter;
    },

    list() {
      return [...primaryNames].map((name) => this.get(name));
    },

    encode(name: string, data: BufferSourceLike, options?: unknown) {
      return this.get(name).encode(data, options);
    },

    decode(name: string, text: string, options?: unknown) {
      return this.get(name).decode(text, options);
    },

    tryDecode(name: string, text: string, options?: unknown) {
      try {
        return { ok: true, bytes: this.decode(name, text, options) } as const;
      } catch (error) {
        return { ok: false, error: toError(error) } as const;
      }
    },

    normalize(name: string, text: string, options?: unknown) {
      const converter = this.get(name);
      return requireCapability(converter, name, "normalize").call(converter, text, options);
    },

    parse(name: string, text: string, options?: unknown) {
      const converter = this.get(name);
      return requireCapability(converter, name, "parse").call(converter, text, options);
    },

    format(name: string, data: BufferSourceLike, format: unknown) {
      const converter = this.get(name);
      return requireCapability(converter, name, "format").call(converter, data, format);
    },

    transcode(text: string, options: TranscodeOptions) {
      const bytes = this.decode(options.from, text, options.fromOptions);
      return this.encode(options.to, bytes, options.toOptions);
    },

    detect(text: string, options: DetectOptions = {}): FormatDetection[] {
      const formatNames = options.formats?.length
        ? options.formats.map((name) => String(name))
        : this.list()
            .map((converter) => converter.name)
            .filter((name) => !["binary", "utf8", "utf16be", "utf16le"].includes(keyOf(name)));
      const detections = new Map<string, FormatDetection>();

      for (const requestedName of formatNames) {
        const converter = this.get(requestedName);
        const confidence = detectConfidence(requestedName, text, converter);
        if (confidence <= 0) {
          continue;
        }
        const format = converter.name;
        const current = detections.get(format);
        if (!current || confidence > current.confidence) {
          detections.set(format, { format, confidence });
        }
      }

      return [...detections.values()].sort((left, right) => right.confidence - left.confidence);
    },
  };

  for (const converter of initialConverters) {
    api.register(converter);
  }

  return api;
}
