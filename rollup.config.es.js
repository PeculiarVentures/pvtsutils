import typescript from "rollup-plugin-typescript";

let pkg = require("./package.json");

let banner = []

export default {
    input: "src/index.ts",
    plugins: [
        typescript({ typescript: require("typescript"), target: "es5", removeComments: true }),
    ],
    external: ["tslib"],
    output: [
        {
            banner: banner.join("\n"),
            file: pkg.module,
            format: "es",
            globals: {
                tslib: "tslib",
            },
        }
    ]
};