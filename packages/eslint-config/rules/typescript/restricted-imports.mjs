/**
 * DI discipline: raw inversify decorators must not be imported directly. The typed
 * wrappers ($inject / $multiInject / $injectOptional from ~/ContainerInject) keep
 * container bindings strongly typed. Type-only imports stay allowed. The wrappers are
 * defined in ContainerInject.ts, which is exempted where this rule is wired.
 */
const inversifyDecoratorImport = {
    name: "inversify",
    importNames: [ "inject", "multiInject", "optional" ],
    message: "Use $inject / $multiInject / $injectOptional from ~/ContainerInject,"
        + " not raw inversify decorators.",
    allowTypeImports: true,
};

/**
 * Build the `@typescript-eslint/no-restricted-imports` rule entry. Every TypeScript file
 * forbids raw inversify decorators; Pages and Handlers additionally forbid direct
 * Selectors imports.
 *
 * @returns {unknown[]} Rule entry for `@typescript-eslint/no-restricted-imports`.
 */
export function getRestrictedImportsRule() {
    return [
        "error",
        {
            paths: [ inversifyDecoratorImport ],
        },
    ];
}
