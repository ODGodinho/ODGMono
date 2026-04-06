## @odg/log - Consumer Guide

## 🎯 Purpose

- Contratos TypeScript e enum de níveis para logging assíncrono.
- Classe base `AbstractLogger`, implementações `NullLogger` e `ConsoleLogger`, compositor `Logger` (handlers + processors).
- Tipo `JSONLogFormattable` e guarda `isJSONLogFormattable` para reconhecer payloads estruturados.

## 📜 Contracts

- `LogLevel` / `LogLevelType`: níveis `emergency` … `debug` (strings).
- `LoggerInterface`: métodos por nível + `log(level, message, context?)`; `ContextType` = `Record<string, unknown> | undefined` (exportado).
- `LoggerAwareInterface`: `logger?` e `setLogger(LoggerInterface)`.
- `LoggerPluginInterface`: `parser(data: LoggerParserInterface)` → `Promise<Omit<LoggerParserInterface, "original">>`; `LoggerParserInterface` inclui `original`, `level`, `message`, `context?`.
- `AbstractLogger`: implementa `LoggerInterface` com assinaturas que, nos artefatos `.d.ts`, usam `context?: Record<string, string>` (não `ContextType`).
- `Logger`: `pushHandler` / `getHandlers`, `pushProcessor` / `getProcessor`, `log` delega a todos os handlers após processors.
- `NullLogger`: `log` vazio.
- `ConsoleLogger`: escreve no console com rótulo por nível; se `isJSONLogFormattable(message)`, formatação alternativa do conteúdo.
- `JSONLogFormattable`: campos opcionais `request`, `exception`; `type` é `LogLevel`.

## 🚦 Rules (Usage)

- Preferir `await` em todas as chamadas de log (API inteira é `Promise<void>`).
- Ao estender `AbstractLogger`, implementar apenas `log(level, message, context?)`.
- Em `Logger`, registrar handlers antes de emitir; ordem dos `pushProcessor` define o pipeline.
- Processors devem cumprir `LoggerPluginInterface`: retorno assíncrono sem o campo `original`, encadeável entre si e com os handlers registrados.

## 💥 Exceptions

- Nenhum método das classes exportadas neste pacote lança exceção documentada; falhas vêm de dependências ou de código do consumidor em plugins/handlers customizados.

## ⚠️ Integration Pitfalls

- `isJSONLogFormattable` valida só `index`, `instance` e `message` como strings; não garante `type`, `createdAt` nem subestruturas — não assumir payload completo só pelo guard.
- `Logger.log` executa handlers em paralelo (`Promise.all`); falha em um handler rejeita a promessa inteira.
- `ConsoleLogger` depende de `console.log` e de `chalk` para cores; adequado a dev, não a políticas de produção sem avaliação própria.
