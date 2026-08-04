/*
 * Ban "reach-in" imports that dig into a dependency's build output — `pkg/dist/...`,
 * `@scope/pkg/lib/...` and friends — instead of going through the specifier the package
 * actually publishes.
 *
 * WHY LINT AND NOT JUST `exports`: `@odg/chemical-x` already publishes a closed `exports`
 * map (only `.` and `./container`), so Node refuses `require("@odg/chemical-x/dist/x")` with
 * ERR_PACKAGE_PATH_NOT_EXPORTED, and TypeScript under `moduleResolution: nodenext|node16|
 * bundler` refuses it with TS2307. Two holes remain, and together they are the whole reason
 * this rule exists:
 *   1. TYPE-ONLY imports are erased at emit, so they never reach Node's `exports` guard. An
 *      `import type { HandlerInterface } from "@odg/chemical-x/dist/crawler/Interfaces/
 *      HandlerInterface"` is invisible to every runtime check.
 *   2. `moduleResolution: node10` (classic) ignores `exports` entirely — verified against
 *      /Volumes/Projetos/alkhema-tam/node_modules/@odg/chemical-x@2.15.0: `nodenext` errors
 *      TS2307, `node10` resolves the deep `.d.ts` silently.
 * The two compound: a type-only reach-in in a `node10` repo passes tsc AND never runs, so
 * nothing catches it today. `no-restricted-imports` flags type imports too (no
 * `allowTypeImports` here, deliberately — the type-only form IS the vector), which makes lint
 * the only layer that closes both holes regardless of the consumer's tsconfig.
 *
 * The reach-in is almost never a deliberate choice: VS Code writes it. With
 * `preferTypeOnlyAutoImports` + `importModuleSpecifier: "non-relative"` and no
 * `autoImportFileExcludePatterns` (see .vscode/settings.json), the TS server indexes every
 * `.d.ts` it finds under `node_modules/<pkg>/dist/` and offers the deep path as an auto-import
 * — as a type-only import, i.e. exactly the form that slips past both checks above. There is no
 * API gap driving it: `src/Interfaces/index.ts` re-exports `../crawler/Interfaces`, so
 * `HandlerInterface`/`HandlerFunction`/`HandlerSolutionType` all resolve from the bare
 * `@odg/chemical-x` root today.
 *
 * WHY `regex` AND NOT `group` GLOBS: `group` uses gitignore semantics, where a single `*`
 * matches one whole path segment — including `.`, `..` and `#alias`. A glob of the form
 * `<star>/dist/...` therefore also flags `./dist/local`, `../lib/local` and
 * `#interfaces/lib/thing` (verified: all three reported). `#` cannot be negated away either —
 * the matcher treats a leading `#` as a gitignore comment, so neither `!#**` nor `!\#**`
 * suppresses it. A `lib/` folder under a project alias is common enough that those false
 * positives would sink the rule. The regex below states the intent directly: optional
 * `@scope/`, then a package name whose first character is not `@`, `.`, `#` or `/` (which is
 * what excludes relative paths and `#` subpath-import aliases), then `dist` or `lib` as a
 * whole next segment.
 *
 * Verified matches: `@odg/chemical-x/dist`, `@odg/chemical-x/dist/index.js`,
 * `@odg/chemical-x/dist/crawler/Interfaces/HandlerInterface`, `some-pkg/dist/foo`,
 * `some-pkg/lib/deep/thing`, `@scope/pkg/lib/x`.
 * Verified non-matches: `@odg/chemical-x`, `@odg/chemical-x/container`, `@odg/events`,
 * `./dist/local`, `../lib/local`, `../../lib/deep`, `#interfaces/lib/thing`, `node:fs`,
 * `rxjs/operators`, `lodash/fp`.
 */
export const restrictedBuildOutputImport = {
    regex: "^(?:@[^/]+/)?[^@.#/][^/]*/(?:dist|lib)(?:/|$)",
    message: "Do not import a package's build output (dist/, lib/). Import the package's"
        + " published specifier instead — e.g. `@odg/chemical-x` or `@odg/chemical-x/container`,"
        + " never `@odg/chemical-x/dist/...`. Deep paths are not part of the public API, break"
        + " on any internal refactor, and are already rejected by Node at runtime.",
};
