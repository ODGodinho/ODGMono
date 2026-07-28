# Convention — Fire-and-forget promises

When async work starts from a synchronous context — an event listener, a constructor, any `() => void` callback where you cannot `await` — the promise **MUST NOT** be left floating. `void promise` only silences the linter (a rejection still becomes an `unhandledRejection` and can crash the process) and `.catch(() => null)` swallows the failure.

Use `detach(promise, log)` from `@odg/chemical-x`: it records any rejection through the logger, falling back to `console.error` only if the logger itself fails.

```typescript
import { detach } from "@odg/chemical-x";

process.on("session-refreshed", () => {
    void detach(this.reloadProfile(), this.logger);
});

// Detaching a log call — route its failure to a different logger
process.on("error-event", (exception) => {
    void detach(
        this.logger.debug(exception),
        this.consoleLogger,
    );
});
```
