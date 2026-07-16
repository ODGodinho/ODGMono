export default {
    rules: {
        "import/default": [ "error" ], // Import default
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
