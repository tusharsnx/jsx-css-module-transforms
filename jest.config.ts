import type { InitialOptionsTsJest } from "ts-jest";

module.exports = <InitialOptionsTsJest>{
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    globals: {
        "ts-jest": {
            // ts-jest needs to be told to use ESM. Choosing
            // an esm preset for ts-jest doesn't imply useEsm (??).
            useESM: true,
        },
    },
};
