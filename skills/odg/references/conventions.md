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

## Constant scope

A constant **MUST** be declared in the narrowest scope that reads it.

| Read by | Declare as |
| --- | --- |
| one method | `const` **inside that method** |
| 2+ methods of one class, or read on a hot path or max complexity function | `private static readonly` field on that class |
| 2+ files | exported from a module both import |

A module-level `const` that only one class in the file reads is the violation: it reads as shared
vocabulary while being private, it widens the scope of a value nothing else needs, and it outlives
the class it belonged to when that class moves.

```typescript
// WRONG — module scope for a value only one method reads
const batchSize = 50;

export class CardImporter {
    public async run(cards: Card[]): Promise<void> {
        await this.sendInChunks(cards, batchSize);
    }
}

// RIGHT
export class CardImporter {
    public async run(cards: Card[]): Promise<void> {
        const batchSize = 50;

        await this.sendInChunks(cards, batchSize);
    }
}
```

A value read on every call (a `Set` used for lookup, a compiled regex) **MUST** be a
`private static readonly` field rather than a local — a local rebuilds it on each call. The same
destination applies **WHEN** moving several constants into one method would breach `max-statements`:
the field is the correct home, not a suppression.

## HTTP status codes

An HTTP status **MUST** come from an HTTP status package — `http-status` is the default, and **WHEN** the project already depends on another one, use that rather than adding a second.

The **number** is what the rule is about, not where it is kept. Scope follows *Constant scope* above like any other value: inline at the call site, a local `const`, or a `private readonly` field are all correct.

```typescript
// WRONG — the number was typed by hand, at any scope
private readonly defaultStatus = 400;
const httpNoContent = 204;
return new Response(null, { status: 204 });

// RIGHT — every form, because the value comes from the package
import httpStatus from "http-status";

private readonly defaultStatus = httpStatus.BAD_REQUEST;
const defaultStatus = httpStatus.NO_CONTENT;
return new Response(null, { status: httpStatus.NO_CONTENT });
```

**Exception:** a non-standard code no package publishes (vendor-specific, internal) **MAY** be a literal, and **MUST** then be named so the number never appears bare at the call site.
