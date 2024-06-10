import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/**/*.ts"],
    outDir: "dev",
    format: "esm",
    dts: true,
    clean: true,
    sourcemap: true,

    // Bundle optimizations
    treeshake: false, // Generates broken commonjs code
    splitting: false,
    minify: false,

    // Disable bundling for Dev/Tests
    bundle: false,

    // Transforms esm's `import.meta.url` to its cjs alternative and cjs's `__dirname` to its esm alternative
    shims: true,
});
