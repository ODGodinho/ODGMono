import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

/*
 * `import.meta.resolve(specifier, parent)` looks like it lets you resolve from an arbitrary
 * `parent` URL, but Node dropped support for that second argument — resolution always happens
 * relative to the calling module itself (this file, inside packages/eslint-config/helpers/).
 * That made `hasAdonisCore` check eslint-config's own dependency tree instead of the consuming
 * project's, so it silently threw (or worse, gave a wrong answer) in every real project.
 * `createRequire` has no such restriction — anchoring it at `${cwd}/anchor.cjs` makes Node's
 * normal node_modules lookup walk up from the consuming project's own root, same as the
 * project's own `require`/`import` would.
 */
const requireFromCwd = createRequire(pathToFileURL(`${process.cwd()}/anchor.cjs`));

export const hasAdonisCore = (() => {
    try {
        requireFromCwd.resolve("@adonisjs/core/package.json");

        return true;
    } catch {
        return false;
    }
})();
