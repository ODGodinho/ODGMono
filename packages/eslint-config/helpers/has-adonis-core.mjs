import { pathToFileURL } from "node:url";

export const hasAdonisCore = (() => {
    try {
        import.meta.resolve(
            "@adonisjs/core/package.json",
            pathToFileURL(`${process.cwd()}/`).href,
        );

        return true;
    } catch {
        return false;
    }
})();
