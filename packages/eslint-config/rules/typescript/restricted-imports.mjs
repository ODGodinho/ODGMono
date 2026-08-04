import { restrictedBuildOutputImport } from "./build-output-reach-in.mjs";
import { restrictedHandlerTypeImport } from "./handler-types-boundary.mjs";

/*
 * ---------------------------------------------------------------------------------------------
 * TABELAS DE IMPORTS BANIDOS — fonte única de verdade.
 *
 * Duas tabelas, uma por chave do `no-restricted-imports`: `pathBans` alimenta `paths`
 * (especificador exato) e `patternBans` alimenta `patterns` (glob/regex). Mesma forma nas duas:
 * cada entrada é { entry: {...}, contexts: [...] } — `contexts` diz em quais escopos de pasta
 * essa restrição vale. Sem `contexts` explícito = vale em todos (é o caso normal: a maioria das
 * regras vale monorepo inteiro). Para ver as exceções por pasta, olhe só as listas abaixo — nada
 * de `.filter(ban => ban.name !== ...)` espalhado nos consumidores.
 *
 * Contextos existentes:
 *   - "default"  Qualquer arquivo TS (rule base, e ponto de partida de cada `files`-scoped
 *                block, já que no-restricted-imports substitui — nunca funde — o valor de um
 *                bloco anterior para os arquivos que ele também casa).
 *   - "handlers" `src/Handlers/**` (own-barrel block, ./own-barrel-imports.mjs). Único lugar
 *                onde HandlerFunction/HandlerSolutionType É permitido — handler.md linha 61
 *                diz que esses tipos existem justamente para uso dentro de Handlers.
 *
 * IMPORTANTE para quem for adicionar um ban de `patterns`: passe pela `patternBans` daqui, e não
 * direto no array `patterns` de um bloco `files`-scoped. Bloco flat-config SUBSTITUI o valor da
 * regra — um ban escrito só no rule base desaparece silenciosamente em `src/Selectors/**`,
 * `src/Pages/**`, `src/Handlers/**` etc., que remontam o próprio valor. Os três pontos de
 * composição (./possible-errors.mjs, ./own-barrel-imports.mjs, ./selectors-import-boundary.mjs)
 * já puxam `buildPatternBans()`, então entrar pela tabela é o que garante cobertura total.
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

const patternBans = [
    {

        /*
         * Nunca importe a saída de build de uma dependência (`pkg/dist/...`, `pkg/lib/...`) —
         * use o especificador publicado. Vale em qualquer arquivo, inclusive Handlers: o
         * rationale completo (por que `exports` não basta, por que `regex` e não glob) está em
         * ./build-output-reach-in.mjs.
         */
        entry: restrictedBuildOutputImport,
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
 * Build the `patterns` entries active for a given folder scope.
 *
 * @param {"default" | "handlers"} context Folder scope — see table comment above.
 * @returns {object[]} The `patterns` entries active for that context.
 */
export function buildPatternBans(context) {
    return patternBans
        .filter(({ contexts = ALL_CONTEXTS }) => contexts.includes(context))
        .map(({ entry }) => entry);
}

/**
 * Build the `@typescript-eslint/no-restricted-imports` rule entry. Every TypeScript file
 * forbids raw inversify decorators, importing HandlerFunction/HandlerSolutionType, and
 * reaching into a dependency's build output (dist/, lib/).
 *
 * @returns {unknown[]} Rule entry for `@typescript-eslint/no-restricted-imports`.
 */
export function getRestrictedImportsRule() {
    return [
        "error",
        {
            paths: buildPathBans("default"),
            patterns: buildPatternBans("default"),
        },
    ];
}
