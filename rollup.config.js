import typescript from "rollup-plugin-typescript";

let pkg = require("./package.json");

let banner = []

export default {
    entry: "src/index.ts",
    plugins: [
        typescript({ typescript: require("typescript"), target: "es5", removeComments: true }),
    ],
    banner: banner.join("\n"),
    external: ["tslib"],
    globals: {
        tslib: "tslib",
    },
    targets: [
        {
            dest: pkg.main,
            format: "cjs",
            moduleName: "TSTool"
        }
    ]
};