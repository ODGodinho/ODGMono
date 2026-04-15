## @odg/chemical-x - Consumer Guide

## 🎯 Purpose

- Framework TypeScript para automação web (scraping, crawling) com abstração sobre Puppeteer/Playwright, retry com lifecycle hooks e DSL baseada em decorators.
- Helpers utilitários (`retry`, `sleep`, `timeout`, `throwIf`) para controle de fluxo assíncrono com tratamento de erros tipado.
- Arquitetura Page/Handler: Pages executam ações por **intenção** (não por URL); Handlers validam transições e declaram soluções ou exceções.

## 🚀 Quick Start

```typescript
// Helpers — sem browser driver necessário
import { retry, sleep, timeout, throwIf, RetryAction } from "@odg/chemical-x";

const result = await retry({
    times: 3,
    sleep: 1000,
    callback: async (attempt) => { /* operação retriable */ },
});

// Crawler — requer Puppeteer ou Playwright instalado
import { BrowserManager, BasePage, BaseHandler, Container } from "@odg/chemical-x";
```

## 📜 Quick API Reference

**Helpers** — Controle de fluxo assíncrono:

| Função | Propósito |
|---|---|
| `retry(options)` | Retenta callback N vezes com sleep, abort signal e callback `when` para decidir ação por tentativa |
| `sleep(ms, options?)` | Pausa assíncrona com suporte a `AbortSignal` |
| `timeout(options)` | Envolve callback com limite de tempo; lança `TimeoutException` se exceder |
| `throwIf(condition, exception)` | Lança exceção condicionalmente; tipagem `never` quando `condition: true` |

📖 See also: [docs/helpers.md](docs/helpers.md)

**Decorators** — DSL para classes:

| Decorator | Propósito |
|---|---|
| `@ODGDecorators.attemptableFlow()` | Retry a nível de classe com lifecycle hooks (`attempt`, `sleep`, `success`, `failure`, `retrying`, `finish`) |
| `@ODGDecorators.getterAccess()` | Proxy que intercepta todo acesso a propriedades via `__get(key, value)` |
| `@ODGDecorators.injectable(name, scope?)` | Registra classe no Container (Inversify) |
| `@ODGDecorators.registerListener(event, container, options)` | Registra listener de eventos em Container EventEmitter |

📖 See also: [docs/decorators.md](docs/decorators.md)

**Crawler** — Automação web:

| Classe | Propósito |
|---|---|
| `BrowserManager` | Orquestrador: cria instâncias de Browser e Context via factories injetadas |
| `Browser` | Wrapper com `@ODGDecorators.getterAccess()` sobre engine do browser; gerencia Contexts |
| `Context` | Wrapper sobre contexto do browser; gerencia Pages |
| `Page` | Wrapper sobre page do browser com acesso ao Context pai |
| `BasePage` (abstract) | Define uma página por intenção; implementa `execute()` + `attempt()` + seletores `$s`/`$$s` |
| `BaseHandler` (abstract) | Valida transições; implementa `waitForHandler()` + `attempt()`; declara Solution ou Exception |

📖 See also: [docs/crawlers.md](docs/crawlers.md)

**Support** — Utilidades tipadas:

| Classe | Propósito |
|---|---|
| `Str` | Manipulação de string: extração monetária (`money()`, `moneys()`), `onlyNumbers()`, `ucFirst()`, `isJson()`, `formatUnicorn()` |
| `Num` | Wrapper numérico com `toNative()` e `clone()` |
| `Arr<Type>` | Wrapper de array com `random(length?)` e `clone()` |
| `File` | Verificação de existência de arquivo via `exists()` |

**Enums:**

| Enum | Valores |
|---|---|
| `RetryAction` | `Retry` (forçar retry), `Throw` (lançar), `Resolve` (resolver com undefined), `Default` (seguir `times`) |

**Container:**

- `Container<T>` estende `TypedContainer` (Inversify); adiciona `getOptional(name)` que retorna `undefined` se não registrado.

## 🚦 Key Rules

1. **`@attemptableFlow` vs `retry()`**: Use `@attemptableFlow` para retry a nível de classe com lifecycle hooks completo (attempt, success, failure, retrying, finish, sleep). Use `retry()` para retentativa simples de um callback isolado.
   📖 See also: [docs/decorators.md](docs/decorators.md)

2. **`@getterAccess` — Proxy total**: Todo acesso a propriedade/método passa por `__get(key, value)`. Implementações de Browser, Context e Page usam isso para delegar ao engine subjacente.
   📖 See also: [docs/decorators.md](docs/decorators.md)

3. **Page Intent Design**: Pages agrupam por **intenção**, não por URL. Uma mesma URL pode ter múltiplas Pages (ex: `LoginPage` para autenticar, `HomeVerificationPage` para validar conteúdo).
   📖 See also: [docs/crawlers.md](docs/crawlers.md)

4. **Handler Validation Contract**: Handlers **validam**, não executam. `waitForHandler()` retorna `Exception` ou `() => Promise<HandlerSolutionType>`. O handler declara Solution (próxima Page) ou lança Exception. Nunca falha silenciosamente.
   📖 See also: [docs/crawlers.md](docs/crawlers.md)

5. **Container.loadModule() obrigatório**: Classes com `@ODGDecorators.injectable` precisam de `Container.loadModule()` antes da execução. DI binding é responsabilidade do consumidor.
   📖 See also: [docs/crawlers.md](docs/crawlers.md)

6. **`retry()` com `when` callback**: O callback `when(exception, times)` retorna `RetryAction` para decidir por tentativa: `Retry` (forçar), `Throw` (parar), `Resolve` (resolver com `undefined`), `Default` (seguir contagem `times`).
   📖 See also: [docs/helpers.md](docs/helpers.md)

7. **Seletores `$s` e `$$s` em Pages/Handlers**: `$s` define seletor único da página; `$$s` define mapa nomeado de seletores (`Record<string, SelectorType>`). Ambos são `abstract readonly` em `BasePage`/`BaseHandler`.
   📖 See also: [docs/crawlers.md](docs/crawlers.md)

8. **`AttemptableInterface` — contrato base**: Tanto `BasePage` quanto `BaseHandler` implementam `AttemptableInterface`. Hooks opcionais: `success()`, `failure(exception)`, `retrying(exception, attempt)`, `finish(exception?)`, `sleep()`. Obrigatórios: `execute()`, `attempt()`.
   📖 See also: [docs/decorators.md](docs/decorators.md)

## 💥 Critical Exceptions

| Exception | Quando é lançada | Handling |
|---|---|---|
| `BrowserException` | Falha em operação do browser em runtime (crash, perda de conexão) | Catch e retry ou fallback |
| `BrowserInstanceException` | Falha ao criar/inicializar instância do browser (extends `BrowserException`) | Verificar setup do driver, retry init |
| `RetryException` | Todas as tentativas de `retry()` esgotadas sem sucesso | Fallback final ou propagar erro |
| `TimeoutException` | Operação excede o limite de `timeout()` | Catch e tratar timeout; ajustar limite se válido |
| `InvalidArgumentException` | Parâmetros inválidos (ex: `times < 1`, timeout negativo) | Validar inputs antes de chamar API |
| `MoneyNotFoundException` | `Str.money()` não encontra valor monetário na string | Verificar formato da string antes |
| `MoneyMultipleResultException` | `Str.money()` encontra múltiplos valores; use `Str.moneys()` | Usar `moneys()` para múltiplos valores |

📖 See also: [docs/exceptions.md](docs/exceptions.md) para referência completa com exemplos de try-catch.

## ⚠️ Integration Pitfalls

1. **Node 24+ obrigatório**: `engines.node >= 24.0` no package.json; versões anteriores não são suportadas.
2. **Puppeteer/Playwright NÃO incluído**: Crawler APIs requerem driver de browser, mas o consumidor **deve instalar separadamente**. Helpers e Decorators funcionam sem driver.
3. **DI é responsabilidade do consumidor**: Chemical-X usa Inversify mas **não auto-wira**. Consumidor deve registrar bindings e chamar `Container.loadModule()`.
4. **Driver não é auto-selecionado**: Consumer configura qual driver usar via binding no Container ou construtor do `BrowserManager`. Puppeteer e Playwright são intercambiáveis via configuração.
5. **`Container.loadModule()` antes de executar**: Sem essa chamada, classes registradas com `@ODGDecorators.injectable` não estarão disponíveis no container.
6. **Pages por intenção, não por URL**: Não assuma 1:1 entre URL e Page. Modele Pages pela responsabilidade/ação desejada.
7. **Handlers não agem — validam**: Handler nunca deve interagir com a page diretamente nem chamar outras Pages. Declara Solution ou lança Exception.
8. **Dependências de runtime**: `@odg/exception`, `inversify` e `@inversifyjs/binding-decorators` são dependências obrigatórias em runtime.
9. **Ordem decorators**: `@ODGDecorators.injectable()` deve ser o primeiro decorator, ficando a cima de todos os demais para evitar criar container sem os demais decorators registrados.

## 📖 Detailed Documentation

| Documento | Conteúdo |
|---|---|
| [docs/helpers.md](docs/helpers.md) | Guia completo de `retry()`, `sleep()`, `timeout()`, `throwIf()` com padrões de uso |
| [docs/crawlers.md](docs/crawlers.md) | Arquitetura Crawler: BrowserManager, Pages, Handlers, Container/DI, workflow examples |
| [docs/decorators.md](docs/decorators.md) | `@ODGDecorators.attemptableFlow`, `@ODGDecorators.getterAccess`, `@ODGDecorators.injectable` com lifecycle e exemplos |
| [docs/exceptions.md](docs/exceptions.md) | Referência completa de exceções com trigger, handling e exemplos |

## 🔗 Interfaces Públicas

| Interface | Propósito |
|---|---|
| `AttemptableInterface` | Contrato base para Pages e Handlers: `execute()`, `attempt()`, hooks opcionais |
| `PageInterface` | Extends `AttemptableInterface`; contrato para `BasePage` |
| `HandlerInterface` | Extends `AttemptableInterface`; adiciona `waitForHandler()` |
| `GetterAccessInterface` | Define `__get(key, value)` para classes com `@getterAccess` |
| `CloneableInterface` | Define `clone()` para Support utilities (`Str`, `Num`, `Arr`) |
| `NativeInterface<Type>` | Define `toNative()` para conversão ao tipo primitivo |
| `RetryOptionsInterface` | Parâmetros de `retry()`: `times`, `sleep`, `callback`, `signal` |
| `TimeoutOptionsInterface` | Parâmetros de `timeout()`: `name`, `timeout`, `callback` |

## 🔍 Entry Points

- **Main**: `import { retry, sleep, BrowserManager, BasePage, ... } from "@odg/chemical-x"`
- **Container only**: `import { Container } from "@odg/chemical-x/container"`
