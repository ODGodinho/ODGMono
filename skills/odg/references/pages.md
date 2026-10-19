# Pages

Pages represent intent, not URL ownership, and **MUST** follow the Page Object Pattern.

Pages **MUST**:

- navigate, fill, click, and wait for the immediate action they own
- consume typed state required for that step
- set up any request/selector waits that the Handler will resolve, armed before the action ([browser-automation.md](./browser-automation.md) → *Wait armed before the action*)
- encapsulate exactly **one** primary user intent (e.g. "Fill Login", "Fill checkout") — never a `LoginAndSearchPage`

Pages **MUST NOT**:

- decide whether the flow succeeded — but a Page **MAY** throw a retryable exception when the immediate response it owns fails validation: that is the Page reporting its own step failed, not routing the flow's outcome.
- dispatch the next step of the flow
- hide business routing inside conditional page code
- hide flow routing by navigating across unrelated domains as part of the same intent
- validate that the browser reached the next page (its URL, DOM or selectors through `this.$$s`): that is the transition Handler's job

A step that crosses domains (`accounts.google.com` → `youtube.com`) or has 2+ primary verbs ("login", "search") **MUST** be split into one Page per intent, orchestrated by a Service or Listener.

## Attempts

Before writing attempt logic (per-attempt state in `execute()`, `retrying()`, `finish()`, `success()`/`failure()`), you **MUST** read `@odg/chemical-x`'s [attemptable-flow.md]($$PROJECT_ROOT/node_modules/@odg/chemical-x/docs/attemptable-flow.md) (lifecycle order and *Traps*). Those rules apply to **any** class that uses `@attemptableFlow` or `retry()` (Page, Component, Handler, Service), not only Pages.

## A class that only classifies is a Handler

A Page or Component with no navigate, fill or click, one that only reads a response and decides from it, is a Handler (`make:handler`). A Page that performs the action **MAY** check its own immediate response and throw (the MAY in *Pages MUST NOT*); that MAY is not a license to classify outcomes.

## How to Create a Page

**MUST** use the CLI — one `make:page` for the whole step. Read `$$PM odg make:page --help` when a flag's meaning is unclear; **MUST NOT** guess.

```bash
$$PM odg make:page <Name> --selectors --event <Name> --listeners   # + --handler, or --handler-from/--handler-to for a transition
```

## BasePage Injected Properties

`BasePage` already injects these via `@$inject`. You **MUST NOT** re-inject in the subclass what `BasePage` already provides.

- `this.logger` — `LoggerInterface`
- `this.config` — `ConfigInterface<ConfigType>`
- `this.page` — `PageClassEngine` (Playwright/puppeteer Page, set via `setPage()`)
- `this.$$s` — `typeof Selectors` (all selectors from barrel)

## Components

`Pages/Components/` holds reusable page sub-elements (e.g., `AcceptCookieComponent`) that encapsulate UI logic used across multiple pages.

- Components are **NOT** top-level steps of the flow — they are called inside `Page.execute()` or injected.
- Create with `$$PM odg make:page <Name> --path src/Pages/Components`.
- A Component reused by several flows does not throw an exception that belongs to one of them; its caller decides.
