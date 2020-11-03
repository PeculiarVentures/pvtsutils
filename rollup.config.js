import typescript from "rollup-plugin-typescript2";

let pkg = require("./package.json");

const banner = [
  "/**",
  " * Copyright (c) 2020, Peculiar Ventures, All rights reserved.",
  " */",
  "",
].join("\n");
const input = "src/index.ts";
const external = Object.keys(pkg.dependencies);

export default [
  {
    input,
    plugins: [
      typescript({
        check: true,
        clean: true,
        tsconfigOverride: {
          compilerOptions: {
            removeComments: true,
            module: "ES2015",
          }
        }
      }),
    ],
    external,
    output: [
      {
        banner,
        file: pkg.main,
        format: "umd",
        globals: {
          tslib: "tslib",
        },
        name: "pvtsutils"
      },
      {
        banner,
        file: pkg.module,
        format: "esm",
      }
    ]
  },
];
