## Chemical-X Exceptions - Reference Guide

Referência completa de todas as exceções públicas. Todas estendem `Exception` de `@odg/exception`.

```typescript
import {
    BrowserException,
    BrowserInstanceException,
    RetryException,
    TimeoutException,
    InvalidArgumentException,
    MoneyNotFoundException,
    MoneyMultipleResultException,
} from "@odg/chemical-x";
```

---

### Exception Reference

#### `BrowserException`

| | |
|---|---|
| **Trigger** | Falha em operação do browser em runtime (crash, perda de conexão, operação inválida) |
| **Quando** | Interações com Page/Browser via Crawler API (click, type, goto, etc.) |
| **Extends** | `Exception` (`@odg/exception`) |
| **Handling** | Catch e retry (via `@attemptableFlow`) ou fallback |

```typescript
try {
    await page.execute();
} catch (exception) {
    if (exception instanceof BrowserException) {
        // Browser crashed ou conexão perdida — retry ou fallback
    }
}
```

---

#### `BrowserInstanceException`

| | |
|---|---|
| **Trigger** | Falha ao criar/inicializar instância do browser |
| **Quando** | `BrowserManager.newBrowser()` ou `BrowserManager.newPersistentContext()` |
| **Extends** | `BrowserException` |
| **Handling** | Verificar setup do driver (Puppeteer/Playwright instalado?), retry init |

```typescript
try {
    const browser = await manager.newBrowser(() => puppeteer.launch());
} catch (exception) {
    if (exception instanceof BrowserInstanceException) {
        // Driver não encontrado ou falha ao iniciar — verificar instalação
    }
}
```

---

#### `RetryException`

| | |
|---|---|
| **Trigger** | Todas as tentativas de `retry()` esgotadas sem sucesso |
| **Quando** | `retry()` completa todos os `times` sem callback suceder |
| **Extends** | `Exception` (`@odg/exception`) |
| **Handling** | Fallback final ou propagar erro ao chamador |

```typescript
try {
    await retry({ times: 3, callback: async () => { /* ... */ } });
} catch (exception) {
    if (exception instanceof RetryException) {
        // Todas tentativas falharam — aplicar fallback ou logar erro final
    }
}
```

---

#### `TimeoutException`

| | |
|---|---|
| **Trigger** | Operação excede o limite de tempo definido em `timeout()` |
| **Quando** | `timeout({ timeout: ms, callback })` quando callback não completa a tempo |
| **Extends** | `Exception` (`@odg/exception`) |
| **Handling** | Catch e tratar timeout; ajustar limite se operação legitimamente lenta |

```typescript
try {
    await timeout({
        name: "loadPage",
        timeout: 5000,
        callback: async () => await page.goto(url),
    });
} catch (exception) {
    if (exception instanceof TimeoutException) {
        // Operação "loadPage" excedeu 5000ms — retry ou aumentar limite
    }
}
```

---

#### `InvalidArgumentException`

| | |
|---|---|
| **Trigger** | Parâmetros inválidos passados para API |
| **Quando** | `retry({ times: -1 })`, timeout negativo, argumento obrigatório ausente |
| **Extends** | `Exception` (`@odg/exception`) |
| **Handling** | Validar inputs antes de chamar API; este é um erro de programação |

```typescript
// Este erro indica bug no código do consumidor:
try {
    await retry({ times: 0, callback: async () => {} });
} catch (exception) {
    if (exception instanceof InvalidArgumentException) {
        // Corrigir: times deve ser >= 1
    }
}
```

---

#### `MoneyNotFoundException`

| | |
|---|---|
| **Trigger** | `Str.money()` não encontra valor monetário na string |
| **Quando** | `new Str("texto sem valor").money()` |
| **Extends** | `Exception` (`@odg/exception`) |
| **Handling** | Verificar formato da string antes; usar try-catch ou validar conteúdo |

```typescript
try {
    const value = new Str(rawText).money();
} catch (exception) {
    if (exception instanceof MoneyNotFoundException) {
        // String não contém valor monetário reconhecível
    }
}
```

---

#### `MoneyMultipleResultException`

| | |
|---|---|
| **Trigger** | `Str.money()` encontra múltiplos valores monetários na string |
| **Quando** | `new Str("R$ 10,00 e R$ 20,00").money()` — use `moneys()` |
| **Extends** | `Exception` (`@odg/exception`) |
| **Handling** | Usar `Str.moneys()` para extrair todos os valores; `money()` espera exatamente um |

```typescript
try {
    const value = new Str("R$ 10,00 e R$ 20,00").money();
} catch (exception) {
    if (exception instanceof MoneyMultipleResultException) {
        // Múltiplos valores encontrados — usar moneys() em vez de money()
        const values = new Str("R$ 10,00 e R$ 20,00").moneys();
    }
}
```

---

### Handler Exception/Solution Contract

`BaseHandler.waitForHandler()` retorna `HandlerFunction`:

```typescript
type HandlerSolutionType = Exception | Exclude<RetryAction, RetryAction.Default | RetryAction.Throw>;
type HandlerFunction = Exception | (() => Promise<HandlerSolutionType>);
```

**Contrato:**

1. Handler **deve** retornar `Exception` (falha) ou `() => Promise<HandlerSolutionType>` (solução)
2. Handler **nunca** falha silenciosamente (retornar `void`/`undefined` não permitido)
3. Solution function retorna:
   - `RetryAction.Resolve` — sucesso (via `successSolution()`)
   - `RetryAction.Retry` — retentar
   - `Exception` — falha específica detectada na validação

**Exemplo — Handler com contrato completo:**

```typescript
async waitForHandler(): Promise<HandlerFunction> {
    // Espera seletores e decide
    const errorVisible = await this.page!.$(this.$$s.error);
    if (errorVisible) {
        return new BrowserException("Login failed: error message visible");
    }

    const dashboardVisible = await this.page!.$(this.$$s.dashboard);
    if (dashboardVisible) {
        return async () => this.successSolution(); // RetryAction.Resolve
    }

    // Estado intermediário — retentar
    return async () => RetryAction.Retry;
}
```

See also: `tests/vitest/Exceptions/` e `tests/vitest/Handlers/` para exemplos de teste.
