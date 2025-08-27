import { type Options, defineConfig } from "tsup";
import { fixImportsPlugin } from "esbuild-fix-imports-plugin";

const commonOptions = {
  entry: [
    "src/**/*",
    "!src/**/*.test.*",
    "!src/**/*.spec.*",
    "!src/**/__tests__/**",
  ],
  target: "esnext",
  dts: false,
  external: ["fs", "path"],
  clean: true,
  sourcemap: true,
  bundle: false,
  minify: false,
  tsConfig: "./tsconfig.json",
  esbuildPlugins: [fixImportsPlugin()],
};

const option: Options[] = [
  {
    ...commonOptions,
    format: ["cjs"],
    outDir: "dist/cjs",
    outExtension: () => ({
      js: ".cjs",
      dts: ".d.ts",
    }),
    loader: {
      ".md": "copy",
      ".mdx": "copy",
      ".json": "copy",
    },
  },
  {
    ...commonOptions,
    format: ["esm"],
    outDir: "dist/esm",
    outExtension: () => ({
      js: ".mjs",
      dts: ".d.ts",
    }),
    loader: {
      ".md": "copy",
      ".mdx": "copy",
      ".json": "copy",
    },
  },
];

export default defineConfig(option);
