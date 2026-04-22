import odgConfig from "@odg/eslint-config";

export default [
    ...odgConfig,
    {
        ignores: [ "tests/vitest/cache/**" ],
    },
    {
        "rules": {
            "security/detect-non-literal-fs-filename": "off",
        },
    },
    {
        files: [ "src/index.ts" ],
        rules: {
            "sonarjs/no-duplicate-string": "off",
        },
    },
];
