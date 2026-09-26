# @odg/log - Consumer Guide

## 🎯 Purpose

- IoC/DI contracts for loggers with pluggable handlers and processors.
- Base class `AbstractLogger`, and helpers `NullLogger`, `ConsoleLogger`, composite `Logger` (handlers + processors).

## 📜 Contracts

- `LogLevel` / `LogLevelType`: níveis `emergency` … `debug` (strings).
- `LoggerInterface`: métodos por nível + `log(level, message, context?)`; `ContextType` = `Record<string, unknown> | undefined` (exportado).
- `LoggerAwareInterface`: `logger?` e `setLogger(LoggerInterface)`.
- `LoggerPluginInterface`: `parser(data: LoggerParserInterface)` → `Promise<Omit<LoggerParserInterface, "original">>`; `LoggerParserInterface` inclui `original`, `level`, `message`, `context?`.
- `AbstractLogger`: implementa `LoggerInterface` com assinaturas que, nos artefatos `.d.ts`, usam `context?: Record<string, string>` (não `ContextType`).
- `Logger`: `pushHandler` / `getHandlers`, `pushProcessor` / `getProcessor`, `log` delega a todos os handlers após processors.
- `Logger(options?)`: `new Logger()` como sempre; `new Logger({ scopes })` recebe um `AsyncLocalStorage` (tipado como `LoggerScopeStorageInterface`, sem o pacote importar `node:`) e liga o contexto por unidade de trabalho.
- `Logger.withContext(context)`: como o `Log::withContext` do Laravel — mesclado no `context` (terceiro parâmetro) de toda chamada seguinte, antes dos processors e handlers. Dentro de um `scope` vale só para aquele escopo; fora de qualquer escopo (boot, browser, robô sem `scopes`) vale para o logger inteiro. Chamar de novo mescla; chave passada na própria chamada vence. `getContext()` devolve o contexto que a próxima chamada levaria. Sem nada adicionado, o `context` chega aos handlers exatamente como a chamada passou.
- `Logger.scope(callback)`: abre uma unidade de trabalho (request, job). O que `withContext` acrescenta dentro dela, e dentro de tudo que ela aguarda, some quando ela termina — não há limpeza a fazer. Escopo dentro de escopo herda o de fora, e o que acrescenta não volta. Lança `Exception` se o logger foi criado sem `scopes`.
- `NullLogger`: `log` vazio.
- `ConsoleLogger`: escreve no console com rótulo por nível; se `isJSONLogFormattable(message)`, formatação alternativa do conteúdo.
- `JSONLogFormattable`: campos opcionais `request`, `exception`; `type` é `LogLevel`.

## Rules

- Preferir `await` em todas as chamadas de log (API inteira é `Promise<void>`).
- Ao estender `AbstractLogger`, implementar apenas `log(level, message, context?)`.
- Em `Logger`, registrar handlers antes de emitir; ordem dos `pushProcessor` define o pipeline.
- Processors devem cumprir `LoggerPluginInterface`: retorno assíncrono sem o campo `original`, encadeável entre si e com os handlers registrados.

## 💥 Exceptions

- `Logger.scope` lança `Exception` quando o logger foi criado sem `scopes`. Nenhum outro método lança exceção documentada; falhas vêm de dependências ou de código do consumidor em plugins/handlers customizados.

## ⚠️ Integration Pitfalls

- `isJSONLogFormattable` valida só `index`, `instance` e `message` como strings; não garante `type`, `createdAt` nem subestruturas — não assumir payload completo só pelo guard.
- `Logger.log` executa handlers em paralelo (`Promise.all`); falha em um handler rejeita a promessa inteira.
- `ConsoleLogger` depende de `console.log` e de `ansis` para cores; adequado a dev, não a políticas de produção sem avaliação própria.
- `ConsoleLogger` ignora o `context`, inclusive o que vem de `withContext`: o contexto só aparece nos handlers que o usam (o `GraylogLogger` o envia como campos da mensagem).
- Servidor que atende várias requests ao mesmo tempo precisa de `new Logger({ scopes: new AsyncLocalStorage() })` e de um `scope()` por request no ponto de entrada; sem isso, `withContext` chamado numa request vale para todas as seguintes.
- O escopo segue a cadeia assíncrona: callback de um `EventEmitter` compartilhado roda no escopo de quem emitiu, e código que nasceu fora de qualquer request (um timer criado no boot) não tem escopo. Trabalho deixado pendente pela request (um `setInterval`, uma promise que nunca resolve) segura o contexto dela até terminar.
