# Handlers

A Handler exists only when **one action can produce 2+ distinct outcomes** that must be identified and routed at runtime. If the bot can safely assume success (a simple login), or if a step only awaits a single HTTP response where `status === 200` is success and any other status throws one exception ([pages.md](./pages.md) → *Pages MUST NOT*), no handler.

Prefer strong observable identifiers in this order:

1. compatible request or response
2. expected URL change
3. visible selector from the next state
4. disappearance of the old state plus presence of the new state

## Typical cases

### Scenario 1 — Multi-outcome step (e.g., login)

After submitting a form, the page may show success, captcha, account block, or an error. Each outcome requires a different treatment — use a `??` chain for sequential mutually exclusive checks or `Promise.race` for parallel outcomes.

### Scenario 2 — Page transition validation (e.g., `SearchToSelectionHandler.ts`)

After triggering a search, you must confirm the bot reached the results screen. Use `Promise.race()` between the expected results selector, an error modal, a login redirect, or any unexpected state so the bot never proceeds blindly.

### Scenario 3 — Conditional/optional UI state (e.g., `ModalErrorHandler.ts`)

On a single screen, something *may or may not* appear, such as an alert modal or an extra field unlocking. Use `Promise.race()` between `identifyModalOpened()` and `identifyNextFieldsVisible()` so the bot reacts instantly to whichever happens first, without waiting for a timeout. Still prefer the strong observable order listed above.

---

## Naming Convention

| Object | Name Convention | Description |
| --------- | --------- | --------- |
| Identify Method | `identify<Outcome>()` | `identifySuccess()`, `identifyNoResult()` |
| Solution Method | `<outcome>Solution()` | `successSolution()`, `noResultSolution()` |

- `{Feature}Handler` — validates the result of an isolated step (e.g., `SearchHandler`, `ModalErrorHandler`)
- `{Origin}To{Destination}Handler` — validates a page transition (e.g., `LoginToHomeHandler`)

## BaseHandler Injected Properties

`BaseHandler` already provides these — **MUST NOT** re-inject them in the subclass:

- `this.bus` — `EventBusInterface<EventTypes>`
- `this.logger` — `LoggerInterface`
- `this.config` — `ConfigInterface<ConfigType>`
- `this.page` — `PageClassEngine`
- `this.$$s` — `typeof Selectors`

## Rules

- All core interaction and business logic within a Handler **MUST** be encapsulated exclusively inside the solution() method.

### Handlers **MUST NOT**

- contain `try`/`catch` — if you need one, the producer stored the wrong thing
- perform the request or interaction whose result it classifies
- write domain state (store, OutputPayload) — that belongs to the Page/Component
- mix a DOM selector check with an authoritative HTTP response in the same Handler — when the request alone decides success vs. error, validate only the response

### **WHEN** writing a `waitForHandler()` that waits for a specific request or response

- `waitForHandler()` has **exactly two** shapes. A third shape — `try`/`catch`, `if/else` over an awaited call, or invoking the action itself — is a violation, not a variant.
- **MUST** use `Promise.race([...])` when the outcomes occur in parallel, and a `??` chain when they occur in sequence (see *Examples*).
- **MUST NOT** race two `identify*()` that await the **same** request or promise: the race settles by input order, not by which outcome actually happened, so the result is nondeterministic. Coalesce them into one `identify*()` with `locator().or()`/a selector union, or check them with a `??` chain.
- `waitForHandler()` is the orchestration boundary. Keep branching and outcome competition there, not buried inside helper methods.
- **MUST NOT** call `execute()` on a Page, Component, or Service — a Handler observes an outcome, never triggers it

### **WHEN** writing a `identify*()` that waits for a specific request or response

- All identify functions **MUST** have the prefix `identify*`
- Each `identify*()` **MUST** detect exactly one semantic outcome.
- One outcome recognized by more than one selector stays one `identify*()`, coalesced as in *waitForHandler()* above, never a nested `Promise.race()`. How the browser API is used inside it (arming the wait, the predicate, the timeout): [browser-automation.md](./browser-automation.md).
- Create multiple identify functions only when the outcomes are behaviorally different and map to different solution functions.

### **WHEN** defining attemptable flow behavior

- It is **RECOMMENDED** that handlers own their timeout via `getTimeout()` and project config.

### **WHEN** writing a `*Solution()` that cannot recover and needs to trigger a retry

- You **MAY** dispatch the page event again, but then **MUST** throw instead of returning `RetryAction.Retry` — `Retry` bypasses the `@attemptableFlow` counter and loops forever; the throw goes through `retrying()` (anti-loop example below).
- All solution functions **MUST** have the suffix `*Solution`
- **RECOMMENDED** derive solution name from the identify name: drop the `identify` prefix
  - `identifyLoginBlocked` → `loginBlockedSolution`
  - `identifyMfaRequest` → `mfaRequestSolution`
  - `identifyCaptchaBlock` → `captchaBlockSolution`

## How to Create a Handler

Page + handler together: `$$PM odg make:page <Name> --handler`. Handler alone:

```bash
$$PM odg make:handler <Name>
```

## Examples

```typescript
// Parallel outcomes — use when the browser can show any of them at different times
public async waitForHandler(): Promise<HandlerFunction> {
    return Promise.race([
        this.identifySuccess(),
        this.identifyMfaRequest(),
        this.identifyError(),
    ]);
}
```

```typescript
// Sequential coalescing chain — use when states are mutually exclusive and checked in order
public async waitForHandler(): Promise<HandlerFunction> {
    return await this.identifyCaptchaBlock()
        ?? await this.identifyLoginBlocked()
        ?? await this.identifySiteError()
        ?? this.successSolution.bind(this); // If it's not a mistake, it was a success.
}
```

```typescript
// Anti-loop pattern — dispatch + throw, NOT dispatch + RetryAction.Retry
public async captchaBlockSolution(): Promise<HandlerSolutionType> {
    await this.bus.dispatch(EventName.LoginPageEvent, { page: this.page });
    throw new Exception("Captcha detected, re-dispatching login page");
    // Framework calls retrying(), which checks the @attemptableFlow counter safely
}
```

## Documentation

For RetryAction, HandlerFunction, and HandlerSolutionType, read [@odg/chemical-x/dist/crawler/Interfaces/HandlerInterface.d.ts]($$PROJECT_ROOT/node_modules/@odg/chemical-x/dist/crawler/Interfaces/HandlerInterface.d.ts).
