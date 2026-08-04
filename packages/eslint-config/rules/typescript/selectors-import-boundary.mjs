import { getRestrictedImportsRule } from "./restricted-imports.mjs";

/**
 * ODG architecture canon (skills/odg/references/selectors.md): Selectors files MUST NOT
 * import Pages or Handlers. Selectors are pure typed locators consumed BY Pages/Handlers —
 * the dependency only ever points Selectors → nothing, never Selectors → Pages/Handlers.
 *
 * Scoped to `src/Selectors/**` only, so the same import from inside `src/Pages/**` (a
 * legitimate consumer) or any other folder stays untouched.
 *
 * Aliases confirmed against /Volumes/Projetos/Stanley-Crawler-Event package.json#imports +
 * tsconfig.json#paths: `#pages` / `#pages/*` and `#handlers` / `#handlers/*`.
 *
 * `no-restricted-imports` config is a single value per matching file — a `files`-scoped block
 * fully replaces (not merges with) the base TS block's config for files it matches, so the base
 * bans (getRestrictedImportsRule(): `paths` = inversify decorators + Handler types, `patterns` =
 * build-output reach-in) are folded back in here — both keys — to avoid silently un-banning them
 * for Selectors files. For the same reason, the "own barrel" self-import
 * ban for `#selectors` (architecture.md → `### index.ts`, see ./own-barrel-imports.mjs) is also
 * folded in here rather than living in a second block that targets the same `files` glob.
 */
const [ , baseRestrictedImports ] = getRestrictedImportsRule();

const noPagesMessage = "Selectors MUST NOT import Pages. Selectors are consumed by Pages,"
    + " never the other way around.";
const noHandlersMessage = "Selectors MUST NOT import Handlers. Selectors are consumed by Handlers,"
    + " never the other way around.";
const noOwnBarrelMessage = "A file inside src/Selectors/ MUST import its own siblings by relative"
    + " path, never through the folder's own barrel/alias (#selectors). Use a relative import"
    + " instead.";

export default {
    files: [ "src/Selectors/**/*.ts" ],
    rules: {
        "@typescript-eslint/no-restricted-imports": [
            "error",
            {
                paths: [
                    ...baseRestrictedImports.paths,
                    { name: "#pages", message: noPagesMessage },
                    { name: "#handlers", message: noHandlersMessage },
                    { name: "#selectors", message: noOwnBarrelMessage },
                ],
                patterns: [
                    ...baseRestrictedImports.patterns,
                    {
                        group: [ "*/Pages/*", "*/Pages", "**/Pages/**", "#pages/*" ],
                        message: noPagesMessage,
                    },
                    {
                        group: [ "*/Handlers/*", "*/Handlers", "**/Handlers/**", "#handlers/*" ],
                        message: noHandlersMessage,
                    },
                    {
                        group: [ "#selectors/*" ],
                        message: noOwnBarrelMessage,
                    },
                ],
            },
        ],
    },
};
