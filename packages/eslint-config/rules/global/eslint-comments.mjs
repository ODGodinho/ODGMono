export default {
    rules: {
        "eslint-comments/no-duplicate-disable": [ "error" ], // Não desative a mesma regra 2x
        "eslint-comments/require-description": [ "error" ], // Faça comentário sempre q desligar ESLint
        "eslint-comments/no-unused-enable": [ "error" ], // Não ligue uma regra que não foi desligada
        "eslint-comments/no-unlimited-disable": [ "error" ], // Nao desligue todas as regras de 1 vez
    },
};
