import { restrictSyntaxTest } from "../global/restrict-syntax.mjs";

const MAX_STATEMENTS = 20;
const maxHadoukenDepth = 5;

export default {
    rules: {
        "n/no-process-env": [ "off" ],
        "dot-notation": [ "off" ],
        "@typescript-eslint/dot-notation": [ "off" ],
        "no-magic-numbers": [ "off" ], // Desliga magic number em test
        "@typescript-eslint/no-magic-numbers": [ "off" ], // Desliga magic number em test
        "max-statements": [ "error", MAX_STATEMENTS ],
        "max-nested-callbacks": [ "error", maxHadoukenDepth ], // Tamanho máximo do Hadouken callback
        "unicorn/consistent-function-scoping": [ "error" ], // Remova sub função quando possível
        /*
         * "sonarjs/no-duplicate-test-title": [ "error" ], // Não permita testes com mesmo nome // ? Break after install
         * "sonarjs/prefer-specific-assertions": [ "error" ], // Assertion valido // ? Break after install
         * "sonarjs/no-trivial-assertions": [ "error" ], // Assertion sem segundo campo // ? Break after install
         * "sonarjs/assertions-in-tests": [ "error" ], // Teste tem q ter assert // ? Break after install
         */
        "sonarjs/chai-determinate-assertion": [ "error" ], // Use assert adequado
        "sonarjs/disabled-timeout": [ "error" ], // Impede numero além do limite de tempo timeout
        "sonarjs/inverted-assertion-arguments": [ "error" ], // Assert na ordem correta
        "sonarjs/no-code-after-done": [ "error" ], // N faça nada apos done nos testes
        "sonarjs/no-exclusive-tests": [ "error" ], // N use only nos testes
        "sonarjs/no-incomplete-assertions": [ "error" ], // Asserts incompletos
        "sonarjs/no-same-argument-assert": [ "error" ], // Asserts ordem correta
        "sonarjs/no-skipped-tests": [ "error" ], // No Skip Tests
        "sonarjs/prefer-type-guard": [ "error" ], // Use is no return boolean type
        "sonarjs/stable-tests": [ "error" ], // Testes devem funcionar de primeira tentativa
        "sonarjs/test-check-exception": [ "error" ], // Testes devem testar exceção
        "sonarjs/parameterized-tests": [ "error" ], // Prefira each nos tests
        "sonarjs/assertions-in-test-cases": [ "error" ], // Asserts dentro de it/test sempre
        "sonarjs/synchronous-suite-callback": [ "error" ], // Nao faca teste com algo antes iniciar
        "sonarjs/no-interpolation-in-inline-snapshots": [ "error" ], // Nao use interpolação em tests
        "@typescript-eslint/unbound-method": [ "off" ], // Preserve bind class
        "no-restricted-syntax": [
            "error",
            ...restrictSyntaxTest,
        ],
    },
};
