## Chemical-X Decorators - @ODGDecorators.attemptableFlow, @ODGDecorators.getterAccess, @ODGDecorators.injectable

DSL baseada em decorators para retry com lifecycle, interceptação de acesso e DI registration.

```typescript
import { ODGDecorators } from "@odg/chemical-x";
```

---

### `@ODGDecorators.attemptableFlow()`

Decorator de classe que adiciona retry com lifecycle hooks completo. Envolve `execute()` com lógica de retentativa baseada em `AttemptableInterface`.

**Aplicação:**

```typescript
@ODGDecorators.attemptableFlow()
class MyPage extends BasePage<PageEngine> {
    // ...
}
```

**Lifecycle Hooks:**

| Hook | Obrigatório | Quando chamado |
|---|---|---|
| `execute()` | Sim | Ação principal; retentada até `attempt()` vezes |
| `attempt()` | Sim | Retorna número máximo de tentativas |
| `sleep()` | Não | Retorna ms entre tentativas (se definido) |
| `success()` | Não | Chamado quando `execute()` sucede |
| `failure(exception)` | Não | Chamado quando todas tentativas falham; recebe a última exceção |
| `retrying(exception, attempt)` | Não | Chamado antes de cada retry; retorna `RetryAction` para decidir ação |
| `finish(exception?)` | Não | Chamado sempre ao final (sucesso ou falha); recebe exceção se houve |

**Propriedade:**

- `currentAttempt: number` — número da tentativa atual (atualizado automaticamente pelo decorator)

**Fluxo de Execução:**

```
execute() chamado
  ├─ Sucesso → success() → finish()
  └─ Falha → retrying(exception, attempt)?
               ├─ RetryAction.Retry → execute() novamente
               ├─ RetryAction.Throw → failure(exception) → finish(exception)
               ├─ RetryAction.Resolve → finish() (sem exceção, resolve undefined)
               └─ RetryAction.Default → se attempts restam → sleep() → execute()
                                         └─ se esgotou → failure(exception) → finish(exception)
```

**Exemplo:**

```typescript
@ODGDecorators.attemptableFlow()
class LoginPage extends BasePage<PuppeteerPage> {
    readonly $s = "form#login";
    readonly $$s = {
        username: "input[name=username]",
        password: "input[name=password]",
        submit: "button[type=submit]",
    };

    async attempt(): Promise<number> {
        return 3;
    }

    async execute(): Promise<void> {
        await this.page!.type(this.$$s.username, "user@example.com");
        await this.page!.type(this.$$s.password, "password123");
        await this.page!.click(this.$$s.submit);
    }

    async sleep(): Promise<number> {
        return 2000; // 2s entre tentativas
    }

    async success(): Promise<void> {
        console.log("Login successful");
    }

    async failure(exception: Exception): Promise<void> {
        console.error("Login failed after all attempts:", exception.message);
    }

    async retrying(exception: Exception, attempt: number): Promise<RetryAction> {
        if (exception instanceof BrowserException) return RetryAction.Throw;
        return RetryAction.Default;
    }
}
```

See also: `tests/vitest/Pages/` para exemplos de Pages com `@attemptableFlow`.

---

### `@ODGDecorators.getterAccess()`

Decorator de classe que cria um Proxy interceptando **todo** acesso a propriedade/método via `__get(key, value)`.

**Aplicação:**

```typescript
@ODGDecorators.getterAccess()
class MyWrapper implements GetterAccessInterface {
    __get(key: PropertyKey, value: unknown): unknown {
        // Intercepta todo acesso
        return value;
    }
}
```

**Comportamento do Proxy:**

- **Todo** acesso a propriedade (leitura) passa por `__get(key, value)` onde:
  - `key` = nome da propriedade acessada
  - `value` = valor original da propriedade (se existir)
- Permite: delegação transparente ao engine, validação, lazy-load, tracking, logging

**Uso interno no Chemical-X:**

`Browser`, `Context` e `Page` usam `@getterAccess` para delegar ao engine nativo:

```typescript
@ODGDecorators.getterAccess()
class Browser<BrowserClassEngine, ...> implements GetterAccessInterface {
    $browserInstance: BrowserClassEngine;

    __get(key: PropertyKey): unknown {
        // Delega ao engine nativo (Puppeteer/Playwright)
        return (this.$browserInstance as Record<PropertyKey, unknown>)[key];
    }
}
```

Isso permite:
```typescript
const browser = await manager.newBrowser(() => puppeteer.launch());
// Acessa métodos nativos do Puppeteer diretamente no wrapper:
await browser.close(); // Delegado via __get → puppeteerBrowser.close()
```

See also: `tests/vitest/puppeteer/` e `tests/vitest/playwright/` para exemplos de uso com drivers reais.

---

### `@ODGDecorators.injectable(name, scope?)`

Registra classe no Container (Inversify) com `@injectable()` e `@injectFromHierarchy()`.

**Aplicação:**

```typescript
@ODGDecorators.injectable("LoginPage")
@ODGDecorators.attemptableFlow()
class LoginPage extends BasePage<PageEngine> {
    // ...
}
```

**Regras:**

1. Define metadata para DI — **não registra automaticamente no Container**
2. Consumer **deve** chamar `Container.loadModule()` para efetivar os bindings
3. Combinado com `@attemptableFlow` em Pages e Handlers
4. O `name` é usado como identificador do binding no Container
5. Deve sempre ficar a cima de todos os outros decorators (ex: `@attemptableFlow`) para garantir que a classe seja registrada apos de ser processada por outros decorators

---

### `@registerListener(eventName, containerName, options)`

Registra listener de eventos em Container EventEmitter via metadata.

**Aplicação:**

```typescript
@ODGDecorators.registerListener("page:loaded", "PageEventEmitter", { once: true })
class PageLoadedListener {
    // ...
}
```

---

### Comparison - When to Use

| Cenário | Ferramenta | Motivo |
|---|---|---|
| Retry simples de callback | `retry()` | Função isolada, sem lifecycle, sem estado |
| Retry de classe inteira com hooks | `@ODGDecorators.attemptableFlow` | Lifecycle completo: attempt, success, failure, retrying, finish, sleep |
| Interceptar propriedades | `@ODGDecorators.getterAccess` | Proxy transparente para delegação/validação |
| Registrar no Container | `@ODGDecorators.injectable` | DI via Inversify com hierarchy |
| Callback com timeout | `timeout()` | Sem retry, apenas limite de tempo |
| Classe retriable com timeout | `@ODGDecorators.attemptableFlow` + `timeout()` no `execute()` | Combine ambos para retry + timeout |

**Regra geral:**
- Use `retry()` quando quer retentar **uma função**
- Use `@ODGDecorators.attemptableFlow` quando quer retentar **um comportamento de classe** com estado e lifecycle

---

### Common Patterns

**@ODGDecorators.attemptableFlow com handler e solução:**

```typescript
@ODGDecorators.injectable("LoginHandler")
@ODGDecorators.attemptableFlow()
class LoginHandler extends BaseHandler<PuppeteerPage> {
    readonly $$s = {
        errorMsg: ".error-message",
        dashboard: "#dashboard",
        twoFa: "#two-fa-form",
    };

    async attempt(): Promise<number> {
        return 5;
    }

    async waitForHandler(): Promise<HandlerFunction> {
        // Espera por um dos seletores aparecer na página
        const found = await this.page!.waitForSelector(
            [this.$$s.errorMsg, this.$$s.dashboard, this.$$s.twoFa].join(", "),
        );

        if (found?.matches(this.$$s.errorMsg)) {
            return new BrowserException("Login failed");
        }

        if (found?.matches(this.$$s.twoFa)) {
            return async () => RetryAction.Retry; // Indica que precisa retry (2FA page)
        }

        return async () => this.successSolution(); // RetryAction.Resolve
    }
}
```

**@ODGDecorators.getterAccess para wrapper customizado:**

```typescript
@ODGDecorators.getterAccess()
class CachedPage implements GetterAccessInterface {
    private cache = new Map<PropertyKey, unknown>();
    private wrapped: SomeEngine;

    __get(key: PropertyKey, value: unknown): unknown {
        if (this.cache.has(key)) return this.cache.get(key);
        const result = (this.wrapped as Record<PropertyKey, unknown>)[key];
        this.cache.set(key, result);
        return result;
    }
}
```

See also: `tests/vitest/Handlers/` e `tests/vitest/Listeners/` para exemplos reais.
