import rules from "./index.mjs";

export default [
    ...rules,
    {
        files: [ "**" ],
        rules: {
            "import/no-anonymous-default-export": [ "off" ],
        },
    },

    /*
     * Package-local tooling, not an ODG app: CI/IDE detection legitimately reads process.env
     * directly (there is no config.get()/ConfigName here — this package IS the lint config).
     */
    {
        files: [ "helpers/lint-mode.mjs" ],
        rules: {
            "n/no-process-env": [ "off" ],
        },
    },
];
