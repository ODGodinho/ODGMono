import { pathToFileURL } from "node:url";

export const hasElectron = (() => {
    try {
        import.meta.resolve(
            "electron/package.json",
            pathToFileURL(`${process.cwd()}/`).href,
        );

        return true;
    } catch {
        return false;
    }
})();
