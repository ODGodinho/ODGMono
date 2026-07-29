# Diagnostics

Use this file when you see a tsc error, a runtime DI failure, or unexpected behavior in an ODG crawler project. Each entry maps an error symptom to its root cause and fix.

## tsc Errors

### `Property 'X' does not exist on type 'ContainerInterface'`

**Cause:** A new binding was added in `src/app/Container.ts` or via `@ODGDecorators.injectable()`, but `@types/ContainerInterface.d.ts` was not updated.

**Fix:** Add the entry to `ContainerInterface`:

```typescript
// @types/ContainerInterface.d.ts
export interface ContainerInterface {
    [ContainerName.MyNewClass]: MyNewClass;
}
```

---

### `Type 'string' is not assignable to type 'ContainerName'`

**Cause:** A loose string was used where `ContainerName.MyClass` was expected.

**Fix:** Always use the enum member, never a raw string.

---

### `Cannot find module '@selectors'` / `Module has no exported member 'X'`

**Cause:** A new Selector, Page, Handler, or Listener file was created but the barrel (`index.ts`) in its directory was not updated.

**Fix:** Add the export to the barrel file of the directory:

```typescript
// src/Selectors/index.ts
export { mySelector, type MySelectedType } from "./MySelector";
```

---

### `Argument of type 'X' is not assignable to parameter of type 'EventListenerInterface<EventTypes, EventName.X>'`

**Cause:** The event payload type for `EventName.X` is missing or incorrect in `@types/EventsInterface.d.ts`.

**Fix:** Add or fix the payload type in `EventBaseInterface`:

```typescript
export interface EventBaseInterface extends EventObjectType {
    [EventName.MyEvent]: MyEventParameters; // must extend EventBrowserParameters
}
```

---

### `Type 'X' is not assignable to type 'never'` (on ContainerName entry)

**Cause:** `ContainerInterface` is missing the entry for `ContainerName.X`, causing the container's generic to resolve to `never`.

**Fix:** Same as the first error — add the type entry to `ContainerInterface`.

---

### `Object is possibly 'undefined'` on `config.get(ConfigName.X)`

**Cause:** The config field was declared as `.optional()` in Zod but the code treats it as required.

**Fix:** Either use `.nullish()` and add a null-check, or make the field required in the Zod schema. If required, add a dummy value to the project's test setup file ([testing.md](./testing.md)).

---

## Runtime Errors

### Infinite retry loop (crawler keeps restarting the same page)

**Cause:** A `*Solution()` function dispatches an event AND returns `RetryAction.Retry`. The dispatch resets the page but `RetryAction.Retry` bypasses the attempt counter, causing the loop.

**Fix:** After dispatching the event, throw an exception instead of returning `RetryAction.Retry`, so the framework calls `retrying()` and the attempt counter decrements. Canonical pattern and rationale: [handler.md](./handler.md) (anti-loop pattern).

---

### `Cannot read properties of undefined (reading 'execute')` on a Page

**Cause:** The Listener called `page.execute()` without calling `page.setPage(pageEngine)` first.

**Fix:** Always call `setPage()` before `execute()`:

```typescript
await this.myPage.setPage(page).execute();
```

---

### `No matching bindings found for service identifier 'X'`

**Cause:** A class decorated with `@ODGDecorators.injectable(ContainerName.X)` was not picked up by `ODGDecorators.loadModule(this)` in `Container.ts`, or the module import was missing.

**Fix:**

1. Verify `ODGDecorators.loadModule(this)` is called in `Container.setUp()`
2. Verify the class file is imported somewhere in the dependency graph (barrel or direct import)
3. Verify the `ContainerName.X` value matches what is used at the injection site

---

### Config value is `undefined` at runtime

**Cause:** The key exists in `ConfigName.ts` but was not added to the Zod schema in `src/Configs/index.ts`, so it passes validation as `undefined`.

**Fix:** Close the full config chain — key in `ConfigName.ts`, Zod rule in the validator (`src/Configs/**`), `.env.example`, local `.env`, and a dummy in the test setup when the field is required. Naming and validation rules: [configs.md](./configs.md); test dummy rules: [testing.md](./testing.md).
