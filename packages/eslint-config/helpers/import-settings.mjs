import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { createNodeResolver } from "eslint-plugin-import-x";

import { isIdeWatchLint } from "./lint-mode.mjs";

const ideWatchCacheLifetimeSeconds = 30;

/**
 * Settings do eslint-plugin-import-x.
 *
 * O plugin é registrado como `import` (alias), então as settings usam o prefixo `import/`.
 * `resolver-next` + cache são recomendados pela doc para flat config e performance.
 *
 * @see https://github.com/un-ts/eslint-plugin-import-x#settings
 * @see https://github.com/import-js/eslint-import-resolver-typescript#eslintconfigjs
 * @returns {Record<string, unknown>} Settings do plugin import para ESLint flat config.
 */
export function createImportSettings() {
    return {
        "import-x/cache": {
            lifetime: isIdeWatchLint ? ideWatchCacheLifetimeSeconds : Infinity,
        },
        "import-x/external-module-folders": [ "node_modules", "node_modules/@types", "@types" ],
        "import-x/extensions": [ ".js", ".mjs", ".jsx", ".json", ".ts", ".tsx", ".d.ts" ],
        "import-x/core-modules": [ "bun:test", "electron" ],
        "import-x/ignore": [ "node_modules", String.raw`\.(coffee|scss|css|less|hbs|svg|json)$` ],
        "import-x/parsers": {
            "@typescript-eslint/parser": [ ".ts", ".tsx", ".mts", ".cts" ],
        },
        "import-x/resolver-next": [
            createTypeScriptImportResolver({
                alwaysTryTypes: true,
            }),
            createNodeResolver(),
        ],
    };
}
