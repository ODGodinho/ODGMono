import { isIdeWatchLint } from "../../helpers/lint-mode.mjs";

const maxHadoukenDepth = 3;
const maxStatements = 12;

const denylistedIds = [

    // Tipos TS
    "number",
    "string",
    "boolean",
    "any",
    "void",
    "never",
    "unknown",

    // Controle de Fluxo
    "yield",
    "await",
    "async",

    // Modificadores de Acesso
    "public",
    "protected",
    "private",
    "readonly",
    "static",

    // Estrutura
    "class",
    "interface",
    "enum",
    "namespace",
    "module",

    // Declaração
    "function",
    "var",
    "let",
    "const",

    // Condicionais/Loops
    "if",
    "else",
    "for",
    "while",
    "do",
    "switch",
    "case",
    "default",

    // Exceções
    "try",
    "catch",
    "finally",
    "throw",

    // Módulos
    "export",
    "from",
    "as",

    // POO
    "this",
    "super",
    "new",
    "extends",
    "implements",

    // Genéricos proibidos
    "val",
    "obj",
    "item",
    "list",
    "res",
    "req",

    // "callback", Callback parâmetro é bloqueado tb
    "package",
];

/**
 * Build the `id-denylist` rule entry, optionally allowing a few of the otherwise-banned words.
 * Used by index.mjs to let `default`/`list` through inside an Adonis project's root `config/`
 * folder — Adonis' own config files (`config/database.ts`, `config/app.ts`, ...) legitimately
 * export a `default` connection name and a `list` of allowed values under those names.
 *
 * @param {string[]} [allow] Words to remove from the denylist for this scope.
 * @returns {unknown[]} Rule entry for `id-denylist`.
 */
export function idDenylistRule(allow = []) {
    return [ "error", ...denylistedIds.filter((id) => !allow.includes(id)) ];
}

export default {
    rules: {
        "no-unexpected-multiline": [ "error" ], // Desabilita multiline possíveis erros operadores ;
        "no-cond-assign": [ "error" ], // Não atribua variável na condição do IF
        "object-shorthand": [ "error" ], // Não permite labels não usadas
        "no-unused-labels": [ "error" ], // Não permite labels não usadas
        "no-unused-vars": [
            "error",
            {
                vars: "all",
                args: "after-used",
                caughtErrors: "all",
                ignoreRestSiblings: true,
                varsIgnorePattern: "^_",
                argsIgnorePattern: "^_",
            },
        ],
        "default-param-last": [ "error" ],
        "no-array-constructor": [ "error" ], // Não permite usar new Array()
        "no-throw-literal": [ "error" ], // Não permite throw "string" ou diferente de classe
        "no-empty-function": [ "error" ], // Não permite funções vazias
        "no-duplicate-imports": [ "error" ], // Bloqueia import duplicado
        "import/no-duplicates": [ "error", { "prefer-inline": true } ], // Bloqueia import duplicado
        "prefer-const": [ "error" ], // Preferir constantes
        "no-unsafe-optional-chaining": [
            "error",
            { disallowArithmeticOperators: true },
        ], // Protege de optional que pode gerar errors
        "camelcase": [ "error" ], // Força camelCase
        "no-multi-assign": [ "error" ], // Força não usar atribuição múltipla
        "prefer-arrow-callback": [ "error" ], // Força arrow function
        "arrow-body-style": [ "error", "as-needed" ], // Força arrow function sem body
        "no-empty": [ "error" ], // Não permite blocos vazios (if, while, for, function, etc)
        "newline-before-return": [ "error" ], // Força retorno de função com \n antes
        "no-unreachable": [ "error" ], // Não permite unreachable code
        "no-multi-str": [ "error" ], // Não quebre linha dentro de uma string
        "consistent-this": [ "error", "that" ], // Não permite this em locais inconsistente.
        "dot-notation": [ "error" ], // Força usar dot em objeto em vez de object["key"]
        "no-extra-boolean-cast": [
            "error",
            { enforceForLogicalOperands: true },
        ], // Não permite cast de boolean extra !!!
        "no-constant-condition": [ "error" ], // Não permite condições constantes if (true)
        "no-debugger": [ "error" ], // Não permite usar debugger
        "no-console": [ "error" ], // Não permite usar console use https://github.com/ODGodinho/ODGLog
        "no-duplicate-case": [ "error" ], // Não permite duplicar case em switch
        "no-empty-character-class": [ "error" ], // Não permite classe de caracteres vazia em regex
        "no-ex-assign": [ "error" ], // Não permite atribuição de exceção
        "no-func-assign": [ "error" ], // Não permite atribuição de função
        "no-inner-declarations": [ "error" ], // Não permite declarações dentro de escopos
        "no-invalid-regexp": [ "error" ], // Não permite expressões regulares inválidas RegExp()
        "no-negated-in-lhs": [ "error" ], // Não permite negação em IN
        "no-regex-spaces": [ "error" ], // Não permite múltiplos espaços em regex utilize
        "no-sparse-arrays": [ "error" ], // Não permite arrays com itens vagos no meio
        "valid-typeof": [ "error" ], // Não permite typeof inválido
        "eqeqeq": [ "error", "always" ], // Usa igual e do mesmo tipo
        "no-extra-label": [ "error" ], // Não permite usar labels extra desnecessárias
        "no-labels": [ "error" ], // Disable Label/GOTO
        "no-native-reassign": [ "error" ], // Não permite reatribuição de funções/vars nativas
        "no-new": [ "error" ], // Não permite usar new sem salva-lo
        "no-new-func": [ "error" ], // Não permite usar new Function()
        "no-redeclare": [ "error" ], // Não permite redeclarar variáveis
        "no-self-compare": [ "error" ], // Não permite comparar com seu próprio valor
        "no-unmodified-loop-condition": [ "error" ], // Loop sem modificar o valor do contador ou check único
        "yoda": [ "error" ], // Força if Variável === "COMPARATION"
        "no-undef-init": [ "error" ], // Não permite variáveis definidas como undefined ao inicializar
        "no-new-require": [ "error" ], // Não permite usar new require()
        "no-new-object": [ "error" ], // Não permite usar new Object
        "prefer-template": [ "error" ], // Prefer template literals over string concatenation
        "no-async-promise-executor": [ "error" ], // Não permita use função async para executar promise
        "prefer-promise-reject-errors": [ "error" ], // Passe uma Exception em promise ao invés de string/number
        "no-var": [ "error" ], // Não user var prefira let ou const
        "promise/no-new-statics": [ "error" ], // Não permite usar new em static promise
        "promise/no-return-wrap": [ "error" ], // Não use promise.resolve ou reject dentro de then e catch
        "promise/param-names": [ "error" ], // Use nome correto para promise
        "promise/always-return": [ "error" ], // Se a promise não tiver retorno reportar erro
        "promise/no-nesting": [ "error" ], // Warn se colocar uma then ou catch dentro de outra promise
        "promise/no-return-in-finally": [ "error" ], // No Return in finally
        "promise/valid-params": [ "error" ], // Valida Parâmetros da promise
        "promise/no-callback-in-promise": [ "warn" ], // Evita callback dentro de promise mandar sucesso e error
        "promise/no-multiple-resolved": [ "error" ], // Evita chamar resolve ou reject mais de uma vez na promise
        "promise/prefer-catch": [ "error" ], // Força usar catch ao invés de then(null, fn)
        "promise/no-promise-in-callback": [ "error" ], // Evita promise dentro de callback transforme em promise
        "import/newline-after-import": [ "error", { count: 1 } ], // Linhas em branco apos o import

        "array-callback-return": [ "error" ], // Força returno em array callback
        "curly": [ "off" ], // Utilize chaves em multi linhas
        "handle-callback-err": [ "error" ], // Funções que recebem error deve ser tratado
        "n/handle-callback-err": [
            "error",
            String.raw`^(err|error|\w+Error|\w+Exception|exception)$`,
        ], // Funções que recebem error deve ser tratado
        "n/prefer-global/timers": [ "error", "always" ], // Prefira usar setTimeout, setInterval ... globais
        "new-cap": [ "error", { newIsCap: true } ], // New require first Letter uppercase
        "no-caller": [ "error" ], // Não permite usar callee
        "no-script-url": [ "error" ], // Não permite usar script URL
        "func-names": [ "error", "as-needed" ], // Nome de funções somente quando necessário
        "no-param-reassign": [ "error" ], // Não permite reatribuição de parâmetros
        "block-scoped-var": [ "error" ], // INFO: Bloqueia Vars for escopo, mas ainda sim prefira Lets

        /*
         * "filenames/match-exported": [
         *     "error",
         *     "^[a-zA-Z0-9_-]+$",
         *     "\\.[a-z]+$",
         * ], // Nome do arquivo igual export default
         */

        "unicorn/catch-error-name": [
            "error",
            {
                name: "exception",
                ignore: [ String.raw`^error\w*$`, "^error$", String.raw`^exception\w*$` ],
            },
        ], // Chame todos os catch erros de exception
        "unicorn/better-dom-traversing": [ "error" ], // Forca usar children First ou usar um selector inteligente
        "unicorn/consistent-compound-words": [ "error" ], // Palavras consistent passWord -> password
        "unicorn/consistent-json-file-read": [ "error" ], // Forca encode json.parse em files
        "unicorn/no-blob-to-file": [ "error" ], // Não faca blob em arquivos
        "unicorn/no-canvas-to-image": [ "error" ], // Não faca canvas em imagens
        "unicorn/no-confusing-array-splice": [ "error" ], // Não use array.splice se tiver forma mais simples
        "unicorn/no-incorrect-query-selector": [ "error" ], // Não use querySelectorAll se pegar posição zero sempre
        "unicorn/no-invalid-file-input-accept": [ "error" ], // Não coloque type incorreto no input
        "unicorn/no-manually-wrapped-comments": [ "error" ], // Não quebre cometários sem ponto final
        "unicorn/no-this-outside-of-class": [ "error" ], // Não use this fora de classes
        "unicorn/no-unnecessary-nested-ternary": [ "error" ], // Ternários mais inteligentes
        "unicorn/prefer-get-or-insert-computed": [ "error" ], // Use Map insert computed
        "unicorn/prefer-includes-over-repeated-comparisons": [ "error" ], // Use includes ao invés de várias comparações
        // "unicorn/prefer-iterator-to-array-at-end": [ "error" ], // Use toArray no final depois de manipular o array ! Classe odg Arr com conflito
        "unicorn/prefer-math-abs": [ "error" ], // Use Math.abs ao invés de ternário
        "unicorn/string-content": [ "error" ], // Previne scape em string desnecessário
        "unicorn/no-negated-array-predicate": [ "error" ], // Não inverta filtro apos filtrar
        "unicorn/no-negated-comparison": [
            "error",
            {
                checkLogicalExpressions: true,
            },
        ],
        "unicorn/no-object-methods-with-collections": [ "error" ], // Prefira map.keys() ao invés de Object.keys(map)
        "unicorn/no-return-array-push": [ "error" ], // Não retorne array.push() return array.length
        "unicorn/no-unnecessary-global-this": [ "error" ], // Não use this globalThis desnecessário
        "unicorn/no-unsafe-buffer-conversion": [ "error" ], // Preserve os bytes do buffer apenas para visibilidade
        "unicorn/no-useless-boolean-cast": [ "error" ], // Não use cast de boolean desnecessário em array filter...
        "unicorn/prefer-queue-microtask": [ "error" ], // Use queueMicrotask ao invés de setTimeout(..., 0) browser/node
        "unicorn/prefer-string-match-all": [ "error" ], // Use String.matchAll ao invés de String.match
        "unicorn/prefer-string-pad-start-end": [ "error" ], // Use padStart ao invés de repeat(10 - length)
        "unicorn/prefer-string-repeat": [ "error" ], // Use String.repeat ao invés de repetir manualmente
        "unicorn/require-css-escape": [ "error" ], // Use CSS.escape para escapar seletor CSS
        "unicorn/consistent-destructuring": [ "error" ], // Usa destructuring ou usa acesso direto sem alternar
        "unicorn/prefer-simple-condition-first": [ "error" ], // Organize as condições mais simples primeiro
        "unicorn/consistent-function-scoping": [ "error" ], // Remova sub função quando possível
        "unicorn/error-message": [ "error" ], // Exception tem q ter mensagem
        "unicorn/escape-case": [ "error" ], // Ao escapar use letra maiúscula hexadecimal
        "unicorn/new-for-builtins": [ "error" ], // Use new sempre em Promise, Array, Error, RegExp
        "unicorn/no-abusive-eslint-disable": [ "error" ], // Não desabilite todas as regras ESLint
        "unicorn/no-for-each": [ "error" ], // Prefira forOf ao invés Foreach
        "unicorn/prefer-unicode-code-point-escapes": [ "error" ], // Prefer Unicode code point escapes over legacy
        "unicorn/comment-content": [ "error" ], // Comentários com texto valido
        "unicorn/no-array-method-this-argument": [ "error" ], // Evita this array que pode falhar
        "unicorn/prefer-single-call": [ "error" ], // Faça apenas 1 push ao invés de vários
        "unicorn/no-await-expression-member": [ "error" ], // Não use (await getObject()).property;
        "unicorn/no-for-loop": [ "error" ], // Use ForOf em vez de for
        "unicorn/no-invalid-remove-event-listener": [ "error" ], // Não use removeEventListener Invalid
        "no-lonely-if": [ "error" ], // Não faz if cadeia desnecessário
        "unicorn/no-lonely-if": [ "error" ], // Não faz if cadeia desnecessário
        "unicorn/no-new-buffer": [ "error" ], // Não faz if cadeia desnecessário
        "unicorn/no-this-assignment": [ "error" ], // Desabilita invalido this
        "unicorn/no-useless-fallback-in-spread": [ "error" ], // Desabilita não usado opcional literals ...
        "unicorn/no-useless-length-check": [ "error" ], // Desabilita não usado opcional literals ...
        "unicorn/no-useless-spread": [ "error" ], // Desabilita ... em array desnecessário
        "unicorn/no-useless-switch-case": [ "error" ], // Desabilita Case não usado
        "unicorn/no-useless-undefined": [
            "error",
            { checkArrowFunctionBody: false },
        ], // Desabilita undefined desnecessário
        "unicorn/number-literal-case": [ "error" ],
        "unicorn/prefer-add-event-listener": [ "error" ], // Prefira AddEventListener em vez de onclick props
        "unicorn/prefer-array-find": [ "error" ], // Prefira array Find quando possível
        "unicorn/prefer-array-index-of": [ "error" ], // Prefira usar IndexOf
        "unicorn/prefer-array-some": [ "error" ], // Prefira usar Array some invés de length
        "unicorn/prefer-dom-node-append": [ "error" ], // Prefira append no DOM
        "unicorn/prefer-dom-node-remove": [ "error" ], // Prefira remove invés removeChild
        "unicorn/prefer-includes": [ "error" ], // Prefira usar include ao invés IndexOf
        "unicorn/prefer-keyboard-event-key": [ "error" ], // Prefira use Key invés de KeyCode
        "unicorn/prefer-optional-catch-binding": [ "error" ], // Omita o parâmetro .catch se não usado
        "unicorn/prefer-prototype-methods": [ "error" ], // Omita o parâmetro .catch se não usado
        "unicorn/prefer-query-selector": [ "error" ], // Prefira QuerySelector
        "unicorn/prefer-regexp-test": [ "error" ], // Prefira Regex test invés match
        "unicorn/prefer-spread": [ "error" ], // Prefira destructuring
        "unicorn/prefer-string-replace-all": [ "error" ], // Prefira replace ao invés de regex
        "unicorn/prefer-string-starts-ends-with": [ "error" ], // Prefira startWith ao invés de regex
        "unicorn/prefer-string-trim-start-end": [ "error" ], // Prefira trim Start/End invés de Left/Right
        "unicorn/prefer-switch": [ "error" ], // Prefira switch
        "unicorn/prefer-ternary": [ "error" ], // Prefira ternário em vez de if else
        "unicorn/no-single-promise-in-promise-methods": [ "error" ], // Promise.all precisa ter mais de 1 promise
        "unicorn/no-await-in-promise-methods": [ "error" ], // Não coloque await dentro Promise.all
        "unicorn/no-invalid-fetch-options": [ "error" ], // Valida função fetch
        "unicorn/consistent-empty-array-spread": [ "error" ], // ... no ternário deve ser 2 dados tipos iguais
        "unicorn/no-negation-in-equality-check": [ "error" ], // Evite if(!a !== b) evite isso
        "unicorn/name-replacements": [
            "error",
            {
                ignore: [ String.raw`\.env$`, ".env.*", "^Arr$", "^Num$", "^Str$" ],
            },
        ], // Prefira ternário em vez de if else
        "unicorn/relative-url-style": [ "error" ], // Não coloque ./ em new URL
        "unicorn/require-array-join-separator": [ "error" ], // Sempre passe parâmetro Array#join
        "unicorn/require-number-to-fixed-digits-argument": [ "error" ], // Passe quantidade em ToFixed
        "unicorn/template-indent": [ "error" ], // Indenter em template string
        "unicorn/no-nested-ternary": [ "error" ], // Ternário ilegível
        "unicorn/prefer-math-min-max": [ "error" ], // Use Math.Min e Max ao invés de ternário
        "unicorn/prefer-import-meta-properties": [ "error" ], // Pega o nome ou dirname do arquivo de forma nativa
        "unicorn/no-unnecessary-array-flat-depth": [ "error" ], // Não passe parâmetro no flat se for o default
        "unicorn/prefer-class-fields": [ "error" ], // Prefira inicializar atributo na classe não construtor
        "unicorn/prefer-classlist-toggle": [ "error" ], // Prefira class toggle ao invés de if-else
        "unicorn/no-immediate-mutation": [ "error" ], // Não edite array logo em sequencia
        "unicorn/no-useless-collection-argument": [ "error" ], // Não passe parâmetro array vazio no set
        "unicorn/prefer-response-static-json": [ "error" ], // Prefira Response.Json ao invés de stringify
        "unicorn/no-array-reverse": [ "error" ], // Prefira toReversed ao invés array.reverse() ao salvar em variável
        "unicorn/no-array-sort": [ "error" ], // Prefira toSort ao invés array.sort() ao salvar em variável
        "unicorn/no-named-default": [ "error" ], // Não import com name default
        "unicorn/no-unnecessary-slice-end": [ "error" ], // Não coloque end slice desnecessário
        "unicorn/no-zero-fractions": [ "error" ], // Não use decimal se terminar .0
        "unicorn/prefer-at": [ "error" ], // Use at acessar ultima posição
        "unicorn/prefer-blob-reading-methods": [ "error" ], // Prefira BufferArray em blob
        "unicorn/prefer-bigint-literals": [ "error" ], // Prefira BigInt literal ao invés de BigInt function
        "unicorn/prefer-date-now": [ "error" ], // Prefira usar date.now() ao invés dos outros
        "unicorn/dom-node-dataset": [ "error" ], // Prefira .dataset ao invés de .getAttribute(data-*)
        "unicorn/prefer-modern-math-apis": [ "error" ], // Prefira Math API modernas
        "unicorn/prefer-object-from-entries": [ "error" ], // Prefira Object entries ao invés de loop
        "unicorn/prefer-reflect-apply": [ "error" ], // Prefira Reflect ao invés Function.prototype.apply
        "unicorn/prefer-set-has": [ "error" ], // Prefira Set.has ao invés array.includes
        "unicorn/prefer-set-size": [ "error" ], // Prefira Set.size ao invés array.length
        "unicorn/require-module-specifiers": [ "error" ], // Não faça import vazio
        "unicorn/throw-new-error": [ "error" ], // Faça um new na hora do throw
        "unicorn/no-constant-zero-expression": [ "error" ], // Não * 0 prefira = 0
        "unicorn/no-double-comparison": [ "error" ], // Não faça comparação dupla x === x
        "unicorn/no-duplicate-if-branches": [ "error" ], // Não faça if com mesma condição
        "unicorn/no-useless-delete-check": [ "error" ], // Não faça delete dentro map.has() ? map.delete() : null
        "unicorn/prefer-array-iterable-methods": [ "error" ], // Prefira usar keys() ou values(), entries()
        "unicorn/prefer-boolean-return": [ "error" ], // Prefira retornar
        "unicorn/prefer-continue": [ "error" ], // Prefira continue
        "unicorn/prefer-flat-math-min-max": [ "error" ], // Prefira Math.min(...array)
        "unicorn/prefer-hoisting-branch-code": [ "error" ], // Coloque código repetido if-else fora
        "unicorn/prefer-math-constants": [ "error" ], // Use Math.PI nao 3.14
        "unicorn/prefer-promise-with-resolvers": [ "error" ], // Use Promise.withResolvers ao invés de new Promise
        "unicorn/prefer-while-loop-condition": [ "error" ], // Prefira while com condição ao invés de if break
        "no-shadow": [ "error" ], // Erro caso ja esteja declarado escopo a cima
        "no-delete-var": [ "error" ], // Não delete variáveis
        "no-lone-blocks": [ "error" ], // Não crie bloco desnecessários
        "no-proto": [ "error" ], // Não use __proto__ depreciada desde ECMA 3.1
        "id-length": [
            "error",
            {
                min: 3,
                exceptions: [ "i", "fs", "os", "id", "ip" ],
                // eslint-disable-next-line no-template-curly-in-string -- regex pattern, not a template literal
                exceptionPatterns: [ "^\\${1,2}[a-z]?$" ],
            },
        ], // Tamanho mínimo das variáveis
        "no-template-curly-in-string": [ "error" ], // Não faça templete string de forma incorreta
        "max-depth": [ "error", { max: maxHadoukenDepth } ], // Tamanho máximo do Hadouken
        "max-nested-callbacks": [ "error", maxHadoukenDepth ], // Tamanho máximo do Hadouken callback
        "better-max-params/better-max-params": [
            "error",
            {
                func: 4,
                constructor: 8,
            },
        ],
        "max-statements": [ "error", maxStatements ], // Máximo atribuição em função
        "operator-assignment": [ "error", "always" ], // Prefira atribuição curtas +=
        "unicorn/operator-assignment": [ "error", "always" ], // Prefira atribuição curtas += para strings tb
        "prefer-rest-params": [ "error" ], // Prefira ..args em vez de arguments
        "symbol-description": [ "error" ], // Symbol deve ter descrição
        "no-return-await": [ "error" ], // Não coloque await no return
        "max-classes-per-file": [ "error", 1 ], // Apenas 1 classe por arquivo
        "no-constructor-return": [ "error" ], // Construtor não deve ter um retorno
        "prefer-exponentiation-operator": [ "error" ], // Prefira ** em vez de Math.pow
        "prefer-object-spread": [ "error" ], // Prefira Desestruturar para concatenar objetos
        "default-case-last": [ "error" ], // Default switch case por ultimo
        "no-new-native-nonconstructor": [ "error" ], // Use apenas Symbol()
        "accessor-pairs": [ "error" ], // Crie o get e set
        "no-promise-executor-return": [ "error" ], // Não coloque um retorno em new Promise()
        "no-nonoctal-decimal-escape": [ "error" ], // Não coloque scape em numero decimais
        "prefer-destructuring": [ "error" ], // Prefira desestruturar array ao invés
        "complexity": [ "error", { "max": 15 } ], // Complexidade código
        "func-style": [ "error", "declaration" ], // Declare function name() em vez de var = function()
        "no-else-return": [ "error" ], // Não use else se tem retorno
        "unicorn/no-useless-else": [ "error" ], // Não use else desnecessário
        "unicorn/prefer-array-from-map": [ "error" ], // Prefira Array.from ao invés de map() em sequencia
        "unicorn/prefer-add-event-listener-options": [ "error" ], // Prefira usar opções em addEventListener
        "unicorn/prefer-early-return": [ "error" ], // Prefira retornar cedo para evitar if aninhados
        "unicorn/prefer-global-number-constants": [ "error" ], // Prefira usar constantes NaN do que Number.NaN
        "unicorn/prefer-identifier-import-export-specifiers": [ "error" ], // Import com nome sem aspas
        "unicorn/prefer-iterable-in-constructor": [ "error" ], // Prefira usar iterável em vez de array loops
        "unicorn/prefer-iterator-to-array": [ "error" ], // Prefira usar [...map.values()] -> map.values().toArray()
        "unicorn/prefer-location-assign": [ "error" ], // Prefira location.assign/replace ao invés de location.href
        "unicorn/prefer-minimal-ternary": [
            "error",
            { "checkComputedMemberAccess": true, "checkVaryingBase": true },
        ], // Prefira ternário minimalista
        "unicorn/prefer-object-define-properties": [ "error" ], // Prefira Object.defineProperties no lugar de 1 a 1
        "unicorn/prefer-object-destructuring-defaults": [ "error" ], // Prefira desestruturar com valor padrão
        "unicorn/prefer-object-iterable-methods": [ "error" ], // Prefira Object.values
        "unicorn/prefer-path2d": [ "error" ], // Prefira usar Path2D para formas complexas
        "unicorn/prefer-private-class-fields": [ "error" ], // Prefira usar campos privados em classes
        "unicorn/prefer-short-arrow-method": [ "error" ], // Prefira métodos arrow em objeto se possível
        "unicorn/prefer-simple-sort-comparator": [ "error" ], // Prefira comparadores de sort simples
        "unicorn/prefer-single-array-predicate": [ "error" ], // Prefira simples every,some ...
        "unicorn/prefer-smaller-scope": [ "error" ], // Prefira escopo menor const dentro do if
        /*
         * ! Desligado pois falha com abstract
         * "unicorn/consistent-class-member-order": [
         *     "error",
         *     {
         *         order: [
         *             "static-field",
         *             "static-block",
         *             "static-method",
         *             "public-field",
         *             "private-field",
         *             "constructor",
         *             "public-method",
         *             "private-method",
         *         ],
         *     },
         * ], // Prefira ordem consistente de membros da classe
         */
        "unicorn/consistent-optional-chaining": [ "error" ], // Opcional consistent
        "unicorn/consistent-export-decorator-position": [ "error" ], // Colocar decorator no lugar certo
        "unicorn/consistent-function-style": [ "error" ], // Colocar decorator no lugar certo
        "unicorn/explicit-timer-delay": [ "error" ], // Use delay explícito em setTimeout/setInterval
        // "unicorn/prefer-uint8array-base64": [ "error" ], // Prefira Uint8Array ao invés atob ou buffer.From // ? Apenas 24
        "unicorn/require-proxy-trap-boolean-return": [ "error" ], // Proxy set deve retornar boolean
        "unicorn/default-export-style": [ "error" ], // Export default direto sem usar variável
        "unicorn/no-accidental-bitwise-operator": [ "error" ], // Evite usar operadores bitwise acidentalmente
        "unicorn/no-array-concat-in-loop": [ "error" ], // Evite usar concat em loop use push
        "use-isnan": [ "error", { enforceForSwitchCase: true, enforceForIndexOf: true } ], // Use a função isNan
        "n/no-deprecated-api": [ "error" ], // Não use API depreciada do Node.js
        "prefer-regex-literals": [ "error", { disallowRedundantWrapping: true } ], // Use a função isNan
        "import/no-absolute-path": [ "error" ], // Não informa caminho absoluto
        "import/no-webpack-loader-syntax": [ "error" ], // Bloqueia syntax webpack import
        "import/no-named-as-default": [ "error" ],
        "import/no-named-as-default-member": [ "error" ],
        "import/no-mutable-exports": [ "error" ], // Não export var nem let
        "import/no-amd": [ "error" ], // Não require, define array
        "import/max-dependencies": [
            "error",
            {
                max: 20,
                ignoreTypeImports: true,
            },
        ], // Máximo de 25 dependências
        "import/no-import-module-exports": [ "error" ], // Import e export CommanJs bloqueado
        "import/no-useless-path-segments": [ "error", { commonjs: true } ], // Não volte pasta desnecessária import
        "import/no-extraneous-dependencies": [
            isIdeWatchLint ? "off" : "error",
            {
                devDependencies: [
                    "**/*.e2e-spec.*",
                    "**/*.e2e.*",
                    "**/*.spec.*",
                    "**/*.test.*",
                    "**/.eslintrc.{js,cjs,ts,mjs}",
                    "**/Gruntfile{,.js,.ts}",
                    "**/__mocks__/**",
                    "**/__tests__/**",
                    "**/cypress.config.{js,ts}",
                    "**/gulpfile.*.{js,ts}",
                    "**/gulpfile.{js,ts}",
                    "**/jest.config.{js,ts}",
                    "**/jest.setup.{js,ts}",
                    "**/karma.conf.{js,ts}",
                    "**/nuxt.config.{js,ts}",
                    "**/protractor.conf.*.{js,ts}",
                    "**/protractor.conf.{js,ts}",
                    "**/rollup.config.*.{js,ts}",
                    "**/rollup.config.{js,ts}",
                    "**/setupTests.{js,ts}",
                    "**/spec/**",
                    "**/test/**",
                    "**/tests/**",
                    "**/vite.config.{js,ts}",
                    "**/vue.config.{js,ts}",
                    "**/webpack.config.*.{js,ts}",
                    "**/webpack.config.{js,ts}",
                    "*.config.ts",
                    "*.config.mts",
                    "electron",
                    "electron**",
                ],
                optionalDependencies: true,
                peerDependencies: true,
                bundledDependencies: true,
            },
        ], // Não dependa de pacotes em devDependencies
        "sort-imports": [
            "error",
            {
                "ignoreCase": true,
                "ignoreDeclarationSort": true,
                "ignoreMemberSort": false,
                "memberSyntaxSortOrder": [ "none", "all", "multiple", "single" ],
                "allowSeparatedGroups": true,
            },
        ],
        "import/order": [
            "error",
            {
                "alphabetize": {
                    caseInsensitive: true,
                    order: "asc",
                },
                "groups": [ "builtin", "external", "internal", "unknown", "parent", "sibling", "index" ],
                "newlines-between": "always",
            },
        ], // Força essa ordem no import
        "@stylistic/spaced-comment": [
            "error",
            "always",
            {
                exceptions: [ "-", "+" ],
                block: { "balanced": true },
            },
        ], // Força espaço apos do // comentário
        "import/no-anonymous-default-export": [ "error", { allowCallExpression: false } ],
        "import/exports-last": [ "error" ], // Export por ultimo
        // "import/no-deprecated": [ "error" ], // Não import deprecated // ? slower
        "import/no-empty-named-blocks": [ "error" ], // Não import bloco vazio
        "import/first": [ "error" ], // Import por primeiro
        "import/no-named-default": [ "error" ], // Não faça { default as NomeModulo }
        "unicorn/no-array-splice": [ "error" ], // Não use array.splice() use toSpliced
        "unicorn/no-console-spaces": [ "error" ], // Separe por virgula em vez de colocar espaço no console
        "unicorn/prefer-array-flat-map": [ "error" ], // Prefira FlatMap in vez de map().flat().
        "unicorn/prefer-array-flat": [ "error" ], // Prefira usar array Flat
        "array-func/prefer-flat": [ "error" ], // Não passe parâmetro desnecessário
        "unicorn/prefer-string-slice": [ "error" ], // Use slice em vez de substr ou substring
        "unicorn/prefer-negative-index": [ "error" ], // Use slice em vez de substr ou substring
        "unicorn/prefer-modern-dom-apis": [ "error" ], // Prefira usar o DOM moderno
        "unicorn/prefer-number-properties": [ "error" ], // Prefira Number.numberVar() in vez de numberVar()
        "unicorn/numeric-separators-style": [ "error" ], // Separe Numero com Underline
        "unicorn/prefer-default-parameters": [ "error" ], // Prefira parâmetros padrões
        "unicorn/prefer-node-protocol": [ "error" ], // Prefira node: antes do import
        "unicorn/prefer-code-point": [ "error" ], // Prefira codePointAt no lugar de charCodeAt
        "unicorn/no-thenable": [ "error" ], // Não crie os nome com o nome Then
        "unicorn/no-unreadable-iife": [ "error" ], // Ternários não legíveis com funções
        "unicorn/prefer-native-coercion-functions": [ "error" ], // Prefira função cast nativa
        "unicorn/prefer-logical-operator-over-ternary": [ "error" ], // Mude "a ? a : b" para "a || b"
        "unicorn/prefer-event-target": [ "error" ], // Use EventTarget no Lugar de EventEmitter
        "unicorn/prefer-export-from": [ "error", { checkUsedVariables: true } ], // Prefira Export From
        "unicorn/prefer-string-raw": [ "error" ], // Use String.raw`` ao invés de scape no código
        "unicorn/consistent-tuple-labels": [ "error" ], // Prefira usar nome para tuplas tipagem array
        "unicorn/prefer-abort-signal-timeout": [ "error" ], // Prefira AbortSignal.timeout() ao invés de setTimeout
        "unicorn/prefer-aggregate-error": [ "error" ], // Prefira AggregateError ao invés de Error
        "unicorn/prefer-dom-node-replace-children": [ "error" ], // Use replaceChildren não removeChild + appendChild
        "unicorn/prefer-promise-try": [ "error" ], // Prefira Promise.try() ao invés de new Promise()
        "unicorn/prefer-set-methods": [ "error" ], // Prefira Set.union ao invés de novos
        "unicorn/prefer-toggle-attribute": [ "error" ], // Prefira Element.toggleAttribute() ao invés de if else
        "unicorn/prefer-url-search-parameters": [ "error" ], // Prefira URLSearchParams ao invés de string split
        "unicorn/no-unnecessary-fetch-options": [ "error" ], // Não passe parâmetro desnecessário fetch request
        "unicorn/prefer-abort-signal-any": [ "error" ], // Prefira AbortSignal.any() ao invés de Promise.any()
        "unicorn/prefer-group-by": [ "error" ], // Prefira Object.groupBy() ao invés de reduce
        "unicorn/prefer-simplified-conditions": [ "error" ], // Prefira condições simplificadas
        "array-func/from-map": [ "error" ], // Use .map invés do segundo parâmetro do From
        "array-func/no-unnecessary-this-arg": [ "error" ], // Não passe parâmetro desnecessário
        "array-func/avoid-reverse": [ "error" ], // Não passe parâmetro desnecessário
        "func-call-spacing": [ "error", "never" ],
        "jsx-quotes": [ "error", "prefer-double" ], // Aspas duplas em JSX HTML
        "vars-on-top": [ "error" ], // Caso a regra de var seja desativa elas devem ficar no topo
        "strict": [ "error" ], // Strict JavaScript top file
        "no-shadow-restricted-names": [ "error" ], // Sem variável com palavra reservada
        "id-denylist": idDenylistRule(), // Sem variável com palavra reservada
        "id-match": [
            "error",
            "^(?!(?:type|import)$).*$",
            {
                "properties": false,
                "onlyDeclarations": true,
                "classFields": false,
            },
        ],
        "logical-assignment-operators": [ "error", "always" ], // Faça ||= ao invés a = a || b
        "unicorn/logical-assignment-operators": [
            "error",
            "always",
            { "enforceForIfStatements": true },
        ], // Faça ||= ao invés a = a || b refactor de ifs
        "unicorn/no-top-level-assignment-in-function": [ "error" ], // Não faça atribuição dentro para fora função
        "unicorn/no-useless-override": [ "error" ], // Não faça override sem necessidade
        "no-with": [ "error" ], // Não use with
        "unicorn/max-nested-calls": [ "error", { max: 4 } ], // Tamanho máximo chamada em cadeia
        "unicorn/no-global-object-property-assignment": [ "error" ], // Não atribua propriedades em objetos globais
        "unicorn/class-reference-in-static-methods": [
            "error",
            {
                preferThis: true,
                preferSuper: true,
            },
        ], // Não use this,super em static
        "func-name-matching": [
            "error",
            {
                considerPropertyDescriptor: true,
            },
        ],
        "no-new-wrappers": [ "error" ],
        "no-misleading-character-class": [ "error" ],
        "grouped-accessor-pairs": [ "error", "getBeforeSet" ],
        "no-sequences": [ "error" ], // Não faça a = (2, 4)
        "antfu/consistent-chaining": [ "error" ], // Ou quebra todos os pontos ou nenhum arr.map().filter().flat() etc
        "antfu/consistent-list-newline": [ "error" ], // Quebre todos ou nenhum item do object
        "antfu/import-dedupe": [ "error" ], // Auto fix import duplicados
        "antfu/indent-unindent": [ "error" ], // Ident template strings
        "antfu/no-import-dist": [ "error" ], // Não importe a pasta dist
        "antfu/no-import-node-modules-by-path": [ "error" ], // Não importe de dentro da node_modules,
        "sonarjs/block-scoped-var": [ "error" ], // Bloqueia variáveis fora do escopo do bloco
        "sonarjs/deprecation": [ isIdeWatchLint ? "off" : "error" ], // Não use função depreciadas
        "sonarjs/max-union-size": [ "error" ], // Não une mais de 3 tipos sem criar um type
        "sonarjs/no-async-constructor": [ "error" ], // Não coloque coisas async no construtor
        "sonarjs/no-collapsible-if": [ "error" ], // Unir os if desnecessários
        "sonarjs/no-nested-functions": [ "error" ], // Sem Hadouken de função
        "sonarjs/no-parameter-reassignment": [ "error" ], // Não reatribua um parâmetro sem usar
        "sonarjs/no-redundant-jump": [ "error" ], // Não coloque return desnecessário na função
        "sonarjs/prefer-promise-shorthand": [ "error" ], // Promise.resolve ao invés new Promise "promise/avoid-new"
        "sonarjs/public-static-readonly": [ "error" ], // Use Readonly no static
        "sonarjs/redundant-type-aliases": [ "error" ], // Não crie um ja existe
        "sonarjs/todo-tag": [ "warn" ], // Doc TOD-D devem ser resolvidos alerta
        "sonarjs/updated-loop-counter": [ "error" ], // Não reatribua variável do loop
        "sonarjs/use-type-alias": [ "error" ], // Crie um alias se repetir muita concatenação de tipo
        "sonarjs/void-use": [ "error" ], // Não use void em lugar malucos

        "zod/array-style": [ "error" ], // Use Zod.array() ao invés de z.string().array();
        "zod/consistent-import": [ "error" ], // Use import * as z from "zod"
        "zod/consistent-import-source": [ "error" ], // Use import from "zod" ou zod/v4
        "zod/consistent-schema-var-name": [ "error", { "after": "Validator" } ], // Zod nome termina com Validator
        "zod/no-any-schema": [ "error" ], // Não use z.any() use z.unknown()
        "zod/no-coerce-boolean": [ "error" ], // Não use z.coerce.boolean() use z.boolean()
        "zod/no-number-schema-with-int": [ "error" ], // Não use z.number().int() use z.int()
        "zod/no-number-schema-with-safe": [ "error" ], // Não use z.number().safe() use z.int()
        "zod/no-number-schema-with-step": [ "error" ], // Não use z.number().step() use z.multipleOf()
        "zod/no-optional-and-default-together": [
            "error",
            { "preferredMethod": "optional" },
        ], // Não use z.optional().default() use z.default()
        "zod/prefer-top-level-string-formats": [ "error" ], // Use Nao use string().uuid use uuid() etc..
        "zod/no-throw-in-refine": [ "error" ], // Não use throw no refine
        "zod/no-transform-in-record-key": [ "warn" ], // Não use transform no record key para evitar transforma os dados
        "zod/prefer-enum-over-literal-union": [ "error" ], // Prefira enum ao invés de union literal
        "zod/prefer-loose-object": [ "error" ], // Prefira z.looseObject({}) ao invés de z.object({}).passthrough()
        "zod/prefer-meta": [ "error" ], // Prefira zod.meta() ao invés de .describe()
        "zod/prefer-meta-last": [ "error" ], // Prefira zod.meta() no final
        "zod/prefer-nullish": [ "error" ], // Prefira zod.nullish() ao invés de zod.optional().nullable()
        "zod/prefer-strict-object": [ "error" ], // Prefira zod.strictObject() ao invés de zod.object().strict()
        "zod/prefer-string-schema-with-trim": [ "error" ], // Prefira z.string().trim() ao invés de z.string()
        "zod/prefer-trim-before-string-length-checks": [ "error" ], // Trim antes de validar o tamanho string
        "zod/require-error-message": [ "error" ], // Refine() precisa colocar mensagem de erro

    },
};
