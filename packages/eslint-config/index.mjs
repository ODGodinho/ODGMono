import { createRequire } from "node:module";

import adonisPlugin from "@adonisjs/eslint-plugin";
import css from "@eslint/css";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import odgPlugin from "@odg/eslint-plugin";
import stylistic from "@stylistic/eslint-plugin";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import anyParser from "any-eslint-parser";
import { defineConfig } from "eslint/config";
import antfu from "eslint-plugin-antfu";
import arrayFunc from "eslint-plugin-array-func";
import betterMaxParams from "eslint-plugin-better-max-params";
import checkFile from "eslint-plugin-check-file";
import fileProgress from "eslint-plugin-file-progress";
import filenames from "eslint-plugin-filenames";
import html from "eslint-plugin-html";
import importPlugin from "eslint-plugin-import-x";
import jsdoc from "eslint-plugin-jsdoc";
import jsonSchemaValidator from "eslint-plugin-json-schema-validator";
import jsonc from "eslint-plugin-jsonc";
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginN from "eslint-plugin-n";
import noConstructorBind from "eslint-plugin-no-constructor-bind";
import phpMarkup from "eslint-plugin-php-markup";
import promise from "eslint-plugin-promise";
import regexp from "eslint-plugin-regexp";
import security from "eslint-plugin-security";
import sonarjs from "eslint-plugin-sonarjs";
import sortClassMembers from "eslint-plugin-sort-class-members";
import * as toml from "eslint-plugin-toml";
import unicorn from "eslint-plugin-unicorn";
import yml from "eslint-plugin-yml";
import eslintPluginZod from "eslint-plugin-zod";
import globals from "globals";
import * as tomlParser from "toml-eslint-parser";
import * as yamlParser from "yaml-eslint-parser";

import { hasAdonisCore } from "./helpers/has-adonis-core.mjs";
import { createImportSettings } from "./helpers/import-settings.mjs";
import { isOdgConfigPackage } from "./helpers/is-odg-config-package.mjs";
import {
    isFastMode,
    isIdeWatchLint,
} from "./helpers/lint-mode.mjs";
import { frontmatterProcessor } from "./processors/frontmatter.mjs";
import anyBase from "./rules/any/base.mjs";
import cssGlobal from "./rules/css/global.mjs";
import globalBase from "./rules/global/base.mjs";
import globalCheckFile from "./rules/global/check-file.mjs";
import globalErrors from "./rules/global/errors.mjs";
import globalEslintComments from "./rules/global/eslint-comments.mjs";
import globalPossibleErrors from "./rules/global/possible-errors.mjs";
import { restrictSyntax, restrictSyntaxBaseWithoutConfigInterfaceRule } from "./rules/global/restrict-syntax.mjs";
import globalSecurity from "./rules/global/security.mjs";
import iniBase from "./rules/ini/base.mjs";
import javascriptBestPractices from "./rules/javascript/best-practices.mjs";
import javascriptErrors from "./rules/javascript/errors.mjs";
import javascriptJsDocumentation from "./rules/javascript/js-documentation.mjs";
import javascriptJSX from "./rules/javascript/jsx.mjs";
import javascriptPerformance from "./rules/javascript/performance.mjs";
import jsonBase from "./rules/json/base.mjs";
import typescriptArchitectureBoundaries from "./rules/typescript/architecture-boundaries.mjs";
import typescriptBestPractices from "./rules/typescript/best-practices.mjs";
import typescriptEnumConventions from "./rules/typescript/enum-conventions.mjs";
import typescriptErrors from "./rules/typescript/errors.mjs";
import { getNamingConventionRules } from "./rules/typescript/naming-convention.mjs";
import { getOwnBarrelImportBlocks } from "./rules/typescript/own-barrel-imports.mjs";
import typescriptPossibleErrors from "./rules/typescript/possible-errors.mjs";
import typescriptSecurity from "./rules/typescript/security.mjs";
import selectorsImportBoundary from "./rules/typescript/selectors-import-boundary.mjs";
import typescriptTests from "./rules/typescript/tests.mjs";
import yamlBase from "./rules/yaml/base.mjs";
import yamlGithub from "./rules/yaml/github.mjs";

const require = createRequire(import.meta.url);

const espree = require("espree");
const jsoncParser = require("jsonc-eslint-parser");

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
            },
        },
        plugins: {
            "progress": fileProgress,
            "import": importPlugin,
            "@odg": odgPlugin,
            "zod": eslintPluginZod,
            "@stylistic": stylistic,
            "n": pluginN,
            regexp,
            sonarjs,
            security,
            unicorn,
        },
        settings: {
            "html/report-bad-indent": "error",
            "html/indent": "+4",
            ...createImportSettings(),
            "jsx-a11y": {
                "polymorphicPropName": "as",
                "attributes": {
                    "for": [ "htmlFor", "for" ],
                },
            },
            "progress": {
                hide: isFastMode, // Use this to hide the progress message, can be useful in CI
                hideFileName: isFastMode, // Use this to hide the file name, would simply show "Linting..."
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
            "progress/activate": isFastMode ? 0 : 1,
        },
    },

    // JavaScript/TypeScript files
    {
        files: [ "**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mts,mtsx,cts}" ],
        languageOptions: {
            parser: espree,
            parserOptions: {
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            "import": importPlugin,
            "n": pluginN,
            "array-func": arrayFunc,
            "no-constructor-bind": noConstructorBind,
            "sort-class-members": sortClassMembers,
            "better-max-params": betterMaxParams,
            "jsx-a11y": eslintPluginJsxA11y,
            "zod": eslintPluginZod,
            "eslint-comments": eslintComments,
            jsdoc,
            promise,
            regexp,
            filenames,
            security,
            unicorn,
            html,
            sonarjs,
            antfu,
        },
        rules: {
            ...javascriptBestPractices.rules,
            ...javascriptErrors.rules,
            ...javascriptJsDocumentation.rules,
            ...javascriptPerformance.rules,
            ...javascriptJSX.rules,
            ...globalEslintComments.rules,
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
        rules: {
            ...typescriptBestPractices.rules,
            ...typescriptErrors.rules,
            ...typescriptSecurity.rules,
            ...typescriptPossibleErrors.rules,
            ...typescriptArchitectureBoundaries.rules,
            ...typescriptEnumConventions.rules,
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

    // ContainerInject.ts defines the typed wrappers from raw inversify — exempt it
    {
        files: [ "**/ContainerInject.ts" ],
        rules: {
            "@typescript-eslint/no-restricted-imports": [ "off" ],
        },
    },

    /*
     * @odg/config is the package that DEFINES ConfigInterface — the global ConfigInterface
     * selector below exists to stop *consumers* of @odg/config from redeclaring it, not to stop
     * @odg/config itself. Rebuild no-restricted-syntax with the same selector list minus that one
     * entry, instead of disabling the whole rule (which would also unban `new Error()`,
     * `console.log`, the `Async` suffix, etc. for this package).
     */
    ...isOdgConfigPackage
        ? [
            {
                files: [ "**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts" ],
                rules: {
                    "no-restricted-syntax": [ "error", ...restrictSyntaxBaseWithoutConfigInterfaceRule ],
                },
            },
        ]
        : [],

    /* Selectors MUST NOT import Pages/Handlers (skills/odg/references/selectors.md) */
    selectorsImportBoundary,

    /*
     * A file MUST import its own siblings by relative path, never its folder's own barrel/alias
     * (skills/odg/references/architecture.md → `### index.ts`)
     */
    ...getOwnBarrelImportBlocks(),

    {
        files: [ "src/Configs/**/*.ts", "src/app/Configs/**/*.ts", "src/app/Container.ts" ],
        rules: {
            "n/no-process-env": [ "off" ],
        },
    },

    {
        files: [ "src/Pages/**/*.ts", "src/Handlers/**/*.ts" ],
        rules: {
            "no-restricted-syntax": [
                "error",
                ...restrictSyntax,
                {
                    "selector": "CallExpression[callee.property.name='injectable'][arguments.1.value='Singleton']",
                    "message": "Pages and Handlers represent a single flow step, not a long-lived service."
                        + " @ODGDecorators.injectable(..., \"Singleton\") makes the container reuse the same"
                        + " instance across executions — state from one flow (e.g. `this.page`) leaks into"
                        + " the next. Drop the \"Singleton\" argument.",
                },
            ],
        },
    },

    // Check-file: folder & filename casing (ODG architecture canon)
    {
        files: [ "**/*" ],
        plugins: {
            "check-file": checkFile,
        },
        rules: {
            ...globalCheckFile.rules,
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
            "json-schema-validator/no-invalid": [ isIdeWatchLint ? "off" : "error" ],
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
            "n/no-process-env": [ "off" ],
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

    {
        files: [ "tests/helpers/*.ts" ],
        rules: {
            "no-empty-pattern": [ "off" ],
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
        files: [ "**/*.css" ],
        language: "css/css",
        plugins: { css },
        rules: {
            ...cssGlobal.rules,
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
