import typescript from "rollup-plugin-typescript";

let pkg = require("./package.json");

let banner = []

const external = Object.keys(pkg.dependencies);

export default [
  {
    input: "src/index.ts",
    plugins: [
      typescript({ typescript: require("typescript"), target: "esnext", removeComments: true }),
    ],
    external,
    output: [
      {
        banner: banner.join("\n"),
        file: pkg.main,
        format: "umd",
        globals: {
          tslib: "tslib",
        },
        name: "pvtsutils"
      }
    ]
  },
  {
    input: "src/index.ts",
    plugins: [
      typescript({ typescript: require("typescript"), target: "esnext", removeComments: true }),
    ],
    external,
    output: [
      {
        banner: banner.join("\n"),
        file: pkg.module,
        format: "es",
      }
    ]
  }
];