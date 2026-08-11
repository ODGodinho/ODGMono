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
        /*
         * "import/namespace": [ "error" ], // Import namespace errors // ? slower
         */
    },
};
