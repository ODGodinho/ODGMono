export default {
    rules: {
        "eslint-comments/no-duplicate-disable": [ "error" ], // Não desative a mesma regra 2x
        "eslint-comments/require-description": [ "error" ], // Faça comentário sempre q desligar ESLint
        "eslint-comments/no-unused-enable": [ "error" ], // Não ligue uma regra que não foi desligada
        "eslint-comments/no-unlimited-disable": [ "error" ], // Nao desligue todas as regras de 1 vez
        "eslint-comments/no-restricted-disable": [
            "error",
            "import/no-cycle",
            "import/no-extraneous-dependencies",
            "import/no-restricted-paths",
            "check-file/filename-naming-convention",
            "zod/consistent-schema-var-name",
            "sonarjs/no-default-utility-imports",
        ], // Nao desligue regra cuja correcao e conhecida (import type, dependencia, camada, nome, import nomeado)
    },
};
