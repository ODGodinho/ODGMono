# Convention — Logging

The logger resolves and formats any object. Pass the error object **first**, context second.

```typescript
// ❌ String first — the error object is flattened by hand and loses its shape
process.on("error", (error: Error) => {
    logger?.error("Updater error", {
        message: error.message,
        stack: error.stack,
    });
});

// ✅ Object first — the log lib resolves and formats it
process.on("error", (error: Error) => {
    logger?.error(error, {
        message: "Updater error",
    });
});
```

Secrets (`_TOKEN`, `_PASSWORD`, `_SECRET`, `_KEY`) **MUST NOT** reach the logger.

A log call is a promise. Starting one from a synchronous context follows [async.md](./async.md).
