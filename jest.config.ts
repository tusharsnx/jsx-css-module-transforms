/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
    preset: "ts-jest",
    globals: {
        "ts-jest": {
            tsconfig: "tsconfig.json",
        },
    },
    testPathIgnorePatterns: ["/node_modules/", "dev/"],
}
