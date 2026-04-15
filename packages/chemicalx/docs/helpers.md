## Chemical-X Helpers - Detailed Guide

Funções utilitárias para controle de fluxo assíncrono com tratamento de erros tipado. Não requerem browser driver.

```typescript
import { retry, sleep, timeout, throwIf, RetryAction } from "@odg/chemical-x";
```

---

### `retry(options)`

Retenta um callback N vezes com controle fino sobre sleep, abort e decisão por tentativa.

**Assinatura:**

```typescript
// Quando `when` retorna Default | Retry | Throw (ou não fornecido): retorna ReturnType
async function retry<ReturnType>(options: {
    times: number;
    sleep?: number;
    signal?: AbortSignal;
    callback(attempt: number, signal?: AbortSignal): Promise<ReturnType> | ReturnType;
    when?(exception: Exception, times: number): Promise<RetryAction> | RetryAction;
}): Promise<ReturnType>;

// Quando `when` pode retornar Resolve: retorno inclui undefined
async function retry<ReturnType>(options: {
    times: number;
    sleep?: number;
    signal?: AbortSignal;
    callback(attempt: number, signal?: AbortSignal): Promise<ReturnType> | ReturnType;
    when?(exception: Exception, times: number): Promise<RetryAction> | RetryAction;
}): Promise<ReturnType | undefined>;
```

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `times` | `number` | Sim | Número máximo de tentativas. `InvalidArgumentException` se < 1 |
| `sleep` | `number` | Não | Milissegundos entre tentativas |
| `signal` | `AbortSignal` | Não | Sinal de abort para cancelar retries |
| `callback` | `(attempt, signal?) => T` | Sim | Função a ser retentada. Recebe número da tentativa atual |
| `when` | `(exception, times) => RetryAction` | Não | Decide ação por tentativa: `Retry`, `Throw`, `Resolve`, `Default` |

**Comportamento:**

1. Executa `callback(attempt, signal)` até `times` tentativas
2. Se callback sucede → retorna resultado
3. Se callback falha e `when` está definido → chama `when(exception, remainingTimes)`:
   - `RetryAction.Retry` → retenta imediatamente (ignora `times`)
   - `RetryAction.Throw` → lança exceção imediatamente
   - `RetryAction.Resolve` → resolve com `undefined`
   - `RetryAction.Default` → segue contagem normal de `times`
4. Se todas tentativas esgotam → lança `RetryException`
5. Entre tentativas, aguarda `sleep` ms (se definido)

**Exemplo:**

```typescript
const data = await retry({
    times: 3,
    sleep: 1000,
    callback: async (attempt) => {
        return await fetchData(attempt);
    },
    when: (exception, times) => {
        if (exception instanceof FatalError) return RetryAction.Throw;
        return RetryAction.Default;
    },
});
```

See also: `tests/vitest/helpers/retry.test.ts` para exemplos completos de padrões com retry.

---

### `sleep(milliseconds, options?)`

Pausa assíncrona com suporte a cancelamento via `AbortSignal`.

**Assinatura:**

```typescript
async function sleep(milliseconds: number, options?: { signal?: AbortSignal }): Promise<void>
```

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `milliseconds` | `number` | Sim | Duração da pausa em milissegundos |
| `options.signal` | `AbortSignal` | Não | Sinal para cancelar o sleep antecipadamente |

**Exemplo:**

```typescript
await sleep(2000); // Pausa 2 segundos

// Com abort
const controller = new AbortController();
await sleep(5000, { signal: controller.signal });
```

---

### `timeout(options)`

Envolve uma operação assíncrona com limite de tempo. Lança `TimeoutException` se exceder.

**Assinatura:**

```typescript
async function timeout<ReturnType>(options: {
    name?: string;
    timeout?: number;
    callback(): Promise<ReturnType> | ReturnType;
}): Promise<ReturnType>
```

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `name` | `string` | Não | Nome da operação (incluído na mensagem de `TimeoutException`) |
| `timeout` | `number` | Não | Limite em milissegundos |
| `callback` | `() => T` | Sim | Operação a ser executada com limite de tempo |

**Comportamento:**

- Se callback completa antes do limite → retorna resultado
- Se excede limite → lança `TimeoutException` com nome da operação (se fornecido)

**Exemplo:**

```typescript
const result = await timeout({
    name: "fetchData",
    timeout: 5000,
    callback: async () => {
        return await longRunningOperation();
    },
});
```

See also: `tests/vitest/helpers/timeout.test.ts` para exemplos com timeout.

---

### `throwIf(condition, exception)`

Lança exceção condicionalmente com tipagem estrita — `never` quando condition é `true`.

**Assinatura:**

```typescript
function throwIf(condition: true, exception: () => Exception): never;
function throwIf(condition: false, exception: () => Exception): void;
function throwIf(condition: boolean, exception: () => Exception): never | void;
```

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `condition` | `boolean` | Sim | Se `true`, lança a exceção |
| `exception` | `() => Exception` | Sim | Factory que cria a exceção (lazy — só chamada se `condition: true`) |

**Exemplo:**

```typescript
throwIf(!user, () => new InvalidArgumentException("User is required"));
// Após esta linha, TypeScript sabe que `user` existe (type narrowing via `never`)

throwIf(amount < 0, () => new InvalidArgumentException("Amount must be positive"));
```

See also: `tests/vitest/helpers/throw-if.test.ts` para padrões de validação.

---

### Common Patterns

**Retry com exponential backoff:**

```typescript
let delay = 500;
const result = await retry({
    times: 5,
    sleep: delay,
    callback: async (attempt) => {
        delay = 500 * Math.pow(2, attempt - 1); // 500, 1000, 2000, 4000, 8000
        return await unstableApi();
    },
});
```

**Retry com timeout por tentativa:**

```typescript
const result = await retry({
    times: 3,
    sleep: 1000,
    callback: async (attempt) => {
        return await timeout({
            name: `attempt-${attempt}`,
            timeout: 5000,
            callback: () => fetchData(),
        });
    },
});
```

**Validação com throwIf encadeado:**

```typescript
throwIf(!config.url, () => new InvalidArgumentException("URL is required"));
throwIf(config.timeout < 0, () => new InvalidArgumentException("Timeout must be positive"));
// config agora está validado com tipagem correta
```

See also: `tests/vitest/helpers/` para todos os testes de helpers.
