import {
    BOOLEAN_PREFIXES,
    BOOLEAN_PREFIXES_PIPE,
    BOOLEAN_PREFIXES_UPPER,
    BOOLEAN_PREFIXES_UPPER_PIPE,
    BOOLEAN_PREFIXES_UPPER_PIPE_NO_UNDERSCORE,
} from "../global/boolean-prefixes.mjs";

const BOOLEAN_SELECTORS = [
    "variable",
    "parameter",
    "parameterProperty",
    "classProperty",
    "classicAccessor",
];

/**
 * Build the `@typescript-eslint/naming-convention` rule options shared between
 * `.ts` and `.tsx` files. The only structural difference is the `function` rule
 * (allowing `PascalCase` for JSX components), gated by the `isTest` flag.
 *
 * @param {boolean} isTsxFile If true, adds a rule allowing functions to be PascalCase for tsx files
 * @returns {object[]} Naming-convention rule options (array — spread or use directly).
 */
export function getNamingConventionRules(isTsxFile = false) {
    return [

        // Boolean com prefixo camelCase válido (isReady, hasName) → ok
        {
            selector: BOOLEAN_SELECTORS,
            types: [ "boolean" ],
            filter: { regex: `^(${BOOLEAN_PREFIXES_PIPE})[A-Z]`, match: true },
            format: [ "strictCamelCase", "camelCase" ],
        },

        // Boolean com prefixo UPPER_CASE válido (IS_READY, HAS_NAME) → ok para constantes
        {
            selector: BOOLEAN_SELECTORS,
            types: [ "boolean" ],
            filter: { regex: `^(${BOOLEAN_PREFIXES_UPPER_PIPE_NO_UNDERSCORE})_`, match: true },
            format: [ "UPPER_CASE" ],
        },

        // Identificador com prefixo camelCase boolean (is/has/...) mas que NÃO é boolean → erro
        {
            selector: BOOLEAN_SELECTORS,
            filter: { regex: `^(${BOOLEAN_PREFIXES_PIPE})[A-Z]`, match: true },
            format: null,
            custom: {

                // Regex auto-explicativa: aparece literal na mensagem de erro do ESLint
                regex: `Type Must Be Boolean To Use ${BOOLEAN_PREFIXES_PIPE} Prefix`,
                match: true,
            },
        },

        // Identificador com prefixo UPPER_CASE boolean (IS_/HAS_/...) mas que NÃO é boolean → erro
        {
            selector: BOOLEAN_SELECTORS,
            filter: { regex: `^(${BOOLEAN_PREFIXES_UPPER_PIPE_NO_UNDERSCORE})_`, match: true },
            format: null,
            custom: {
                regex: `Type Must Be Boolean To Use ${BOOLEAN_PREFIXES_UPPER_PIPE} Prefix`,
                match: true,
            },
        },

        // Boolean sem prefixo boolean válido → erro (aceita camelCase E UPPER_CASE)
        {
            selector: BOOLEAN_SELECTORS,
            types: [ "boolean" ],
            filter: { regex: ".+", match: true },
            format: [ "strictCamelCase", "camelCase", "UPPER_CASE" ],
            prefix: [ ...BOOLEAN_PREFIXES, ...BOOLEAN_PREFIXES_UPPER ],
        },

        // Funções: PascalCase aceitas apenas em arquivos JSX/TSX (components React)
        ...isTsxFile
            ? [
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
            ]
            : [],

        {
            selector: "classProperty",
            format: [
                "strictCamelCase",
                "camelCase",
                "UPPER_CASE",
            ],
        },
        {
            selector: "typeLike",
            format: [ "PascalCase", "camelCase" ],
        },

        // Classes terminando em "Error" → use sufixo "Exception" no lugar
        {
            selector: "class",
            filter: { regex: "Error$", match: true },
            format: null,
            custom: {
                regex: "Class Must End With Exception Suffix Not Error",
                match: true,
            },
        },
        {

            selector: "interface",
            format: [ "PascalCase" ],
        },
        {

            // Type parameter name should either be `T` or a descriptive name.
            selector: "typeParameter",
            filter: /^T$|^[A-Z][A-Za-z]+$/.source,
            format: [ "StrictPascalCase" ],
        },

        // Allow these in non-camel-case when quoted.
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
            format: [
                "strictCamelCase",
                "camelCase",
            ],

            // We allow double underscore because of GraphQL type names and some React names.
            leadingUnderscore: "allowSingleOrDouble",
            trailingUnderscore: "allow",

            // Ignore `{'Retry-After': retryAfter}` type properties.
            filter: {
                regex: "[- ]",
                match: false,
            },
        },
    ];
}
