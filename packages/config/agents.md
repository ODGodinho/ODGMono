## @odg/config - Consumer Guide

## 🎯 Purpose
- Abstração de configuração tipada: ler, escrever, listar chaves e recarregar via validação
- Implementação exportada: `JsonConfig` + contratos `ConfigInterface` e `ValidatorInterface`
- use-a no lugar de process.env, o process.env deve ser usado para carregar as configurações

## 📜 Contracts
- **Entry público**: `import` de `@odg/config` → tipos em `interfaces` + classe `JsonConfig`
- **`ConfigInterface<ConfigTypes>`**: `ConfigTypes extends Record<number | string | symbol, unknown>` — métodos `has`, `get` (default síncrono ou `Promise`), `all`, `set`, `init`
- **`ValidatorInterface<ValidatedData>`**: `parse(unknown): ValidatedData` (obrigatório); `safeParse?(unknown): { success: boolean; data?: ValidatedData }` (opcional, estilo Zod)
- **`JsonConfig`**: construtor `(data, validator)` com `data: ConfigTypes | Record<string, unknown>`; implementa `ConfigInterface`

## 🚦 Rules (Usage)
- Forneça um validador com `parse` alinhado ao formato esperado de `ConfigTypes`
- Se usar `safeParse` no construtor: sucesso opcionalmente preenche estado interno; falha não chama `parse` — chame `init()` para validação estrita e carga completa
- `get`: ausência de valor na chave usa `$default` (síncrono ou assíncrono); presença (incl. `null`) ignora default
- Chaves são consultadas com `$key.toString()` na verificação de “definido”

## 💥 Exceptions
- **`validator.parse` em `init()`**: propaga qualquer exceção do validador (tipo e mensagem definidos pela implementação, ex.: erros de validação estilo schema)
- **Construtor com `safeParse` ausente ou que falha**: a biblioteca não lança; estado pode ficar incompleto até `init()`
- **`has` / `get` / `all` / `set` com estado interno indefinido**: pode ocorrer erro em tempo de execução ao acessar estrutura vazia — trate garantindo `init()` ou `safeParse` bem-sucedido antes do uso

## ⚠️ Integration Pitfalls
- Não há dependência de Zod: apenas o formato `parse` / `safeParse` opcional deve ser respeitado
- `safeParse` omitido no construtor não valida nem preenche `configs` até `init()`
