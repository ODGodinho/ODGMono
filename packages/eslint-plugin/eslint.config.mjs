import odgLinter from "../eslint-config/index.mjs";

export default [
    ...odgLinter,
    {
        ignores: [ "tests/vitest/no-inconsistent-docblock/cases/*.ts" ],
    },
    {
        files: [ "src/rules/*.ts" ],
        rules: {
            "@typescript-eslint/naming-convention": "off",
        },
    },
    {
        rules: {
            "@odg/no-inconsistent-docblock": [ "error" ],
        },
    },
];
