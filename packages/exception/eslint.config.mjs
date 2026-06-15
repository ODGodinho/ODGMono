import rules from "@odg/eslint-config";

export default [
    ...rules,
    {
        rules: {
            "unicorn/class-reference-in-static-methods": [ "off" ],
        },
    },
];
