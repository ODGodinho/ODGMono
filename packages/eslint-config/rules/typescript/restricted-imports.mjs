import { restrictedHandlerTypeImport } from "./handler-types-boundary.mjs";

/*
 * ---------------------------------------------------------------------------------------------
 * TABELA DE `paths` BANIDOS — fonte única de verdade.
 *
 * Cada entrada é { entry: {...}, contexts: [...] } — `contexts` diz em quais escopos de pasta
 * essa restrição vale. Sem `contexts` explícito = vale em todos (é o caso normal: a maioria das
 * regras vale monorepo inteiro). Para ver as exceções por pasta, olhe só a lista abaixo — nada
 * de `.filter(ban => ban.name !== ...)` espalhado nos consumidores.
 *
 * Contextos existentes:
 *   - "default"  Qualquer arquivo TS (rule base, e ponto de partida de cada `files`-scoped
 *                block, já que no-restricted-imports substitui — nunca funde — o valor de um
 *                bloco anterior para os arquivos que ele também casa).
 *   - "handlers" `src/Handlers/**` (own-barrel block, ./own-barrel-imports.mjs). Único lugar
 *                onde HandlerFunction/HandlerSolutionType É permitido — handler.md linha 61
 *                diz que esses tipos existem justamente para uso dentro de Handlers.
 * ---------------------------------------------------------------------------------------------
 */
const ALL_CONTEXTS = [ "default", "handlers" ];

const pathBans = [
    {

        /*
         * DI discipline: wrappers tipados ($inject / $multiInject / $injectOptional de
         * ContainerInject.ts) no lugar dos decorators crus do inversify. Type-only imports
         * continuam liberados. ContainerInject.ts em si é isento (ver index.mjs).
         */
        entry: {
            name: "inversify",
            importNames: [ "inject", "multiInject", "optional" ],
            message: "Use $inject / $multiInject / $injectOptional from the project's"
                + " ContainerInject.ts, not raw inversify decorators.",
            allowTypeImports: true,
        },
    },
    {
        contexts: [ "default" ],
        entry: restrictedHandlerTypeImport,
    },
];

/**
 * Build the `paths` entries active for a given folder scope.
 *
 * @param {"default" | "handlers"} context Folder scope — see table comment above.
 * @returns {object[]} The `paths` entries active for that context.
 */
export function buildPathBans(context) {
    return pathBans
        .filter(({ contexts = ALL_CONTEXTS }) => contexts.includes(context))
        .map(({ entry }) => entry);
}

/**
 * Build the `@typescript-eslint/no-restricted-imports` rule entry. Every TypeScript file
 * forbids raw inversify decorators and importing HandlerFunction/HandlerSolutionType.
 *
 * @returns {unknown[]} Rule entry for `@typescript-eslint/no-restricted-imports`.
 */
export function getRestrictedImportsRule() {
    return [
        "error",
        {
            paths: buildPathBans("default"),
        },
    ];
}
