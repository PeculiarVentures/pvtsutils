import { BufferSource, BufferSourceConverter } from "./buffer_source_converter";

export type BufferEncoding = "utf8" | "binary" | "base64" | "base64url" | "hex" | string;

// augment global scope with names whose availability varies by environment
declare global {
  var btoa: undefined | ((data: string) => string);
  var atob: undefined | ((data: string) => string);
}

function PrepareBuffer(buffer: BufferSource) {
    if (typeof Buffer !== "undefined" && Buffer.isBuffer(buffer)) {
        return new Uint8Array(buffer);
    } else if (BufferSourceConverter.isArrayBufferView(buffer)) {
        return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    } else {
        return new Uint8Array(buffer);
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
        const buf = PrepareBuffer(buffer);
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
            default:
                throw new Error(`Unknown type of encoding '${enc}'`);
        }
    }

    public static ToBase64(buffer: BufferSource): string {
        const buf = PrepareBuffer(buffer);
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

    public static FromUtf8String(text: string): ArrayBuffer {
        const s = unescape(encodeURIComponent(text));
        const uintArray = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) {
            uintArray[i] = s.charCodeAt(i);
        }
        return uintArray.buffer;
    }

    public static ToUtf8String(buffer: BufferSource): string {
        const buf = PrepareBuffer(buffer);
        const encodedString = String.fromCharCode.apply(null, buf);
        const decodedString = decodeURIComponent(escape(encodedString));
        return decodedString;
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
        const buf = PrepareBuffer(buffer);
        let resultString = "";
        const len = buf.length;
        for (let i = 0; i < len; i++) {
            resultString = resultString + String.fromCharCode(buf[i]);
        }
        return resultString;
    }

    /**
     * Converts buffer to HEX string
     * @param  {BufferSource} buffer Incoming buffer
     * @returns string
     */
    public static ToHex(buffer: BufferSource): string {
        const buf = PrepareBuffer(buffer);
        const splitter = "";
        const res: string[] = [];
        const len = buf.length;
        for (let i = 0; i < len; i++) {
            const char = buf[i].toString(16);
            res.push(char.length === 1 ? "0" + char : char);
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
