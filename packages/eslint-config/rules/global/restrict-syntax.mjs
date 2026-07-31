import { BOOLEAN_PREFIXES_PIPE } from "./boolean-prefixes.mjs";

// Verbos cuja semântica obriga retorno de valor (não void).
const NOT_VOID_PREFIX = "(get|find|fetch|read|query|search|retrieve|resolve|parse"
    + "|format|serialize|deserialize|transform|compute|calculate|derive"
    + "|to|as|from|of|clone|make|build|compose)";

const NOT_VOID_PATTERN = `^${NOT_VOID_PREFIX}[A-Z]`;

const NOT_VOID_MSG = `Functions with prefix ${NOT_VOID_PREFIX} must return a value (not void / Promise<void>).`;

// Verbos predicate (devem retornar boolean).
const BOOLEAN_PREFIX = `(${BOOLEAN_PREFIXES_PIPE})`;

const PREDICATE_PATTERN = `^${BOOLEAN_PREFIX}`;

const NON_BOOLEAN_PRIMITIVES = "/^TS(Void|String|Number|Undefined|Null)Keyword$/";

const PREDICATE_MSG = `Predicate functions with prefix ${BOOLEAN_PREFIX} must return boolean.`;

const REQUIRE_PREDICATE_MSG = `Functions returning boolean must use a predicate prefix ${BOOLEAN_PREFIX}.`;

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
 * @param {string} typeMatch Filter on `.type=...` (e.g. `='TSVoidKeyword'` or `=/regex/`), applied
 * both to the direct return type and to the inner Promise<X> type argument.
 * @param {object} options Message and name-matching behavior.
 * @param {string} options.message Error message.
 * @param {boolean} [options.negateName] If true, matches identifiers that do NOT match `namePattern`
 * instead of ones that do.
 * @param {boolean} [options.includeInterfaces] If false, skips TSMethodSignature (interface method)
 * selectors — interfaces only declare a contract, they have no implementation to name-check.
 * @returns {object[]} Restricted-syntax rule entries.
 */
function buildReturnTypeRules(namePattern, typeMatch, { message, negateName = false, includeInterfaces = true }) {
    const directTypeMatch = typeMatch;
    const promiseTypeMatch = typeMatch;
    const nameOperator = negateName ? "!=" : "=";
    const nameFilter = `[key.name${nameOperator}/${namePattern}/]`;
    const idFilter = `[id.name${nameOperator}/${namePattern}/]`;

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
        ...includeInterfaces
            ? [
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
            ]
            : [],

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
    { message: NOT_VOID_MSG },
);

const predicateRules = buildReturnTypeRules(
    PREDICATE_PATTERN,
    `=${NON_BOOLEAN_PRIMITIVES}`,
    { message: PREDICATE_MSG },
);

/*
 * Inverse of predicateRules: boolean-returning functions WITHOUT a predicate prefix → erro.
 * Interfaces ficam de fora: são contratos, quem implementa é que deve seguir a convenção.
 */
const requirePredicateRules = buildReturnTypeRules(
    PREDICATE_PATTERN,
    "='TSBooleanKeyword'",
    { message: REQUIRE_PREDICATE_MSG, negateName: true, includeInterfaces: false },
);

/*
 * ---------------------------------------------------------------------------------------------
 * TABELA DE REGRAS — fonte única de verdade.
 *
 * Cada entrada é { entry: {selector, message}, contexts: [...] }. `contexts` diz em quais
 * consumidores essa regra aparece — não existe mais ternário/concat/filter espalhado pelos
 * arquivos que consomem isso; para saber se uma regra vale num contexto, olhe só a linha dela
 * aqui embaixo.
 *
 * Contextos existentes:
 *   - "default"      Arquivos TS normais (rules/global/base.mjs)
 *   - "test"         Arquivos de teste (rules/typescript/tests.mjs)
 *   - "configPackage" O próprio pacote @odg/config, fora de teste (index.mjs isOdgConfigPackage)
 *   - "pages"        src/Pages/**  (index.mjs)
 *   - "handlers"     src/Handlers/** (index.mjs)
 *
 * Sem `contexts` explícito = vale em todos (regra "sempre ligada").
 * ---------------------------------------------------------------------------------------------
 */
const ALL_CONTEXTS = [ "default", "test", "configPackage", "pages", "handlers" ];

const restrictSyntaxRules = [
    {

        /*
         * Testes legitimamente simulam erro vindo de dependência mockada
         * (`vi.fn().mockRejectedValue(new Error("boom"))`) — não é logging real, então a regra
         * do @odg/exception não se aplica lá.
         */
        contexts: [ "default", "configPackage" ],
        entry: {
            "selector": "NewExpression[callee.name='Error']",
            "message": "Do not use 'new Error()'. Use the exception classes from the @odg/exception"
                + " package to maintain logging standardization.",
        },
    },
    {
        entry: {
            "selector": "CallExpression[callee.object.name='console'][callee.property.name='log']",
            "message": "Do not use console.log. Use the @odg/log injected in the container to ensure traceability.",
        },
    },
    {
        entry: {
            "selector": "CallExpression[callee.property.name='forEach'][arguments.0.async=true]",
            "message": "Do not use `.forEach` with async functions. `.forEach` does not wait for Promises."
                + " Use `for...of` or`Promise.all()` instead.",
        },
    },
    {
        entry: {
            "selector": "CallExpression[callee.property.name='waitForTimeout']",
            "message": "The use of 'waitForTimeout' is prohibited because it's intimidating."
                + " Use 'waitForSelector', 'waitForResponse', or 'waitForFunction' instead.",
        },
    },
    {
        entry: {
            "selector": "ClassDeclaration[superClass.name=/(Error|Exception)$/]:not([id.name=/Exception$/])",
            "message": "Classes that extend Error/Exception must end with 'Exception' suffix"
                + " (e.g. NotFoundException, ValidationException, TimeoutException).",
        },
    },
    {
        entry: {
            "selector": "ClassExpression[superClass.name=/(Error|Exception)$/]:not([id.name=/Exception$/])",
            "message": "Classes that extend Error/Exception must end with 'Exception' suffix.",
        },
    },
    {
        entry: {
            "selector": "ClassDeclaration[decorators.0.expression.callee.property.name!='injectable']"
                + ":has(Decorator[expression.callee.property.name='injectable'])",
            "message": "@ODGDecorators.injectable(...) must be the first decorator on the class."
                + " Otherwise @ODGDecorators.attemptableFlow() stops working — the Handler's retry"
                + " counter never advances and the crawler retries indefinitely.",
        },
    },
    {
        entry: {
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
    },
    {
        entry: {
            "selector": "CallExpression[callee.property.name='catch']"
                + " > ArrowFunctionExpression[body.type='Literal'][body.raw='null']",
            "message": "Do not swallow errors with '.catch(() => null)'. A silent null makes a real failure"
                + " (timeout, crash) indistinguishable from an expected empty result."
                + " Log the error with context, or rethrow.",
        },
    },
    {
        entry: {
            "selector": "CallExpression[callee.property.name='catch']"
                + " > ArrowFunctionExpression[body.type='Identifier'][body.name='undefined']",
            "message": "Do not swallow errors with '.catch(() => undefined)'. Log the error with context, or rethrow.",
        },
    },
    ...notVoidRules.map((entry) => ({ entry })),
    ...predicateRules.map((entry) => ({ entry })),
    ...requirePredicateRules.map((entry) => ({ entry })),
    {

        /*
         * Isolado porque packages/config é o pacote que DEFINE ConfigInterface — consumidores de
         * @odg/config não podem redeclarar, o próprio pacote pode.
         */
        contexts: [ "default", "test" ],
        entry: {
            "selector": "TSInterfaceDeclaration[id.name='ConfigInterface'],"
                + " TSTypeAliasDeclaration[id.name='ConfigInterface']",
            "message": "ConfigInterface is already exported by @odg/config — use ConfigType or a project"
                + " alias (e.g. MyConfig) for the project-level config type.",
        },
    },
    {

        // Só faz sentido fora de teste/pacote de config: sleep() de produção, não fixture.
        contexts: [ "default" ],
        entry: {
            "selector": "CallExpression[callee.name='sleep']",
            "message": "Do not use 'sleep()' with timestamps. Use async/await patterns, Promise.race"
                + ", timeout function or other async timing mechanisms instead.",
        },
    },
    {
        contexts: [ "default" ],
        entry: {
            "selector": String.raw`CallExpression[callee.property.name=/^(click|waitForSelector|\$|\$\$|eval|type)$/][arguments.0.type='Literal'][arguments.0.value=/^[.#].*/]`,
            "message": "Do not use hardcoded selectors."
                + " Move a string to a file in the 'Selectors' folder to ensure decoupling.",
        },
    },
    {

        // Pages/Handlers representam um único passo do fluxo, não um serviço de longa duração.
        contexts: [ "pages", "handlers" ],
        entry: {
            "selector": "CallExpression[callee.property.name='injectable'][arguments.1.value='Singleton']",
            "message": "Pages and Handlers represent a single flow step, not a long-lived service."
                + " @ODGDecorators.injectable(..., \"Singleton\") makes the container reuse the same"
                + " instance across executions — state from one flow (e.g. `this.page`) leaks into"
                + " the next. Drop the \"Singleton\" argument.",
        },
    },
];

/**
 * Build the `no-restricted-syntax` entries active for a given set of consumer contexts.
 * A rule is included if it applies to ANY of the requested contexts — no duplicate entries even
 * when several requested contexts share a rule.
 *
 * @param {("default" | "test" | "configPackage" | "pages" | "handlers")[]} contexts Consumer
 * contexts — see table comment above. Example: `restrictSyntax(["default", "pages", "handlers"])`.
 * @returns {object[]} The `no-restricted-syntax` entries active for that set of contexts.
 */
export function restrictSyntax(contexts) {
    return restrictSyntaxRules
        .filter(({ contexts: ruleContexts = ALL_CONTEXTS }) => contexts.some(
            (context) => ruleContexts.includes(context),
        ))
        .map(({ entry }) => entry);
}
