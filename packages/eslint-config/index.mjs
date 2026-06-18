/* eslint-disable import/max-dependencies */
import { createRequire } from "node:module";

import stylistic from "@stylistic/eslint-plugin";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
// eslint-disable-next-line import/no-unresolved
import typescriptParser from "@typescript-eslint/parser";
import anyParser from "any-eslint-parser";
import antfu from "eslint-plugin-antfu";
import arrayFunc from "eslint-plugin-array-func";
import betterMaxParams from "eslint-plugin-better-max-params";
import fileProgress from "eslint-plugin-file-progress";
import filenames from "eslint-plugin-filenames";
import html from "eslint-plugin-html";
import importPlugin from "eslint-plugin-import";
import jsdoc from "eslint-plugin-jsdoc";
// eslint-disable-next-line import/no-unresolved
import jsonSchemaValidator from "eslint-plugin-json-schema-validator";
import jsonc from "eslint-plugin-jsonc";
import pluginN from "eslint-plugin-n";
import noConstructorBind from "eslint-plugin-no-constructor-bind";
import phpMarkup from "eslint-plugin-php-markup";
import promise from "eslint-plugin-promise";
import regex from "eslint-plugin-regex";
import regexp from "eslint-plugin-regexp";
import security from "eslint-plugin-security";
import sonarjs from "eslint-plugin-sonarjs";
import sortClassMembers from "eslint-plugin-sort-class-members";
// eslint-disable-next-line import/no-unresolved
import * as toml from "eslint-plugin-toml";
import unicorn from "eslint-plugin-unicorn";
import yml from "eslint-plugin-yml";
import globals from "globals";
import * as tomlParser from "toml-eslint-parser";
import * as yamlParser from "yaml-eslint-parser";

import { frontmatterProcessor } from "./processors/frontmatter.mjs";
import anyBase from "./rules/any/base.mjs";
import globalBase from "./rules/global/base.mjs";
import globalErrors from "./rules/global/errors.mjs";
import globalPossibleErrors from "./rules/global/possible-errors.mjs";
import globalSecurity from "./rules/global/security.mjs";
import iniBase from "./rules/ini/base.mjs";
import javascriptBestPractices from "./rules/javascript/best-practices.mjs";
import javascriptErrors from "./rules/javascript/errors.mjs";
import javascriptJsDocumentation from "./rules/javascript/js-documentation.mjs";
import javascriptPerformance from "./rules/javascript/performance.mjs";
import jsonBase from "./rules/json/base.mjs";
import typescriptBestPractices from "./rules/typescript/best-practices.mjs";
import typescriptErrors from "./rules/typescript/errors.mjs";
import typescriptPossibleErrors from "./rules/typescript/possible-errors.mjs";
import typescriptSecurity from "./rules/typescript/security.mjs";
import typescriptTests from "./rules/typescript/tests.mjs";
import yamlBase from "./rules/yaml/base.mjs";
import yamlGithub from "./rules/yaml/github.mjs";

const require = createRequire(import.meta.url);
const isAutomation = !process.stdout.isTTY
    || process.env.CI === "true"
    || process.env.TERM === "dumb";

const odgPlugin = require("@odg/eslint-plugin");
const espree = require("espree");
// eslint-disable-next-line import/no-unresolved
const jsoncParser = require("jsonc-eslint-parser");

let odgTsconfig;

try {
    odgTsconfig = require.resolve("@odg/tsconfig/tsconfig.json");
} catch {
    // Only ignore optional tsconfig by default
}

export default [

    // Base configuration
    {
        ignores: [
            "!.*",
            ".claude",
            ".review",
            ".sonarlint",
            "out/",
            "lib/",
            "build/",
            ".turbo/",
            ".playwright-cli/",
            ".playwright-mcp/",
            ".playwright/",
            ".git/",
            ".yarn/",
            ".turbo/",
            ".npm/",
            ".nyc_output/",
            ".cache/",
            ".vite/",
            ".webpack/",
            ".next/",
            ".nuxt/",
            ".svelte-kit/",
            ".astro/",
            ".vercel/",
            ".output/",
            ".DS_Store",
            "Thumbs.db",
            "*.pem",
            "*.key",
            "*.crt",
            "*.sqlite",
            "*.db",
            "*.log",
            ".eslintcache",
            "*.tsbuildinfo",
            "playwright-report/",
            "node_modules/",
            "bower_components/",
            "jspm_packages/",
            "vendor/",
            "lib-cov/",
            "coverage/",
            "dist/",
            "tmp/",
            "**/*.min.*",
            "**/*.png",
            "package-lock.json",
            "yarn.lock",
            "bun.lock",
            "pnpm-lock.yaml",
        ],
    },

    // Global configuration
    {
        languageOptions: {
            parser: anyParser,
            globals: {
                ...globals.node,
                ...globals.browser,
            },
            parserOptions: {
                sourceType: "module",
                ecmaVersion: 2022,
            },
        },
        plugins: {
            "progress": fileProgress,
            "import": importPlugin,
            "@odg": odgPlugin,
            "@stylistic": stylistic,
            "n": pluginN,
            regexp,
            regex,
            sonarjs,
            security,
            unicorn,
        },
        settings: {
            "html/report-bad-indent": "error",
            "html/indent": "+4",
            "import/docstyle": [ "jsdoc", "tomdoc" ],
            "import/resolver": {
                node: {
                    extensions: [ ".mjs", ".js", ".jsx", ".json", ".ts", ".tsx", ".d.ts" ],
                },
            },
            "import/external-module-folders": [ "@types" ],
            "import/extensions": [ ".js", ".mjs", ".jsx" ],
            "import/core-modules": [],
            "import/ignore": [ "node_modules", String.raw`\.(coffee|scss|css|less|hbs|svg|json)$` ],
            "progress": {
                hide: false, // Use this to hide the progress message, can be useful in CI
                hideFileName: false, // Use this to hide the file name, would simply show "Linting..."
                successMessage: "Lint done...",
            },
            "node": {
                "version": ">=24.0.0",
            },
        },
        rules: {
            ...globalBase.rules,
            ...globalErrors.rules,
            ...globalPossibleErrors.rules,
            ...globalSecurity.rules,
            "progress/activate": isAutomation ? 0 : 1,
        },
    },

    // JavaScript/TypeScript files
    {
        files: [ "**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs", "**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts" ],
        languageOptions: {
            parser: espree,
            parserOptions: {
                sourceType: "module",
                ecmaVersion: 2022,
            },
        },
        plugins: {
            "import": importPlugin,
            "n": pluginN,
            "array-func": arrayFunc,
            "no-constructor-bind": noConstructorBind,
            "sort-class-members": sortClassMembers,
            "better-max-params": betterMaxParams,
            jsdoc,
            promise,
            regexp,
            filenames,
            security,
            unicorn,
            html,
            regex,
            sonarjs,
            antfu,
        },
        rules: {
            ...javascriptBestPractices.rules,
            ...javascriptErrors.rules,
            ...javascriptJsDocumentation.rules,
            ...javascriptPerformance.rules,
        },
    },

    // TypeScript files
    {
        files: [ "**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts" ],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
                warnOnUnsupportedTypeScriptVersion: false,
                ecmaVersion: 2022,
                sourceType: "module",
                project: [
                    "./tsconfig.json",
                    ...odgTsconfig ? [ odgTsconfig ] : [],
                ],
            },
            globals: {
                ...globals.node,
                ...globals.browser,
            },
        },
        plugins: {
            "@typescript-eslint": typescriptEslint,
            "import": importPlugin,
            "sort-class-members": sortClassMembers,
            jsdoc,
            promise,
            regexp,
            filenames,
        },
        settings: {
            "import/extensions": [ ".mjs", ".js", ".jsx", ".json", ".ts", ".tsx", ".d.ts" ],
            "import/external-module-folders": [ "node_modules", "node_modules/@types" ],
            "import/parsers": {
                "@typescript-eslint/parser": [ ".ts", ".tsx" ],
            },
            "import/resolver": {
                typescript: {
                    project: [ "tsconfig.json" ],
                },
                node: {
                    extensions: [ ".mjs", ".js", ".jsx", ".json", ".ts", ".tsx", ".d.ts" ],
                },
            },
        },
        rules: {
            ...typescriptBestPractices.rules,
            ...typescriptErrors.rules,
            ...typescriptSecurity.rules,
            ...typescriptPossibleErrors.rules,
        },
    },

    // TSX files
    {
        files: [ "**/*.tsx" ],
        rules: {
            "import/no-anonymous-default-export": [ "off" ],
            "@typescript-eslint/naming-convention": [
                "error",

                // Boolean com prefixo camelCase válido (isReady, hasName) → ok
                {
                    selector: [
                        "variable",
                        "parameter",
                        "parameterProperty",
                        "classProperty",
                        "classicAccessor",
                    ],
                    types: [ "boolean" ],
                    filter: { regex: "^(is|has|can|should|will|did|does|are|do)[A-Z]", match: true },
                    format: [ "strictCamelCase", "camelCase" ],
                },

                // Boolean com prefixo UPPER_CASE válido (IS_READY, HAS_NAME) → ok para constantes
                {
                    selector: [
                        "variable",
                        "parameter",
                        "parameterProperty",
                        "classProperty",
                        "classicAccessor",
                    ],
                    types: [ "boolean" ],
                    filter: { regex: "^(IS|HAS|CAN|SHOULD|WILL|DID|DOES|ARE|DO)_", match: true },
                    format: [ "UPPER_CASE" ],
                },

                // Identificador com prefixo camelCase boolean (is/has/...) mas que NÃO é boolean → erro
                {
                    selector: [
                        "variable",
                        "parameter",
                        "parameterProperty",
                        "classProperty",
                        "classicAccessor",
                    ],
                    filter: { regex: "^(is|has|can|should|will|did|does|are|do)[A-Z]", match: true },
                    format: null,
                    custom: {

                        // Regex auto-explicativa: aparece literal na mensagem de erro do ESLint
                        regex: "Type Must Be Boolean To Use is|has|can|should|will|did|does|are|do Prefix",
                        match: true,
                    },
                },

                // Identificador com prefixo UPPER_CASE boolean (IS_/HAS_/...) mas que NÃO é boolean → erro
                {
                    selector: [
                        "variable",
                        "parameter",
                        "parameterProperty",
                        "classProperty",
                        "classicAccessor",
                    ],
                    filter: { regex: "^(IS|HAS|CAN|SHOULD|WILL|DID|DOES|ARE|DO)_", match: true },
                    format: null,
                    custom: {
                        regex: "Type Must Be Boolean To Use IS_|HAS_|CAN_|SHOULD_|WILL_|DID_|DOES_|ARE_|DO_ Prefix",
                        match: true,
                    },
                },

                // Boolean sem prefixo boolean válido → erro (aceita camelCase E UPPER_CASE)
                {
                    selector: [
                        "variable",
                        "parameter",
                        "parameterProperty",
                        "classProperty",
                        "classicAccessor",
                    ],
                    types: [ "boolean" ],
                    filter: { regex: ".+", match: true },
                    format: [ "strictCamelCase", "camelCase", "UPPER_CASE" ],
                    prefix: [
                        "is",
                        "has",
                        "can",
                        "should",
                        "will",
                        "did",
                        "does",
                        "are",
                        "do",
                        "IS_",
                        "HAS_",
                        "CAN_",
                        "SHOULD_",
                        "WILL_",
                        "DID_",
                        "DOES_",
                        "ARE_",
                        "DO_",
                    ],
                },
                {
                    selector: [ "function" ],
                    format: [ "PascalCase", "camelCase" ],
                    leadingUnderscore: "allowSingleOrDouble",
                    trailingUnderscore: "allow",
                    filter: {
                        regex: "[- ]",
                        match: false,
                    },
                },
                {
                    selector: "classProperty",
                    format: [ "strictCamelCase", "camelCase", "UPPER_CASE" ],
                },
                {
                    selector: "typeLike",
                    format: [ "PascalCase", "camelCase" ],
                },
                {
                    selector: "interface",
                    format: [ "PascalCase" ],
                },
                {
                    selector: "typeParameter",
                    filter: /^T$|^[A-Z][A-Za-z]+$/.source,
                    format: [ "StrictPascalCase" ],
                },
                {
                    selector: [ "classProperty", "objectLiteralProperty" ],
                    format: null,
                    modifiers: [ "requiresQuotes" ],
                },

                // Regra genérica (catch-all) — fica por último para não capturar antes das específicas
                {
                    selector: [
                        "variable",
                        "function",
                        "parameterProperty",
                        "classMethod",
                        "objectLiteralMethod",
                        "typeMethod",
                        "accessor",
                    ],
                    format: [ "strictCamelCase", "camelCase" ],
                    leadingUnderscore: "allowSingleOrDouble",
                    trailingUnderscore: "allow",
                    filter: {
                        regex: "[- ]",
                        match: false,
                    },
                },
            ],
        },
    },

    // Config files
    {
        files: [ "./.*", "./*.*", ".github/**", ".vscode/**" ],
        plugins: {
            "json-schema-validator": jsonSchemaValidator,
        },
        rules: jsonSchemaValidator.configs?.recommended?.rules || {},
    },
    {
        files: [
            "**/*.config.ts",
            "**/*.config.mts",
            "**/*.config.js",
            "**/*.config.mjs",
            "**/index.mjs",
            "**/index.mts",
        ],
        rules: {
            "import/no-anonymous-default-export": [ "off" ],
            "filenames/match-exported": [ "off" ],
            "import/no-extraneous-dependencies": [ "off" ],
        },
    },

    // JSON files
    {
        files: [ "*.json", "**/*.json", "*.json5", "**/*.json5", "*.jsonc", "**/*.jsonc", ".eslintrc", "**/*.code-*" ],
        languageOptions: {
            parser: jsoncParser,
        },
        plugins: {
            jsonc,
        },
        rules: {
            ...jsonc.configs?.all?.rules,
            ...jsonBase.rules,
        },
    },
    {
        files: [ "package.json" ],
        languageOptions: {
            parser: jsoncParser,
        },
        plugins: {
            jsonc,
        },
        rules: {
            ...jsonc.configs.all.rules,
            ...jsonBase.rules,
            "jsonc/sort-keys": [ "off" ],
        },
    },

    // PHP files
    {
        files: [ "**.php" ],
        plugins: {
            "php-markup": phpMarkup,
        },
        languageOptions: {
            globals: {
                lintPHPCode: true,
            },
        },
        settings: {
            "php/php-extensions": [ ".php" ],
            "php/markup-replacement": {
                "php": "0",
                "=": "0",
            },
            "php/keep-eol": true,
            "php/remove-whitespace": false,
            "php/remove-empty-line": false,
            "php/remove-php-lint": false,
        },
    },

    // Test files
    {
        files: [
            "**/test/**",
            "**/tests/**",
            "**/spec/**",
            "**/__tests__/**",
            "**/*.test.*",
            "**/*.spec.*",
            "**/*.e2e.*",
            "**/*.e2e-spec.*",
        ],
        languageOptions: {
            globals: {
                ...globals.vitest,
            },
        },
        rules: {
            ...typescriptTests.rules,
        },
    },

    // INI/TOML files
    {
        files: [ ".env.example", ".env.*", "*.env", ".env.sample", "**/*.properties", "**/*.ini", "**/*.toml" ],
        languageOptions: {
            parser: tomlParser,
        },
        plugins: {
            toml,
        },
        rules: {
            ...iniBase.rules,
        },
    },

    // YAML files
    {
        files: [ "**/*.yml", "**/*.yaml" ],
        languageOptions: {
            parser: yamlParser,
            parserOptions: {
                defaultYAMLVersion: "1.2",
            },
        },
        plugins: {
            yml,
        },
        rules: {
            ...yamlBase.rules,
        },
    },
    {
        files: [ ".github/**/*.yml", ".github/**/*.yaml" ],
        languageOptions: {
            parser: yamlParser,
            parserOptions: {
                defaultYAMLVersion: "1.2",
            },
        },
        plugins: {
            yml,
        },
        rules: {
            ...yamlGithub.rules,
        },
    },

    // Any files
    {
        files: [
            ".gitignore",
            ".editorconfig",
            ".npmignore",
            "**/*ignore",
            "**/*.bash",
            "**/*.sh",
            "**/*.ps1",
            "**/*.powershell",
            "**/*.java",
            "**/*.tf",
            "Jenkinsfile",
            "Dockerfile",
        ],
        languageOptions: {
            parser: anyParser,
        },
        rules: {
            ...anyBase.rules,
        },
    },

    {
        files: [ "**/*.md", "**/*.mdx" ],
        processor: frontmatterProcessor,
        rules: {
            "@stylistic/max-len": [ "off" ],
        },
    },

    {
        files: [
            "**/*.md/*.yaml",
            "**/*.md/*.yml",
            "**/*.mdx/*.yaml",
            "**/*.mdx/*.yml",
        ],
        rules: {
            "@stylistic/max-len": "off",
            "@stylistic/eol-last": [ "error", "never" ],
        },
    },

    {
        files: [
            "**/SKILL.md/*.yaml",
            "**/SKILL.md/*.yml",
            "**/SKILL.mdx/*.yaml",
            "**/SKILL.mdx/*.yml",
        ],
        rules: {
            "yml/sort-keys": "off",
        },
    },
];
