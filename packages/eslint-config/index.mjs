/* eslint-disable import/max-dependencies */
import { createRequire } from "node:module";

import adonisPlugin from "@adonisjs/eslint-plugin";
import stylistic from "@stylistic/eslint-plugin";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import anyParser from "any-eslint-parser";
import { defineConfig } from "eslint/config";
import antfu from "eslint-plugin-antfu";
import arrayFunc from "eslint-plugin-array-func";
import betterMaxParams from "eslint-plugin-better-max-params";
import fileProgress from "eslint-plugin-file-progress";
import filenames from "eslint-plugin-filenames";
import html from "eslint-plugin-html";
import importPlugin from "eslint-plugin-import";
import jsdoc from "eslint-plugin-jsdoc";
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
import { getNamingConventionRules } from "./rules/typescript/naming-convention.mjs";
import typescriptPossibleErrors from "./rules/typescript/possible-errors.mjs";
import typescriptSecurity from "./rules/typescript/security.mjs";
import typescriptTests from "./rules/typescript/tests.mjs";
import yamlBase from "./rules/yaml/base.mjs";
import yamlGithub from "./rules/yaml/github.mjs";

const require = createRequire(import.meta.url);
const isIdeWatchLint = process.argv
    .some(
        (argument) => argument === "--stdin"
            || argument.startsWith("--stdin-")
            || String(argument).includes("eslintServer.js"),
    )
    || process.env.VSCODE_CLI;

const isAutomation = !process.stdout.isTTY
    || process.env.AI_AGENT
    || process.env.CI
    || process.env.TERM === "dumb";

const odgPlugin = require("@odg/eslint-plugin");
const espree = require("espree");
const jsoncParser = require("jsonc-eslint-parser");

const hasAdonisCore = (() => {
    try {
        require.resolve("@adonisjs/core/package.json", { paths: [ process.cwd() ] });

        return true;
    } catch {
        return false;
    }
})();

let odgTsconfig;

try {
    odgTsconfig = require.resolve("@odg/tsconfig/tsconfig.json");
} catch {
    // Only ignore optional tsconfig by default
}

export default defineConfig([

    // Base configuration
    {
        ignores: [
            "!.*",
            ".adonisjs/**",
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
            "temp/",
            "**/*.min.*",
            "**/*.png",
            "package-lock.json",
            "yarn.lock",
            "bun.lock",
            "bun.lock*",
            "pnpm-lock.yaml",
            ".yalc/",
            ".review/",
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
                typescript: true,
                node: true,
            },
            "import/external-module-folders": [ "@types" ],
            "import/extensions": [ ".js", ".mjs", ".jsx" ],
            "import/core-modules": [ "bun:test", "electron" ],
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
            ...hasAdonisCore
                ? {
                    "no-undef": [ "off" ],
                }
                : {},
        },
    },

    // TSX files
    {
        files: [ "**/*.tsx" ],
        rules: {
            "import/no-anonymous-default-export": [ "off" ],
            "@typescript-eslint/naming-convention": [
                "error",
                ...getNamingConventionRules(true),
            ],
        },
    },

    ...hasAdonisCore
        ? [
            // Adonis Rules
            {
                files: [ "**/*.ts" ],
                ignores: [
                    "public/assets/**",
                    "__snapshots__/**",
                    "resources/**",
                ],
                plugins: {
                    "@adonisjs": adonisPlugin,
                },
                rules: {
                    "@adonisjs/prefer-lazy-controller-import": [ "error" ],
                    "@adonisjs/prefer-lazy-listener-import": [ "error" ],
                    "@adonisjs/prefer-adonisjs-inertia-link": [ "error" ],
                    "@adonisjs/prefer-adonisjs-inertia-form": [ "error" ],
                    "@adonisjs/no-backend-import-in-frontend": [ "error" ],
                },
            },

            // Root routes file
            {
                files: [ "start/routes.ts", "adonisrc.ts" ],
                rules: {
                    "@typescript-eslint/explicit-function-return-type": [ "off" ],
                    "func-style": [ "off" ],
                },
            },

            {
                files: [ "bin/" ],
                rules: {
                    "import/no-extraneous-dependencies": [ "off" ],
                    "import/no-dynamic-require": [ "off" ],
                },
            },
        ]
        : [],

    // Config files
    {
        plugins: {
            "json-schema-validator": jsonSchemaValidator,
        },
        rules: {
            "json-schema-validator/no-invalid": isIdeWatchLint ? "off" : "error",
        },
        settings: {
            "json-schema-validator": {
                cache: {
                    ttl: "1d",
                },
            },
        },
    },

    {
        files: [
            "**/*.config.ts",
            "**/*.config.mts",
            "**/*.config.js",
            "**/*.config.mjs",
            "**/index.mjs",
            "**/index.mts",
            "config/**.ts",
            "adonisrc.ts",
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
]);
