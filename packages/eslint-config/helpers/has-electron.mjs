import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

/*
 * See helpers/has-adonis-core.mjs for why this can't use `import.meta.resolve(specifier,
 * parent)` — Node ignores the `parent` argument, so resolution always happened relative to this
 * file (inside packages/eslint-config/helpers/) instead of the consuming project's cwd.
 */
const requireFromCwd = createRequire(pathToFileURL(`${process.cwd()}/anchor.cjs`));

export const hasElectron = (() => {
    try {
        requireFromCwd.resolve("electron/package.json");

        return true;
    } catch {
        return false;
    }
})();
