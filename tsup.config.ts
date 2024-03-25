import type { Options } from "tsup";

const isProduction = process.env.NODE_ENV == "production";

export default <Options>{
    entry: ["src/*.ts"],
    clean: true,
    format: ["cjs", "esm"],
    dts: true,
    outDir: "dist",
    sourcemap: isProduction ? false : "inline",

    // we're a library so we don't need to bundle
    bundle: false,
};
