# Conventions

## Fire-and-forget promises

A promise started from a synchronous context (event listener, constructor, any `() => void` callback) MUST be passed to `detach(promise, log)` from `@odg/chemical-x`. `void promise` and `.catch(() => null)` are both violations — a rejection still becomes an `unhandledRejection`, or is silently swallowed.

```typescript
import { detach } from "@odg/chemical-x";

process.on("session-refreshed", () => {
    void detach(this.reloadProfile(), this.logger);
});
```

## Logging

Pass the error object first, context second — the logger resolves and formats any object; flattening it by hand loses its shape.

```typescript
logger?.error(error, { message: "Updater error" });
```

Secrets (`_TOKEN`, `_PASSWORD`, `_SECRET`, `_KEY`) MUST NOT reach the logger.

A log call is a promise — starting one from a synchronous context follows the Fire-and-forget rule above.
