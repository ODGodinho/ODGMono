import { BOOLEAN_PREFIXES_PIPE } from "./boolean-prefixes.mjs";

// Verbos cuja semântica obriga retorno de valor (não void).
const NOT_VOID_PREFIX = "(get|find|fetch|read|query|search|retrieve|resolve|parse"
    + "|format|serialize|deserialize|transform|compute|calculate|derive"
    + "|to|as|from|of|clone|make|build|compose)";

const NOT_VOID_PATTERN = `^${NOT_VOID_PREFIX}[A-Z]`;

const NOT_VOID_MSG = `Functions with prefix ${NOT_VOID_PREFIX} must return a value (not void / Promise<void>).`;

// Verbos predicate (devem retornar boolean).
const BOOLEAN_PREFIX = `(${BOOLEAN_PREFIXES_PIPE})`;

const PREDICATE_PATTERN = `^${BOOLEAN_PREFIX}[A-Z]`;

const NON_BOOLEAN_PRIMITIVES = "/^TS(Void|String|Number|Undefined|Null)Keyword$/";

const PREDICATE_MSG = `Predicate functions with prefix ${BOOLEAN_PREFIX} must return boolean.`;

const PROMISE_TYPE_ANNOTATION = "[returnType.typeAnnotation.typeName.name='Promise']";

/**
 * Build all 8 selectors for a given (namePattern, returnType filter) combination.
 *
 * Covers: MethodDefinition (class method), TSMethodSignature (interface method),
 * FunctionDeclaration (named function), and VariableDeclarator + arrow/function expression.
 *
 * Each selector is generated twice: once for direct return type, once for Promise<X>.
 *
 * @param {string} namePattern Regex (string) matching identifier name.
 * @param {string} directTypeMatch Filter on `.type=...` (e.g. `='TSVoidKeyword'` or `=/regex/`).
 * @param {string} promiseTypeMatch Same but for inner Promise type argument.
 * @param {string} message Error message.
 * @returns {object[]} Restricted-syntax rule entries.
 */
function buildReturnTypeRules(namePattern, directTypeMatch, promiseTypeMatch, message) {
    const nameFilter = `[key.name=/${namePattern}/]`;
    const idFilter = `[id.name=/${namePattern}/]`;

    return [

        // Class method — return type
        {
            selector: `MethodDefinition${nameFilter}`
                + `[value.returnType.typeAnnotation.type${directTypeMatch}]`,
            message,
        },

        // Class method — Promise<X>
        {
            selector: `MethodDefinition${nameFilter}${
                PROMISE_TYPE_ANNOTATION
            }[value.returnType.typeAnnotation.typeArguments.params.0.type${promiseTypeMatch}]`,
            message,
        },

        // Interface method — return type
        {
            selector: `TSMethodSignature${nameFilter}`
                + `[returnType.typeAnnotation.type${directTypeMatch}]`,
            message,
        },

        // Interface method — Promise<X>
        {
            selector: `TSMethodSignature${nameFilter}${
                PROMISE_TYPE_ANNOTATION
            }[returnType.typeAnnotation.typeArguments.params.0.type${promiseTypeMatch}]`,
            message,
        },

        // Function declaration — return type
        {
            selector: `FunctionDeclaration${idFilter}`
                + `[returnType.typeAnnotation.type${directTypeMatch}]`,
            message,
        },

        // Function declaration — Promise<X>
        {
            selector: `FunctionDeclaration${idFilter}${
                PROMISE_TYPE_ANNOTATION
            }[returnType.typeAnnotation.typeArguments.params.0.type${promiseTypeMatch}]`,
            message,
        },

        // Arrow / FunctionExpression assigned to variable — return type
        {
            selector: `VariableDeclarator${idFilter}`
                + " > :matches(ArrowFunctionExpression, FunctionExpression)"
                + `[returnType.typeAnnotation.type${directTypeMatch}]`,
            message,
        },

        // Arrow / FunctionExpression assigned to variable — Promise<X>
        {
            selector: `VariableDeclarator${idFilter}`
                + ` > :matches(ArrowFunctionExpression, FunctionExpression)${
                    PROMISE_TYPE_ANNOTATION
                }[returnType.typeAnnotation.typeArguments.params.0.type${promiseTypeMatch}]`,
            message,
        },
    ];
}

const notVoidRules = buildReturnTypeRules(
    NOT_VOID_PATTERN,
    "='TSVoidKeyword'",
    "='TSVoidKeyword'",
    NOT_VOID_MSG,
);

const predicateRules = buildReturnTypeRules(
    PREDICATE_PATTERN,
    `=${NON_BOOLEAN_PRIMITIVES}`,
    `=${NON_BOOLEAN_PRIMITIVES}`,
    PREDICATE_MSG,
);

const restrictSyntaxBase = [
    {
        "selector": "NewExpression[callee.name='Error']",
        "message": "Do not use 'new Error()'. Use the exception classes from the @odg/exception"
            + " package to maintain logging standardization.",
    },
    {
        "selector": "CallExpression[callee.object.name='console'][callee.property.name='log']",
        "message": "Do not use console.log. Use the @odg/log injected in the container to ensure traceability.",
    },
    {
        "selector": "CallExpression[callee.property.name='forEach'][arguments.0.async=true]",
        "message": "Do not use `.forEach` with async functions. `.forEach` does not wait for Promises."
            + " Use `for...of` or`Promise.all()` instead.",
    },
    {
        "selector": "CallExpression[callee.property.name='waitForTimeout']",
        "message": "The use of 'waitForTimeout' is prohibited because it's intimidating."
            + " Use 'waitForSelector', 'waitForResponse', or 'waitForFunction' instead.",
    },
    {
        "selector": "ClassDeclaration[superClass.name=/(Error|Exception)$/]:not([id.name=/Exception$/])",
        "message": "Classes that extend Error/Exception must end with 'Exception' suffix"
            + " (e.g. NotFoundException, ValidationException, TimeoutException).",
    },
    {
        "selector": "ClassExpression[superClass.name=/(Error|Exception)$/]:not([id.name=/Exception$/])",
        "message": "Classes that extend Error/Exception must end with 'Exception' suffix.",
    },
    {
        "selector": ":matches("
            + "VariableDeclarator[id.name=/Async$/],"
            + "FunctionDeclaration[id.name=/Async$/],"
            + "FunctionExpression[id.name=/Async$/],"
            + "ClassDeclaration[id.name=/Async$/],"
            + "ClassExpression[id.name=/Async$/],"
            + "TSInterfaceDeclaration[id.name=/Async$/],"
            + "TSTypeAliasDeclaration[id.name=/Async$/],"
            + "TSEnumDeclaration[id.name=/Async$/],"
            + "TSEnumMember[id.name=/Async$/],"
            + "MethodDefinition[key.name=/Async$/],"
            + "PropertyDefinition[key.name=/Async$/],"
            + "TSPropertySignature[key.name=/Async$/],"
            + "TSMethodSignature[key.name=/Async$/],"
            + "Property[key.name=/Async$/]"
            + ")",
        "message": "Do not use 'Async' suffix in TypeScript."
            + " The Promise<T> return type already indicates async behavior — drop the suffix.",
    },
    ...notVoidRules,
    ...predicateRules,
];

export const restrictSyntaxTest = [ ...restrictSyntaxBase ];

export const restrictSyntax = [
    ...restrictSyntaxBase,
    {
        "selector": "CallExpression[callee.name='sleep']",
        "message": "Do not use 'sleep()' with timestamps. Use async/await patterns, Promise.race"
            + ", timeout function or other async timing mechanisms instead.",
    },
    {
        "selector": String.raw`CallExpression[callee.property.name=/^(click|waitForSelector|\$|\$\$|eval|type)$/][arguments.0.type='Literal'][arguments.0.value=/^[.#].*/]`,
        "message": "Do not use hardcoded selectors."
            + " Move a string to a file in the 'Selectors' folder to ensure decoupling.",
    },
];
