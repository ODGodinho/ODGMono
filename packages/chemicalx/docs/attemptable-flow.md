## Chemical-X — `@ODGDecorators.attemptableFlow()`

Decorator reference: public-surface contract, exact lifecycle order, and traps.
The engine behind it is the [`retry()`](./helpers.md) helper — read both together.

---

### What the decorator does

It replaces the class with a subclass that overrides **`execute()` and nothing else**
(`dist/Support/Decorators/OdgDecorators.d.ts`):

```typescript
public override async execute(): Promise<void> {
    try {
        this.currentAttempt = 1;
        await retry({
            times: await this.attempt(),
            sleep: await this.sleep?.(),
            callback: async (attempt, signal) => {
                this.currentAttempt = attempt;

                return super.execute.call(this, attempt, signal);
            },
            when: this.retrying?.bind(this),
        });

        await this.finish?.();

        return await this.success?.();
    } catch (error: unknown) {
        const exception = UnknownException.parseOrDefault(error, "Page UnknownException");

        await this.finish?.(exception);

        if (this.failure) await this.failure(exception);
        else throw exception;
    }
}
```

---

### Surface contract — `execute()` is the only door into the flow

The retry loop, the attempt counter and the terminal hooks all live in **that override**. So every
behavior a caller depends on must be reachable from `execute()`.

- The class **MAY** expose other public methods. A method that performs a **unit of the class's own
  work** — meaningful on its own, callable on its own — is legitimate, and stays outside the flow.
- What the class **MUST NOT** expose is a **second door onto the same run**: a public method that
  calls its own `execute()`, or that wraps the whole flow to bolt behavior around it
  (`runAndValidate()`, `executeWithRetry()`, `safeExecute()`). Every caller still on `execute()` — the
  framework included, since it only sees `AttemptableInterface` — silently skips that behavior.
- A caller **MUST NOT** be migrated from `.execute()` to a bespoke method of the class. **WHEN** the
  behavior of a step changes, it changes **inside** the class: once, for every call site.
- A reaction specific to **one** caller (log and continue vs. abort) stays in that caller's `.catch()`
  — it never becomes a method on the class.

The test is not "is it public", it is "does it re-enter the flow". `parseCookies()` is fine;
`executeAndClassify()` is not.

Before adding a method, look for the matching hook. If none fits, the behavior belongs in the body of
`execute()`.

---

### Hooks

Signatures, whether a hook is optional, and what each one is for live in the interface —
`dist/Interfaces/AttemptableFlow.d.ts`. Read them there; this document does not restate them.

What the interface cannot express, and this decorator decides:

- `currentAttempt` is resolved by the decorator — set to `1` before the loop, then to the running
  attempt on every call. The class never assigns it.
- `attempt()` and `sleep()` are resolved **once**, before the loop; their values are fixed for the
  whole run.
- The order the hooks run in, below.

### Lifecycle order

```text
execute()
 ├─ success ─────────────────────────▶ finish()          → success()
 └─ failure ─▶ retrying(exception, n)
                ├─ Retry   → new attempt (ignores `times`)
                ├─ Throw   → finish(exception) → failure(exception) | throw
                ├─ Resolve → finish()          → success()
                └─ Default → attempts left?    → sleep → new attempt
                             exhausted?        → finish(exception) → failure(exception) | throw
```

`finish()` runs **before** `success()` and before `failure()`, on both paths.

---

### Traps

**1. Declaring `failure()` removes the rethrow.**
The decorator does `if (this.failure) await this.failure(exception); else throw exception;`. A
`failure()` that classifies the error and does not `throw` turns **every failure into a silent
success** — `execute()` resolves normally and the caller never finds out. To translate the exception,
`failure()` must throw:

```typescript
public async failure(exception: Exception): Promise<void> {
    if (exception instanceof BrowserException) {
        throw new MyDomainException("domain message", exception);
    }

    throw exception; // already classified upstream — do not re-wrap
}
```

**2. `sleep()` is read once — backoff is not possible.**
The decorator resolves `await this.sleep?.()` **before** the loop and passes a fixed number to
`retry()`. Exponential backoff requires calling `retry()` directly, with `sleep` computed per attempt
([helpers.md](./helpers.md)).

**3. `retrying()` also runs on the last attempt.**
`getWhen()` calls `when` **before** checking whether attempts ran out (`dist/Helpers/retry.d.ts`). With
`times: 3`, `retrying()` runs 3 times — not 2. Do not use its call count as "how many retries
happened".

**4. `RetryAction.Retry` ignores `times` — this is the infinite loop.**
The exhaustion check is `times <= 1 && ![Retry, Resolve].includes(when)`. Returning `Retry` skips that
check forever: `times` goes negative and the loop never ends. Use `Retry` when the attempt should
**not** count (the page was reset to its initial state); for "try again within the quota", return
`Default`.

**5. `RetryAction.Resolve` takes the success path.**
`retry()` resolves with `undefined`, the decorator's `catch` never fires, and the class goes on to
`finish()` + `success()` — even though `execute()` failed on every attempt. Use it when failure is an
acceptable outcome; do not use it expecting `failure()` to run.

**6. `AbortException` short-circuits before `retrying()`.**
`getWhen()` throws the `AbortException` before consulting `when`. A `retrying()` that handles aborts
is never called. A signal aborted mid-loop also becomes an `AbortException`, even when `when` returned
`Retry` or `Default`.

**7. `times` is the total number of executions, not extra retries.**
`attempt()` returning `3` means 3 calls to `execute()`. `0` or `1` means a single attempt, no retry.

**8. An exception that already is an `Exception` is not re-wrapped.**
`parseOrDefault(e, msg)` is `parse(e) ?? new UnknownException(msg, e)`. An `Exception` thrown by
`execute()` reaches `retrying()`, `finish()` and `failure()` as **the same instance**. Only a
non-`Exception` throw becomes an `UnknownException`. Consequence: when attempts run out, what
propagates is the **original exception**, not a `RetryException`.

---

### When not to use the decorator

| Scenario | Use |
|---|---|
| Retrying **one** isolated function, no state, no lifecycle | [`retry()`](./helpers.md) |
| Variable backoff between attempts | [`retry()`](./helpers.md) with per-attempt `sleep` |
| Time limit without retry | `timeout()` ([helpers.md](./helpers.md)) |
| Retrying **a class behavior** with state and lifecycle | `@ODGDecorators.attemptableFlow()` |

---

### See also

- [helpers.md](./helpers.md) — `retry()`, `sleep()`, `timeout()`, `throwIf()`
- [decorators.md](./decorators.md) — the other decorators (`getterAccess`, `injectable`, `registerListener`)
- [crawlers.md](./crawlers.md) — Pages and Handlers, which implement `AttemptableInterface`
- `dist/Interfaces/AttemptableFlow.d.ts` · `dist/Helpers/retry.js` · `dist/Enums/RetryAction.d.ts`
