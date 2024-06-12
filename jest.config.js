/**
 * @type {import("ts-jest").JestConfigWithTsJest}
 */
let config = {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    extensionsToTreatAsEsm: [".ts"],
    verbose: true,
};

export default config;
