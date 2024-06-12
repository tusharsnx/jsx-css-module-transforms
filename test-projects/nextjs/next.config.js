import JsxCssModuleTransforms from "jsx-css-module-transforms";

/**
 * @type {import('next').NextConfig}
 */
module.exports = {
    webpack: (config) => {
        config.plugins.push(JsxCssModuleTransforms({ sourcemap: true }));
        return config;
    },
};
