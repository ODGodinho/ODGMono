export default {
    rules: {
        "no-alert": [ "error" ], // Não use alert prompt etc
        "no-loop-func": [ "error" ], // Não declare funções em loop
        "n/no-sync": [ "error" ], // N use funções SYNC
        "n/prefer-promises/dns": [ "error" ], // Use promise no DNS
        "n/prefer-promises/fs": [ "error" ], // Use promise no FS
        "unicorn/no-array-fill-with-reference-type": [ "error" ], // Não use array.fill com tipos de referência
        "unicorn/no-array-from-fill": [ "error" ], // Não use array.fill com tipos de referência
        "unicorn/prefer-array-last-methods": [ "error" ], // Use findLast ao invés de reverse
        "unicorn/prefer-iterator-concat": [ "error" ], // Use iteradores ao invés de concat
        "unicorn/prefer-split-limit": [ "error" ], // Use split com limit para evitar memory leak
        "unicorn/require-passive-events": [ "error" ], // Use eventos passivos para scroll e touch
        "unicorn/no-duplicate-loops": [ "error" ], // Não faça loops duplicados desnecessários
        "unicorn/no-unreadable-for-of-expression": [ "error" ], // Não faca com múltiplas funções no fo of func1(func2))
        "unicorn/prefer-array-slice": [ "error" ], // Use slice ao invés de splice ao acessar diretamente
        "unicorn/prefer-has-check": [ "error" ], // Use has(key) ao invés !!get(key)
        "unicorn/no-array-sort-for-min-max": [ "error" ], // Use Math.min e Math.max ao invés de sort[0]]
        "unicorn/no-boolean-sort-comparator": [ "error" ], // Não use sort com booleans
        "unicorn/no-chained-comparison": [ "error" ], // Não use comparações encadeadas
        "unicorn/no-loop-iterable-mutation": [ "error" ], // Não modifique iteráveis em loops prefira do-while
        "unicorn/prefer-single-replace": [ "error" ], // Use replaceAll ao invés de vários replace
        "unicorn/prefer-unary-minus": [ "error" ], // Nao use * -1 para deixar negativo use apenas - na frente do número
        "unicorn/prefer-url-can-parse": [ "error" ], // Use URL.canParse para validar URLs
        // "unicorn/prefer-disposed": [ "error" ], // Use objetos descartados para evitar memory leak // ? don't working
    },
};
