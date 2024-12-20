import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import typescript from "rollup-plugin-typescript2";
import dts from "rollup-plugin-dts";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LICENSE = fs.readFileSync("LICENSE", { encoding: "utf-8" });
const pkg = JSON.parse(fs.readFileSync("package.json", { encoding: "utf-8" }));
const banner = [
  "/*!",
  ...LICENSE.split("\n").map(o => ` * ${o}`),
  " */",
  "",
].join("\n");
const input = "src/index.ts";
const external = Object.keys(pkg.dependencies || {});

export default [
  {
    input,
    plugins: [
      typescript({
        check: true,
        clean: true,
        tsconfigOverride: {
          compilerOptions: {
            module: "ES2015",
            removeComments: true,
          },
          exclude: ["test/**/*.ts"],
        }
      }),
    ],
    external: [...external],
    output: [
      {
        banner,
        file: pkg.main,
        format: "cjs",
      },
      {
        banner,
        file: pkg.module,
        format: "es",
      },
    ],
  },
  {
    input,
    external: [...external],
    plugins: [
      dts({
        tsconfig: path.resolve(__dirname, "./tsconfig.json")
      })
    ],
    output: [
      {
        banner,
        file: pkg.types,
      }
    ]
  },
];