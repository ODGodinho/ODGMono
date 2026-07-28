/**
 * ODG architecture canon (skills/odg/references/handler.md line 61): "The types
 * `HandlerFunction` and `HandlerSolution` MUST only be used within Handler classes or
 * BaseHandler classes. These types MUST NOT be exported in other files."
 *
 * The skill prose says "HandlerSolution", but the real exported symbol — confirmed by
 * grepping /Volumes/Projetos/Stanley-Crawler-Event/node_modules/@odg/chemical-x/dist/crawler
 * /Interfaces/HandlerInterface.d.ts and packages/chemicalx/dist/index.d.ts in this monorepo —
 * is `HandlerSolutionType`. Both `HandlerFunction` and `HandlerSolutionType` are exported
 * from the `@odg/chemical-x` package root.
 *
 * DESIGN NOTE (diverges from the literal "broad ban block + off-exception block" suggestion):
 * `no-restricted-imports` config is a single value per matching file in flat config — a
 * `files`-scoped block fully REPLACES, never merges with, an earlier block's value of the
 * same rule for files both blocks match. A standalone `files: ["**"/"*.ts"]` ban block plus a
 * `files: ["src/Handlers/**"]` "off" exception (the `ContainerInject.ts` precedent) would
 * silently erase the DI-discipline inversify ban (getRestrictedImportsRule()) for every single
 * TypeScript file the moment it's placed after the base TS block — not just for Handlers.
 * Instead, this restriction is exported as plain *data* (`restrictedHandlerTypeImport`) and
 * folded into the one composed `no-restricted-imports` value each scope actually ends up
 * with: the base rule (./restricted-imports.mjs) includes it for every file by default; the
 * `src/Handlers/**` own-barrel block (./own-barrel-imports.mjs) is the one place that composes
 * its final value WITHOUT this entry, which is the real, order-independent way to grant the
 * exception without clobbering the other bans Handlers files still need (inversify, own-alias).
 */
export const restrictedHandlerTypeImport = {
    name: "@odg/chemical-x",
    importNames: [ "HandlerFunction", "HandlerSolutionType" ],
    message: "HandlerFunction/HandlerSolutionType MUST only be used within Handler or"
        + " BaseHandler classes (src/Handlers/**). Move this logic into a Handler.",
};
