import { restrictedHandlerTypeImport } from "./handler-types-boundary.mjs";

/**
 * DI discipline: raw inversify decorators must not be imported directly. The typed
 * wrappers ($inject / $multiInject / $injectOptional from ContainerInject.ts) keep
 * container bindings strongly typed. Type-only imports stay allowed. The wrappers are
 * defined in ContainerInject.ts, which is exempted where this rule is wired.
 */
const inversifyDecoratorImport = {
    name: "inversify",
    importNames: [ "inject", "multiInject", "optional" ],
    message: "Use $inject / $multiInject / $injectOptional from the project's"
        + " ContainerInject.ts, not raw inversify decorators.",
    allowTypeImports: true,
};

/**
 * `paths` entries every scope composes its final `no-restricted-imports` value from (see
 * ./own-barrel-imports.mjs and ./selectors-import-boundary.mjs for the scoped compositions).
 * skills/odg/references/handler.md line 61: HandlerFunction/HandlerSolutionType MUST only be
 * used within Handler/BaseHandler classes — banned everywhere by default, the `src/Handlers/**`
 * own-barrel block is the one place that composes its value without this entry.
 */
export const basePathBans = [ inversifyDecoratorImport, restrictedHandlerTypeImport ];

/**
 * Build the `@typescript-eslint/no-restricted-imports` rule entry. Every TypeScript file
 * forbids raw inversify decorators and importing HandlerFunction/HandlerSolutionType.
 *
 * @returns {unknown[]} Rule entry for `@typescript-eslint/no-restricted-imports`.
 */
export function getRestrictedImportsRule() {
    return [
        "error",
        {
            paths: [ ...basePathBans ],
        },
    ];
}
