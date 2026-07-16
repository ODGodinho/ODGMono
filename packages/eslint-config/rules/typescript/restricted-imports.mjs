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
 * Pages and Handlers reach selectors only through this.$s / this.$$s. Importing the
 * Selectors barrel/file directly bypasses that contract. Type-only imports (e.g. a
 * SelectorType) stay allowed.
 */
const selectorValueImportInPageOrHandler = {
    group: [ "**/Selectors", "**/Selectors/**", "@selectors", "@selectors/**" ],
    message: "Access selectors via this.$s / this.$$s. Do not import the Selectors file"
        + " directly in a Page or Handler (type-only imports are allowed).",
    allowTypeImports: true,
};

/**
 * Build the `@typescript-eslint/no-restricted-imports` rule entry. Every TypeScript file
 * forbids raw inversify decorators; Pages and Handlers additionally forbid direct
 * Selectors imports.
 *
 * @param {boolean} withSelectorPattern If true, also forbids direct Selectors imports
 * (use only in the Pages/Handlers scope).
 * @returns {unknown[]} Rule entry for `@typescript-eslint/no-restricted-imports`.
 */
export function getRestrictedImportsRule(withSelectorPattern = false) {
    return [
        "error",
        {
            paths: [ inversifyDecoratorImport ],
            ...withSelectorPattern
                ? { patterns: [ selectorValueImportInPageOrHandler ] }
                : {},
        },
    ];
}
