import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(pathToFileURL(`${process.cwd()}/`).href);

/*
 * True only when ESLint is running with cwd at the root of the @odg/config package itself —
 * the package that DEFINES ConfigInterface. Used to scope the ConfigInterface exception
 * (see rules/global/restrict-syntax.mjs) without leaking it to consumers of @odg/config.
 */
export const isOdgConfigPackage = (() => {
    try {
        // eslint-disable-next-line import/no-unresolved -- dynamic per-package path, resolved at runtime via cwd
        const packageJson = require("./package.json");

        return packageJson.name === "@odg/config";
    } catch {
        return false;
    }
})();
