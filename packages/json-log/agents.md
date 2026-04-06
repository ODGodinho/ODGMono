## @odg/json-log - Consumer Guide

## 🎯 Purpose

- Plugins `LoggerPluginInterface` (`@odg/log`) que transformam a mensagem em objeto estruturado (`JSONLogger`) e, opcionalmente, em `JSONLoggerString` (request serializado em strings).
- Modelos de tipos para o payload de log (`LoggerObjectInterface` e derivados) e exceções de parsing (`JSONParserException`, `JSONParserUnknownException`).

## 📜 Contracts

- `JSONLoggerPlugin(appName, maxExceptionPrevious?, instanceId?)`: `parser` substitui `message` por `JSONLogger`; `logJSON(level, message)` monta o mesmo objeto; setters `setIdentifier`, `setInstance`, `setGitRelease`, `setGitBranch`.
- `RequestStringPlugin`: `parser` exige `data.message` já ser `JSONLogger`; retorna `JSONLoggerString` com `request` convertido (headers/data/params/proxy/response como strings).
- `JSONLogger`: espelha `LoggerObjectInterface`; `toJson()` retorna `LoggerObjectInterface` com `createdAt: Date`.
- `JSONLoggerString`: constrói a partir de `LoggerStringInterface` (`request` no formato `LoggerRequestStringInterface`).
- `JSONLoggerJson`: mesmo conteúdo lógico que o modelo de log, com `createdAt` como `string` (alinhado ao JSON após serialização, não ao retorno de `toJson()`).
- Tipos exportados: `LoggerObjectInterface`, `LoggerStringInterface`, `LoggerObjectRequestInterface`, `LoggerRequestStringInterface`, `LoggerRequestStringInterfaceOmit`, `GitLoggerInterface`, `ExceptionObjectLoggerInterface`.
- `LogLevel` e `LoggerParserInterface` vêm de `@odg/log`; `RequestInterface` / `ResponseInterface` de `@odg/message` aparecem nos tipos de request.

## 🚦 Rules (Usage)

- Registrar `JSONLoggerPlugin` **antes** de `RequestStringPlugin` na cadeia de plugins do logger; caso contrário `RequestStringPlugin` falha por desenho.
- `JSONLoggerPlugin` preenche `git` via comandos `git` em ambiente Node se `setGitRelease` / `setGitBranch` não tiverem sido usados (release/branch podem ficar vazios se o comando falhar ou não for Node).
- Cadeia de exceções anteriores (`exceptionPrevious`) só é preenchida se a mensagem for instância de `Exception` (`@odg/exception`), até `maxExceptionPrevious` (padrão 10).
- Campos de request cujo nome começa com `$` são omitidos ao montar o objeto de request no plugin JSON.

## 💥 Exceptions

- `JSONParserException` (estende `UnknownException` / `@odg/exception`): lançada por `RequestStringPlugin.parser` quando `message` não é `JSONLogger` — corrigir ordem dos plugins ou garantir que a mensagem já passou pelo `JSONLoggerPlugin`.
- `JSONParserUnknownException` (estende `UnknownException`): lançada pelos `parser` de ambos os plugins quando qualquer outro erro ocorre dentro do `try` — tratar como falha inesperada no pipeline; causa original encadeada conforme `UnknownException`.

## ⚠️ Integration Pitfalls

- `JSONLoggerPlugin.getInstance()` em Node usa `instanceId` se definido; senão `HOSTNAME`, `CONTAINER_ID` ou `DOCKER_CONTAINER_UUID`; fora de Node resulta `"unknown"`.
- Mensagens `ODGMessage` ou objetos com `url` + `method` alteram o texto de `message` e o bloco `request` em relação a valores primitivos ou `Error` puros.
- `logJSON` chamado diretamente não envolve erros em `JSONParserUnknownException` (apenas `parser` faz o `try/catch`); preferir o fluxo via `parser` do logger se quiser o mesmo mapeamento de erros.
