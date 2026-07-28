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
    "src/{Kernel,Configs,Interfaces,Validators,Exceptions,Pages,Handlers,Selectors}/**/!(index).ts",
    "src/app/{Enums,Services,Listeners,Providers}/**/!(index).ts",
    "src/Http/{Controllers,Middlewares}/**/!(index).ts",
    "src/{Consumers,Jobs,Schedules}/**/!(index).ts",
];

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
