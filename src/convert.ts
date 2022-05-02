import { BufferSource, BufferSourceConverter } from "./buffer_source_converter";

export type BufferEncoding = "utf8" | "binary" | "base64" | "base64url" | "hex" | string;
export type TextEncoding = "ascii" | "utf8" | "utf16" | "utf16be" | "utf16le" | "usc2";

declare function btoa(data: string): string;
declare function atob(data: string): string;

abstract class Utf8Converter {

    public static fromString(text: string): ArrayBuffer {
        const s = unescape(encodeURIComponent(text));
        const uintArray = new Uint8Array(s.length);

        for (let i = 0; i < s.length; i++) {
            uintArray[i] = s.charCodeAt(i);
        }

        return uintArray.buffer;
    }

    public static toString(buffer: BufferSource): string {
        const buf = BufferSourceConverter.toUint8Array(buffer);
        let encodedString = "";

        for (let i = 0; i < buf.length; i++) {
            encodedString += String.fromCharCode(buf[i]);
        }
        const decodedString = decodeURIComponent(escape(encodedString));

        return decodedString;
    }
}

class Utf16Converter {

    public static toString(buffer: BufferSource, littleEndian = false): string {
        const arrayBuffer = BufferSourceConverter.toArrayBuffer(buffer);
        const dataView = new DataView(arrayBuffer);
        let res = "";

        for (let i = 0; i < arrayBuffer.byteLength; i += 2) {
            const code = dataView.getUint16(i, littleEndian);
            res += String.fromCharCode(code);
        }

        return res;
    }

    public static fromString(text: string, littleEndian = false): ArrayBuffer {
        const res = new ArrayBuffer(text.length * 2);
        const dataView = new DataView(res);

        for (let i = 0; i < text.length; i++) {
            dataView.setUint16(i * 2, text.charCodeAt(i), littleEndian);
        }

        return res;
    }

}

export class Convert {

    public static isHex(data: any): data is string {
        return typeof data === "string"
            && /^[a-z0-9]+$/i.test(data);
    }

    public static isBase64(data: any): data is string {
        return typeof data === "string"
            && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data);
    }

    public static isBase64Url(data: any): data is string {
        return typeof data === "string"
            && /^[a-zA-Z0-9-_]+$/i.test(data);
    }

    public static ToString(buffer: BufferSource, enc: BufferEncoding = "utf8") {
        const buf = BufferSourceConverter.toUint8Array(buffer);
        switch (enc.toLowerCase()) {
            case "utf8":
                return this.ToUtf8String(buf);
            case "binary":
                return this.ToBinary(buf);
            case "hex":
                return this.ToHex(buf);
            case "base64":
                return this.ToBase64(buf);
            case "base64url":
                return this.ToBase64Url(buf);
            case "utf16le":
                return Utf16Converter.toString(buf, true);
            case "utf16":
            case "utf16be":
                return Utf16Converter.toString(buf);
            default:
                throw new Error(`Unknown type of encoding '${enc}'`);
        }
    }

    public static FromString(str: string, enc: BufferEncoding = "utf8"): ArrayBuffer {
        if (!str) {
            return new ArrayBuffer(0);
        }

        switch (enc.toLowerCase()) {
            case "utf8":
                return this.FromUtf8String(str);
            case "binary":
                return this.FromBinary(str);
            case "hex":
                return this.FromHex(str);
            case "base64":
                return this.FromBase64(str);
            case "base64url":
                return this.FromBase64Url(str);
            case "utf16le":
                return Utf16Converter.fromString(str, true);
            case "utf16":
            case "utf16be":
                return Utf16Converter.fromString(str);
            default:
                throw new Error(`Unknown type of encoding '${enc}'`);
        }
    }

    public static ToBase64(buffer: BufferSource): string {
        const buf = BufferSourceConverter.toUint8Array(buffer);
        if (typeof btoa !== "undefined") {
            const binary = this.ToString(buf, "binary");
            return btoa(binary);
        } else {
            return Buffer.from(buf).toString("base64");
        }
    }

    public static FromBase64(base64: string): ArrayBuffer {
        const formatted = this.formatString(base64);
        if (!formatted) {
            return new ArrayBuffer(0);
        }

        if (!Convert.isBase64(formatted)) {
            throw new TypeError("Argument 'base64Text' is not Base64 encoded");
        }

        if (typeof atob !== "undefined") {
            return this.FromBinary(atob(formatted));
        } else {
            return new Uint8Array(Buffer.from(formatted, "base64")).buffer;
        }
    }

    public static FromBase64Url(base64url: string): ArrayBuffer {
        const formatted = this.formatString(base64url);
        if (!formatted) {
            return new ArrayBuffer(0);
        }

        if (!Convert.isBase64Url(formatted)) {
            throw new TypeError("Argument 'base64url' is not Base64Url encoded");
        }

        return this.FromBase64(this.Base64Padding(formatted.replace(/\-/g, "+").replace(/\_/g, "/")));
    }

    public static ToBase64Url(data: BufferSource): string {
        return this.ToBase64(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/\=/g, "");
    }

    protected static DEFAULT_UTF8_ENCODING: TextEncoding = "utf8";

    public static FromUtf8String(text: string, encoding: TextEncoding = Convert.DEFAULT_UTF8_ENCODING): ArrayBuffer {
        switch (encoding) {
            case "ascii":
                return this.FromBinary(text);
            case "utf8":
                return Utf8Converter.fromString(text);
            case "utf16":
            case "utf16be":
                return Utf16Converter.fromString(text);
            case "utf16le":
            case "usc2":
                return Utf16Converter.fromString(text, true);
            default:
                throw new Error(`Unknown type of encoding '${encoding}'`);
        }
    }

    public static ToUtf8String(buffer: BufferSource, encoding: TextEncoding = Convert.DEFAULT_UTF8_ENCODING): string {
        switch (encoding) {
            case "ascii":
                return this.ToBinary(buffer);
            case "utf8":
                return Utf8Converter.toString(buffer);
            case "utf16":
            case "utf16be":
                return Utf16Converter.toString(buffer);
            case "utf16le":
            case "usc2":
                return Utf16Converter.toString(buffer, true);
            default:
                throw new Error(`Unknown type of encoding '${encoding}'`);
        }
    }

    public static FromBinary(text: string): ArrayBuffer {
        const stringLength = text.length;
        const resultView = new Uint8Array(stringLength);
        for (let i = 0; i < stringLength; i++) {
            resultView[i] = text.charCodeAt(i);
        }
        return resultView.buffer;
    }

    public static ToBinary(buffer: BufferSource): string {
        const buf = BufferSourceConverter.toUint8Array(buffer);

        let res = "";
        for (let i = 0; i < buf.length; i++) {
            res += String.fromCharCode(buf[i]);
        }

        return res;
    }

    /**
     * Converts buffer to HEX string
     * @param  {BufferSource} buffer Incoming buffer
     * @returns string
     */
    public static ToHex(buffer: BufferSource): string {
        const buf = BufferSourceConverter.toUint8Array(buffer);
        const splitter = "";
        const res: string[] = [];
        const len = buf.length;
        for (let i = 0; i < len; i++) {
            const char = buf[i].toString(16).padStart(2, "0");
            res.push(char);
        }
        return res.join(splitter);
    }

    /**
     * Converts HEX string to buffer
     *
     * @static
     * @param {string} formatted
     * @returns {Uint8Array}
     *
     * @memberOf Convert
     */
    public static FromHex(hexString: string): ArrayBuffer {
        let formatted = this.formatString(hexString);
        if (!formatted) {
            return new ArrayBuffer(0);
        }

        if (!Convert.isHex(formatted)) {
            throw new TypeError("Argument 'hexString' is not HEX encoded");
        }

        if (formatted.length % 2) {
            formatted = `0${formatted}`;
        }

        const res = new Uint8Array(formatted.length / 2);
        for (let i = 0; i < formatted.length; i = i + 2) {
            const c = formatted.slice(i, i + 2);
            res[i / 2] = parseInt(c, 16);
        }
        return res.buffer;
    }

    /**
     * Converts UTF-16 encoded buffer to UTF-8 string
     * @param buffer UTF-16 encoded buffer
     * @param littleEndian Indicates whether the char code is stored in little- or big-endian format
     * @returns UTF-8 string
     */
    public static ToUtf16String(buffer: BufferSource, littleEndian = false): string {
        return Utf16Converter.toString(buffer, littleEndian);
    }

    /**
     * Converts UTF-8 string to UTF-16 encoded buffer
     * @param text UTF-8 string
     * @param littleEndian Indicates whether the char code is stored in little- or big-endian format
     * @returns UTF-16 encoded buffer
     */
    public static FromUtf16String(text: string, littleEndian = false): ArrayBuffer {
        return Utf16Converter.fromString(text, littleEndian);
    }

    protected static Base64Padding(base64: string): string {
        const padCount = 4 - (base64.length % 4);
        if (padCount < 4) {
            for (let i = 0; i < padCount; i++) {
                base64 += "=";
            }
        }
        return base64;
    }

    /**
     * Removes odd chars from string data
     * @param data String data
     */
    public static formatString(data: string) {
        return data?.replace(/[\n\r\t ]/g, "") || "";
    }

}
