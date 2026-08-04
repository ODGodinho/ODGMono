## @odg/graylog - Consumer Guide

## 🎯 Purpose

- Implementação `LoggerInterface` (`@odg/log`) que envia logs GELF para Graylog via `gelf-pro`.
- Opções de conexão (`GraylogOptionsInterface`) e logger concreto `GraylogLogger`.
- Erros de domínio do pacote: `GraylogException` (estende `@odg/exception`).

## 📜 Contracts

- `GraylogOptionsInterface`: `host` obrigatório; `port?` (padrão documentado na interface: 12201); `timeout?` (ms); `protocol?` `"udp4" | "udp6"`; `flatDepthLevel?` (profundidade do achatamento de campos, padrão 3 na implementação).
- `GraylogLogger`: `constructor(options: GraylogOptionsInterface)`; `init(): Promise<void>` configura `gelf-pro` e carrega o pacote `flat` (import dinâmico).
- `log(level, message, context?)` implementado com `message` tipado como `JSONLoggerString` (`@odg/json-log`); demais níveis vêm de `AbstractLogger` e delegam para `log`.
- `GraylogException`: subclasse de `Exception` sem campos extras.

## 🚦 Rules (Usage)

- Chamar `await init()` antes de qualquer método de log; caso contrário o envio não ocorre.
- Preencher `host` (e ajustar `port`/`protocol` se o servidor não usar UDP padrão).
- Mensagens estruturadas devem ser compatíveis com o modelo esperado por `JSONLoggerString` ao usar `log` diretamente.
- `flatDepthLevel` limita aninhamento ao achatar o payload enviado ao Graylog.

## 💥 Exceptions

- `throw new GraylogException("Graylog init not executed")` se `log`/`emergency`/… forem chamados sem `init` concluído — tratar como pré-condição violada (fluxo de inicialização).
- A promessa retornada por `log` (e pelos métodos herdados) pode **rejeitar** com instância de `Exception` (`Exception.parse` no erro do GELF) quando o callback de envio recebe erro — tratar como falha de rede/servidor ou configuração.

## ⚠️ Integration Pitfalls

- `init` faz `import("flat")` assíncrono: em ambientes restritos (bundlers, workers), garantir resolução do módulo `flat`.
- Campos `createdAt` e `message` do objeto de log são removidos antes do achatamento enviado ao GELF.
- Título do GELF deriva de `exception.message`, `request.url` ou `util.format(message.message)` — depende da forma do `JSONLoggerString`.
