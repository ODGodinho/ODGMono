# @odg/json-log - Consumer Guide

To understand the standard structure of all logs, refer to the contract for the `./dist/Interfaces/LoggerObjectInterface.ts`

## 🎯 Purpose

- Plugin `LoggerPluginInterface` (`@odg/log`) transform a log message into a structured object (`JSONLogger`) and, optionally, into `JSONLoggerString` (request serialized into strings).
- Type models for the log payload (`LoggerObjectInterface` and derivatives) and parsing exceptions (`JSONParserException`, `JSONParserUnknownException`).

## 📜 Contracts

- `JSONLoggerPlugin(appName, maxExceptionPrevious?, instanceId?)`: `parser` replaces `message` with `JSONLogger`; `logJSON(level, message)` builds the same object; setters `setIdentifier`, `setInstance`, `setGitRelease`, `setGitBranch`.
- Exported types: `LoggerObjectInterface`, `LoggerStringInterface`, `LoggerObjectRequestInterface`, `LoggerRequestStringInterface`, `LoggerRequestStringInterfaceOmit`, `GitLoggerInterface`, `ExceptionObjectLoggerInterface`.

## Rules

- register `JSONLoggerPlugin` **before** `RequestStringPlugin` in the logger's plugin chain; otherwise `RequestStringPlugin` fails by design.
- `JSONLoggerPlugin` fills `git` via `git` commands in Node environment if `setGitRelease` / `setGitBranch` have not been used (release/branch may be empty if the command fails or is not Node).
- Request fields whose name starts with `$` are omitted when building the request object. `@odg/axios` **preserves** those same `$`-prefixed keys — the two halves of this contract must stay in sync.
- `exceptionPrevious` is only filled when the message is an instance of `Exception` (`@odg/exception`), up to `maxExceptionPrevious` (default 10).

## 💥 Exceptions

- `JSONParserException` (extends `UnknownException` / `@odg/exception`): thrown by `RequestStringPlugin.parser` when `message` is not `JSONLogger` — fix the plugin order or ensure the message has already passed through `JSONLoggerPlugin`.
- `JSONParserUnknownException` (extends `UnknownException`): thrown by the `parser` of both plugins when any other error occurs inside the `try` — treat as an unexpected failure in the pipeline; original cause chained according to `UnknownException`.

## ⚠️ Integration Pitfalls

- `JSONLoggerPlugin.getInstance()` in Node uses `instanceId` if defined; otherwise `HOSTNAME`, `CONTAINER_ID` or `DOCKER_CONTAINER_UUID`; outside Node results in `"unknown"`.
- `ODGMessage` messages or objects with `url` + `method` alter the `message` text and the `request` block compared to primitive values or pure `Error`s.
- Calling `logJSON` directly does not involve errors in `JSONParserUnknownException` (only `parser` does the `try/catch`); prefer the flow via the logger's `parser` if you want the same error mapping.
