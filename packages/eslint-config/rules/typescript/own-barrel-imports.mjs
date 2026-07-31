import { buildPathBans } from "./restricted-imports.mjs";

/**
 * ODG architecture canon (skills/odg/references/architecture.md → `### index.ts`): "A file
 * MUST import its own siblings by relative path, never through the folder's own barrel or
 * alias." `SearchPage.ts` imports `BasePage` as `../BasePage`, not as `#pages`. Importing the
 * barrel from inside its own folder turns the re-export into a needless self-referential hop
 * and risks a load-order cycle the moment the barrel re-exports the importing file itself.
 * This is a runtime/value-import concern only, so each ban below sets `allowTypeImports: true`:
 * `import type` specifiers are erased entirely at emit (enforced monorepo-wide by
 * `@typescript-eslint/consistent-type-imports`), leaving no edge in the compiled module graph
 * and therefore no cycle to guard against.
 *
 * Folder ↔ alias pairs below are the "Universal spine" folders from architecture.md that ship
 * both a barrel (`index.ts`) and a matching alias. Confirmed against
 * /Volumes/Projetos/Stanley-Crawler-Event package.json#imports + tsconfig.json#paths:
 * `#pages`, `#handlers`, `#selectors`, `#services`, `#listeners`, `#providers`, `#validator`,
 * `#interfaces`. `Configs` (`#configs`) and `Exceptions` (`#exceptions`) also carry both, so
 * they are included too — a project without one of these folders simply never matches the glob.
 *
 * COVERAGE DECISION: only the alias form (`#pages` from inside `src/Pages/**`) is enforced
 * here — one static, cheap, zero-false-positive `no-restricted-imports` `files`-scoped block
 * per folder. The literal relative-barrel form (`./index`, `../index`) is NOT covered:
 * static glob `files`/`no-restricted-imports` patterns can't express "the barrel that lives in
 * MY OWN directory" across arbitrary nesting depth (`./index` vs `../index` vs `../../index`
 * all mean something different depending on how deep the importing file sits), and
 * `import/no-cycle` only catches it when the barrel also re-exports the importing file back
 * (a real 2-node cycle) — a file pulling a single non-reexported symbol out of the barrel
 * closes no cycle and passes `import/no-cycle` untouched. No ready-made rule in
 * `eslint-plugin-import-x` resolves "this specifier's absolute target == my own directory"
 * generically. This gap is real; the corresponding architecture.md prose is intentionally
 * NOT deleted (see skills/odg/references/architecture.md).
 */
/*
 * NOTE: "Selectors" is intentionally NOT listed here even though it has both a barrel and
 * `#selectors` alias. `src/Selectors/**` is already `files`-scoped by
 * ./selectors-import-boundary.mjs (Selectors MUST NOT import Pages/Handlers), and flat-config
 * blocks fully replace — never merge — a rule's value for files matched by more than one
 * block. Two separate blocks targeting the identical `files` glob with the same rule key
 * would silently let the later one erase the earlier one's bans. The own-alias ban for
 * Selectors is folded directly into selectors-import-boundary.mjs instead.
 */
const ownBarrelFolders = [
    { folder: "Pages", alias: "pages" },
    { folder: "Handlers", alias: "handlers" },
    { folder: "Validators", alias: "validator" },
    { folder: "Interfaces", alias: "interfaces" },
    { folder: "Exceptions", alias: "exceptions" },
    { folder: "Configs", alias: "configs" },
    { folder: "app/Services", alias: "services" },
    { folder: "app/Listeners", alias: "listeners" },
    { folder: "app/Providers", alias: "providers" },
];

/**
 * Build one `files`-scoped `no-restricted-imports` config block per managed folder, each
 * banning that folder's own alias from being imported by a file that already lives inside it.
 *
 * @returns {object[]} Flat-config blocks, one per entry in `ownBarrelFolders`.
 */
export function getOwnBarrelImportBlocks() {
    return ownBarrelFolders.map(({ folder, alias }) => ({
        files: [ `src/${folder}/**/*.ts` ],
        rules: {
            "@typescript-eslint/no-restricted-imports": [
                "error",

                {
                    paths: [
                        ...buildPathBans(folder === "Handlers" ? "handlers" : "default"),
                        {
                            name: `#${alias}`,
                            allowTypeImports: true,
                            message: `A file inside src/${folder}/ MUST import its own siblings by relative`
                                + ` path, never through the folder's own barrel/alias (#${alias}). Use`
                                + " a relative import instead.",
                        },
                    ],
                    patterns: [
                        {
                            group: [ `#${alias}/*` ],
                            allowTypeImports: true,
                            message: `A file inside src/${folder}/ MUST import its own siblings by relative`
                                + ` path, never through the folder's own barrel/alias (#${alias}). Use`
                                + " a relative import instead.",
                        },
                    ],
                },
            ],
        },
    }));
}
