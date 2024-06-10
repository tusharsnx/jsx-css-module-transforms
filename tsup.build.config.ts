import { defineConfig } from "tsup";

export default defineConfig({
    clean: true,
    dts: true,

    // Bundle optimizations
    treeshake: false, // When true, generates broken commonjs code
    splitting: false,
    minify: false,

    // Transforms esm's `import.meta.url` to its cjs alternative and cjs's `__dirname` to its esm alternative
    shims: true,

    // Prod build options
    entry: ["src/index.ts"],
    outDir: "dist",
    format: ["cjs", "esm"],
    cjsInterop: true,
    sourcemap: false,
    bundle: true,
});
