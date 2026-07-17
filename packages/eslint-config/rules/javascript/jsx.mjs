export default {
    rules: {
        "jsx-a11y/alt-text": [ "error" ], // Alt deve ter texto
        "jsx-a11y/anchor-has-content": [ "error" ], // Ancora abrir e fechar tag so se necessário
        "jsx-a11y/anchor-is-valid": [ "error" ], // Ancora deve ter href ou role valido
        "jsx-a11y/aria-activedescendant-has-tabindex": [ "error" ], // Aria-activedescendant deve ter tabindex
        "jsx-a11y/aria-props": [ "error" ], // Aria-props deve existir
        "jsx-a11y/aria-proptypes": [ "error" ], // Aria-proptypes valida prototype correto
        "jsx-a11y/aria-role": [ "error" ], // Aria-role deve ser valido
        "jsx-a11y/aria-unsupported-elements": [ "error" ], // Aria deve ir apenas elementos suportados
        "jsx-a11y/autocomplete-valid": [ "error" ], // Autocomplete parâmetro deve ser valido
        "jsx-a11y/click-events-have-key-events": [ "error" ], // Nao misturar click e keyDown por acessibilidade
        "jsx-a11y/control-has-associated-label": [ "error" ], // Control deve ter label associado
        "jsx-a11y/heading-has-content": [ "error" ], // Heading deve ter conteúdo
        "jsx-a11y/html-has-lang": [ "error" ], // HTML deve ter lang
        "jsx-a11y/iframe-has-title": [ "error" ], // Iframe deve ter title
        "jsx-a11y/img-redundant-alt": [ "error" ], // Img deve ter alt
        "jsx-a11y/interactive-supports-focus": [ "error" ], // Interactive deve suportar focus sem disparar evento click
        "jsx-a11y/label-has-associated-control": [ "error" ], // Label deve ter control associado
        "jsx-a11y/lang": [ "error" ], // Lang deve ser valido
        "jsx-a11y/media-has-caption": [ "error" ], // Media deve ter tracker controle
        "jsx-a11y/mouse-events-have-key-events": [ "error" ], // Nao misturar OnMouseOver e OnBlur
        "jsx-a11y/no-access-key": [ "error" ], // Nao use accessKey
        "jsx-a11y/no-aria-hidden-on-focusable": [ "error" ], // Nao use aria-hidden em elementos focáveis
        "jsx-a11y/no-distracting-elements": [ "error" ], // Nao use elementos distratores
        "jsx-a11y/no-interactive-element-to-noninteractive-role": [ "error" ], // Sem Elementos interativos como role
        "jsx-a11y/no-noninteractive-element-interactions": [ "error" ], // Sem interações em elementos não interativos
        "jsx-a11y/no-noninteractive-element-to-interactive-role": [ "error" ], // Sem role em elementos não interativos
        "jsx-a11y/no-noninteractive-tabindex": [ "error" ], // Sem tabindex em elementos não interativos
        "jsx-a11y/no-redundant-roles": [ "error" ], // Sem roles redundantes
        "jsx-a11y/no-static-element-interactions": [ "error" ], // Sem interações em elementos estáticos
        "jsx-a11y/role-has-required-aria-props": [ "error" ], // Role deve ter aria-props requeridos
        "jsx-a11y/role-supports-aria-props": [ "error" ], // Role deve ter aria props necessários e suportados
        "jsx-a11y/scope": [ "error" ], // Sem scope em elementos
        "jsx-a11y/tabindex-no-positive": [ "error" ], // Sem tabindex positivo em elementos interativos
    },
};
