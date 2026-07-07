import odgLinter from "@odg/eslint-config";

export default [
    ...odgLinter,
    {
        rules: {
            "unicorn/class-reference-in-static-methods": [ "off" ],
        },
    },
];
