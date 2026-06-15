export default {
    rules: {
        "import/default": [ "error" ], // Import default
        "unicorn/no-duplicate-set-values": [ "error" ], // Não use set com valores duplicados
        "unicorn/no-exports-in-scripts": [ "error" ], // Não use exports em scripts
        "unicorn/no-unnecessary-splice": [ "error" ], // Não use splice inválidos
        /*
         * "unicorn/no-unsafe-property-keyword": [ "error" ], // Não use tipos inválidos como chave de propriedade // ! don't working
         * "import/namespace": [ "error" ], // Import namespace errors // ? slower
         */
    },
};
