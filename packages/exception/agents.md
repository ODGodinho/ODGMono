## @odg/exception - Consumer Guide

## 🎯 Purpose

- Classe base `Error` tipada com encadeamento (`previous` interno), `code` opcional e metadado `original`.
- Normalização de valores arbitrários em instâncias de `Exception` via `parse` / `parseOrDefault`.
- Registro global de pós-processadores (`$parsers`) para ajustar o resultado de `parse`, transformando Errors em Exception
- Subclasses prontas: `UnknownException`, `AbortException` (detecção por `name === "AbortError"` em objetos), `InvalidArgumentException`.
- Centraliza todos os erros da aplicação em uma única classe.
- Garante que todos os erros sejam tratados de forma consistente.
- Facilita o tratamento para auditoria e monitoramento de erros.

## 📜 Contracts

- `ParserException`: `(newException: Exception, original: unknown) => Exception`.
- `Exception`: `message: string`; `code?: number | string`; `original?: unknown`; `name` definido no construtor como `constructor.name`.
- Construtor: `new Exception(message, previous?, code?)` — `previous` passa por `Exception.parse` e vira encadeamento acessível por `getPrevious()`.
- `Exception.$parsers`: `Set<ParserException>` compartilhado por todas as chamadas a `parse`.
- `Exception.parse(exception?)`: `undefined` se entrada vazia; devolve `Exception` existente sem clonar; caso contrário cria instância (via heurísticas internas) e aplica cada parser em `$parsers`.
- `Exception.parseOrDefault(exception, message)`: `parse(exception) ?? new UnknownException(message, exception)`.
- `getPrevious()`: `Exception | undefined`.

## 🚦 Rules (Usage)

- Estenda `Exception` (ou use `UnknownException` / `InvalidArgumentException`) para erros de domínio com `name` estável.
- Passe `previous` quando quiser preservar a causa; leia com `getPrevious()`.
- Use `parse` ao receber `unknown` de APIs externas antes de logar ou propagar.
- Use `parseOrDefault` quando precisar garantir uma instância mesmo com entrada vazia/inesperada (segundo parâmetro vira mensagem do fallback `UnknownException`).
- Registre em `$parsers` apenas transformações determinísticas; a ordem de iteração do `Set` importa.

## 💥 Exceptions

- A API estática não declara `throw` no contrato; falhas podem escapar se um callback em `$parsers` lançar.
- `throw new Exception(...)` / subclasses: comportamento usual de `Error` no runtime JS/TS.

## ⚠️ Integration Pitfalls

- `$parsers` é estado global de processo: afeta todos os consumidores do pacote no mesmo runtime (testes paralelos, múltiplos apps no mesmo processo).
- `parse` com objeto plano copia chaves enumeráveis via `for...in` na normalização interna; não espere fidelidade 1:1 para todos os tipos de valor.
