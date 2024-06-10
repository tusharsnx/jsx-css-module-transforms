import { transformAsync } from "@babel/core";
import { createWebpackPlugin } from "unplugin";
import type { UnpluginOptions } from "unplugin";
import plugin from "./plugin.js";
import { CSSModuleError } from "./utils.js";

function unpluginFactory(): UnpluginOptions {
    return {
        name: "jsx-css-module-transforms",

        transformInclude(id) {
            const result = /\.tsx?$/i.test(id);
            return result;
        },

        async transform(code, id) {
            // babel's transformSync cannot be used with ESM based plugin
            const result = await transformAsync(code, {
                filename: id,
                plugins: ["@babel/plugin-syntax-jsx", plugin],
                sourceMaps: process.env.NODE_ENV == "production" ? false : "inline",
            });

            if (!result?.code) {
                throw new CSSModuleError(`Could not transform ${id}`);
            }

            return result.code;
        },
    };
}

export default createWebpackPlugin(unpluginFactory);
