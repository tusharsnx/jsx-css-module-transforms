import { transformSync } from "@babel/core";
import { createWebpackPlugin } from "unplugin";
import type { UnpluginOptions } from "unplugin";
import type { PluginItem } from "@babel/core";
import Plugin from "./plugin.js";
import { CSSModuleError } from "./utils.js";

export interface PluginOptions {
    sourcemap: boolean;
}

function unpluginFactory(userOpts: PluginOptions): UnpluginOptions {
    return {
        name: "jsx-css-module-transforms",
        enforce: "pre",

        transformInclude(id) {
            return /\.[jt]sx$/i.test(id);
        },

        transform(code, id) {
            let plugins: PluginItem[] = ["@babel/plugin-syntax-jsx", Plugin];

            const isTSX = /\.tsx$/i.test(id);
            if (isTSX) {
                plugins.unshift(["@babel/plugin-syntax-typescript", { isTSX: true }]);
            }

            const result = transformSync(code, {
                filename: id,
                sourceMaps: userOpts.sourcemap,
                plugins,
            });

            if (!result || !result.code) {
                throw new CSSModuleError(`Could not transform ${id}`);
            }

            return { code: result.code, map: result.map };
        },
    };
}

export default createWebpackPlugin(unpluginFactory);
