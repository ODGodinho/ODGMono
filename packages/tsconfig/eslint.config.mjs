import odgLinter from "@odg/eslint-config";

export default [
    ...odgLinter,
    {
        "files": [ "**/Decorators/*.ts" ],
        "rules": {
            "max-classes-per-file": [
                "error",
                { "ignoreExpressions": true, "max": 1 },
            ],
        },
    },
];
