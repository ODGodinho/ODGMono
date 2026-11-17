export default {
    rules: {
        "import/default": [ "error" ], // Import default
        "unicorn/no-instanceof-builtins": [ "error" ], // Não use instanceof Array,Function,String etc
        "unicorn/no-accessor-recursion": [ "error" ], // Não use recursão em getters e setters
        "unicorn/require-module-attributes": [ "error" ], // Não use with {} import sem atributos
        "unicorn/no-impossible-length-comparison": [ "error" ], // Valida comparação de length
        "unicorn/no-invalid-character-comparison": [ "error" ], // Valida comparação de caracteres invalida
        "unicorn/no-useless-compound-assignment": [ "error" ], // Variável que nao faz nada += 0
        "unicorn/no-duplicate-set-values": [ "error" ], // Não use set com valores duplicados
        "unicorn/no-exports-in-scripts": [ "error" ], // Não use exports em scripts
        "unicorn/no-unnecessary-splice": [ "error" ], // Não use splice inválidos
        // "promise/spec-only": [ "error" ], // Promise bloqueia itens nao existentes // ? Promise.try not working
        "promise/valid-params": [ "error" ], // Promise valida parâmetros
        "unicorn/no-unsafe-property-key": [ "error" ], // Não use tipos inválidos como chave de propriedade
        "unicorn/no-unused-iterator-helper": [ "error" ], // Não use iterator helper que nao salva retorno
        "unicorn/no-unused-builtin-method-return": [ "error" ], // Não use builtin method que nao salva retorno
        "unicorn/no-useless-set-construction": [ "error" ], // Não use set desnecessários
        "unicorn/no-invalid-response-options": [ "error" ], // Não use options inválidas para response API
        "unicorn/no-prevent-default-in-passive-listener": [ "error" ], // Não use preventDefault em listeners passivos
        "unicorn/no-invalid-boolean-attribute-value": [ "error" ], // Não use valores boolean inválidos
        "unicorn/no-invalid-property-descriptor": [ "error" ], // Não use property Object.defineProperty inválidos
        "unicorn/no-invalid-url-protocol-comparison": [ "error" ], // Não use comparação de protocolos inválidos
        "unicorn/require-text-decoder-streaming": [ "error" ], // Não use TextDecoder streaming sem terminar o decode
        "unicorn/no-invalid-temporal-arithmetic": [ "error" ], // Não use temporal arithmetic inválidos
        "unicorn/no-invalid-style-set-property": [ "error" ], // Não use style set property inválidos case
        "unicorn/no-invalid-intl-options": [ "error" ], // Não use options inválidas para Intl
        "unicorn/no-unsafe-json-serialization": [ "error" ], // Não use JSON.stringify com objetos inválidos
        "unicorn/no-incomplete-accessor-override": [ "error" ], // Não getter setter incorreto JS

        "unicorn/no-invalid-dom-token": [ "error" ], // Não use DOM métodos inválidos
        /*
         * "import/namespace": [ "error" ], // Import namespace errors // ? slower
         */
    },
};
