/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
    preset: "ts-jest",
    extensionsToTreatAsEsm: [".ts"],
    globals: {
        "ts-jest": {
            tsconfig: "tsconfig.json",
            useESM: true,
        },
    },
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
}
