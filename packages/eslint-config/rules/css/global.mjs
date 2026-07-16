export default {
    rules: {
        "css/font-family-fallbacks": [ "error" ], // Força fallback de font-family
        "css/no-duplicate-imports": [ "error" ], // Não use import duplicado
        "css/no-duplicate-keyframe-selectors": [ "error" ], // Não use keyframe duplicado
        "css/no-empty-blocks": [ "error" ], // Não use bloco vazio
        "css/no-important": [ "error" ], // Não use !important
        "css/no-invalid-at-rule-placement": [ "error" ], // Não use @import @charset no lugar correto
        "css/no-invalid-at-rules": [ "error" ], // Não use rules incorretas
        "css/no-invalid-named-grid-areas": [ "error" ], // Não use áreas de grid parâmetro invalido
        "css/no-invalid-properties": [ "error" ], // Não use propriedades inválidas
        "css/no-unmatchable-selectors": [ "error" ], // Não use seletores inválidos
        "css/use-baseline": [ "error" ], // Use baseline consistentemente
        "unicorn/no-shorthand-property-overrides": [ "error" ], // Faça CSS override na ordem certa
        "unicorn/no-transition-all": [ "error" ], // Não use transition all CSS
        "unicorn/prefer-explicit-viewport-units": [ "error" ], // Use unidades de viewport explicitas
    },
};
