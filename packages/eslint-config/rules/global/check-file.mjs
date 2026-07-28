import { hasElectron } from "../../helpers/has-electron.mjs";

/**
 * Folder and file casing from the ODG architecture canon
 * (skills/odg/references/architecture.md → Universal spine → Naming):
 *
 * - Folders holding container-managed classes are PascalCase, plural.
 * - Folders holding plain UI modules are kebab-case.
 * - Files follow their content: PascalCase for a class/enum, kebab-case for a plain
 * function module, PascalCase.tsx for a component, use-thing.ts for a hook.
 *
 * Globs are NOT anchored at the cwd and MUST NOT be prefixed with `**`. check-file matches
 * a pattern against a suffix of the path, so `src/Pages/**` already covers a workspace
 * package (`packages/robot/src/Pages/...`). Adding `**` in front makes the rule validate the
 * segments the wildcard consumed as well — verified: `**\/src/Pages/**\/` reports
 * `The folder "packages" does not match the "PASCAL_CASE" pattern`.
 *
 * Unmatched globs are no-ops, so one shared list is safe across every ODG project type —
 * a project missing a given folder simply never triggers that entry.
 *
 * Known gap: entries below with a literal folder name (e.g. `resources/{Kernel,Configs}/**`)
 * only check what's NESTED inside that name — a glob can't validate the casing of its own
 * literal segment, so renaming `Kernel` to `kernel` silently stops matching instead of erroring.
 * `electron/**` avoids this by wildcarding the segment right after the root, since every folder
 * under it shares one convention; `resources/` and `src/` mix conventions among siblings, so
 * they can't. The real backstop for that case is `tsc`: the alias pointing at the old literal
 * path fails to resolve the moment anything imports through it.
 */

const pascalCaseFolders = [
    "src/{Kernel,Configs,Interfaces,Validators,Exceptions}/**/",
    "src/app/{Enums,Services,Listeners,Providers}/**/",
    "src/{Pages,Handlers,Selectors}/**/",
    "src/Http/{Controllers,Middlewares}/**/",
    "src/{Consumers,Jobs,Schedules}/**/",
];

/*
 * Electron-only. `electron/` and the shared `app/` tier are 100% PascalCase, top segment
 * included — the wildcard starts right after the root, so renaming the folder itself (not
 * just something nested in it) is caught too.
 *
 * Gated on the electron dependency because a root `app/` folder is NOT PascalCase in every
 * runtime: AdonisJS (supported by this config via hasAdonisCore) uses `app/models`,
 * `app/controllers`, `app/middleware` in lowercase and would fail every one of them.
 */
const electronPascalCaseFolders = [
    "electron/**/",
    "app/**/",
    "resources/{Kernel,Configs}/**/",
];

const kebabCaseFolders = [
    "resources/{components,hooks,pages,contexts,features,css}/**/",
    "src/{components,hooks,features,css}/**/",
    "resources/helpers/**/",
];

const pascalCaseFilenames = [
    "src/{Kernel,Configs,Interfaces,Validators}/**/!(index).ts",
    "src/app/{Enums,Providers}/**/!(index).ts",
    "src/Http/{Controllers,Middlewares}/**/!(index).ts",
    "src/{Consumers,Jobs,Schedules}/**/!(index).ts",
];

/**
 * `check-file`'s predefined `PASCAL_CASE` value (see its own source) is really this extglob:
 * `*([A-Z]*([a-z0-9]))` — zero or more "capital letter followed by lowercase/digits" groups.
 * Any convention value that ISN'T one of the plugin's predefined keywords (PASCAL_CASE,
 * CAMEL_CASE, ...) is passed straight to `micromatch` as a glob run against the filename
 * (minus extension). Prepending this same extglob to a literal suffix therefore gets BOTH
 * checks from one pattern: `${PASCAL_CASE_GLOB}Page` matches "LoginPage" and "ExamplePage" but
 * rejects "loginpage" (not PascalCase), "Login" (missing suffix) and "LoginThing" (wrong
 * suffix) — verified with `micromatch.isMatch` directly against the plugin's own constant.
 */
const PASCAL_CASE_GLOB = "*([A-Z]*([a-z0-9]))";

/**
 * File-level suffix conventions (skills/odg/references/{pages,handler,selectors,events,
 * services}.md + architecture.md's `Exceptions/<Name>Exception.ts`): the artifact's filename
 * MUST literally end in its ring's suffix, not just be PascalCase. These previously lived in
 * `pascalCaseFilenames` above as plain `PASCAL_CASE` entries (casing only, no suffix check) —
 * replaced here 1:1 per folder so PascalCase is still implied (via `PASCAL_CASE_GLOB`) while
 * also gaining the literal suffix check. `!(index).ts` again exempts the barrel, which never
 * carries the ring's suffix.
 *
 * `check-file` requires a file to satisfy EVERY glob entry that matches its path, not just the
 * most specific one — verified: adding both `"src/Pages/**"` and `"src/Pages/Components/**"`
 * entries still fails a `*Component`-suffixed file, because the broader Pages glob ALSO matches
 * it and still demands the `*Page` suffix. `src/Pages/Components/**` (own suffix `*Component`,
 * per pages.md's "## Components" — e.g. `AcceptCookieComponent`) must therefore be carved OUT of
 * the Pages entry with a negative extglob segment (`!(Components)`), not just added alongside it.
 */
const suffixFilenames = {
    "src/Pages/!(Components)/**/!(index).ts": `${PASCAL_CASE_GLOB}Page`,
    "src/Pages/!(index).ts": `${PASCAL_CASE_GLOB}Page`,
    "src/Pages/Components/**/!(index).ts": `${PASCAL_CASE_GLOB}Component`,
    "src/Handlers/**/!(index).ts": `${PASCAL_CASE_GLOB}Handler`,
    "src/Selectors/**/!(index).ts": `${PASCAL_CASE_GLOB}Selector`,
    "src/app/Listeners/**/!(index).ts": `${PASCAL_CASE_GLOB}EventListener`,
    "src/app/Services/**/!(index).ts": `${PASCAL_CASE_GLOB}Service`,
    "src/Exceptions/**/!(index).ts": `${PASCAL_CASE_GLOB}Exception`,
};

const electronPascalCaseFilenames = [
    "electron/{Kernel,Configs,Services,Listeners,Providers}/**/!(index).ts",
    "app/{Enums,Interfaces,Validators,Exceptions}/**/!(index).ts",
    "resources/{components,pages,contexts}/**/!(index).tsx",
];

const kebabCaseFilenames = [
    "resources/hooks/**/*.{ts,tsx}",
    "resources/helpers/**/*.ts",
];

const electronKebabCaseFilenames = [ "app/Helpers/**/*.ts" ];

/**
 * Build a `{ [glob]: convention }` map from a list of globs sharing one convention.
 *
 * @param {string[]} globs Glob patterns.
 * @param {string} convention `check-file` convention name (e.g. "PASCAL_CASE").
 * @returns {Record<string, string>} Glob → convention map.
 */
function toConventionMap(globs, convention) {
    return Object.fromEntries(globs.map((glob) => [ glob, convention ]));
}

export default {
    rules: {
        "check-file/folder-naming-convention": [
            "error",
            {
                ...toConventionMap(pascalCaseFolders, "PASCAL_CASE"),
                ...hasElectron
                    ? toConventionMap(electronPascalCaseFolders, "PASCAL_CASE")
                    : {},
                ...toConventionMap(kebabCaseFolders, "KEBAB_CASE"),
            },
        ],
        "check-file/filename-naming-convention": [
            "error",
            {
                ...toConventionMap(pascalCaseFilenames, "PASCAL_CASE"),
                ...suffixFilenames,
                ...hasElectron
                    ? toConventionMap(electronPascalCaseFilenames, "PASCAL_CASE")
                    : {},
                ...toConventionMap(kebabCaseFilenames, "KEBAB_CASE"),
                ...hasElectron
                    ? toConventionMap(electronKebabCaseFilenames, "KEBAB_CASE")
                    : {},
            },
            { ignoreMiddleExtensions: true },
        ],
    },
};
