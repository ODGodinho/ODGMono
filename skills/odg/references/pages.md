# Pages

Pages represent intent, not URL ownership. strictly following the Page Object Pattern.

Pages **MUST**:

- navigate, fill, click, and wait for the immediate action they own
- consume typed state required for that step
- set up any request/selector waits that the Handler will resolve
- encapsulate exactly **one** primary user intent (e.g. "Fill Form Page", "Fill Login Page", "Fill checkout")

Pages **MUST NOT**:

- orchestrate multiple intents in sequence (e.g. "login" **and then** "search")
- decide whether the flow succeeded
- dispatch the next step of the flow
- hide business routing inside conditional page code
- hide flow routing by navigating across unrelated domains as part of the same intent
- chain multiple business steps inside `execute()` as a mini-service

## Rules

Ask internally or outwardly, as needed:

- Page classes and their corresponding files **MUST** be named using **PascalCase**.
- If this crawler using browser, the page **RECOMMENDED** use flag `--selectors` to create selectors file.
- If the step crosses domains (e.g. `accounts.google.com` → `youtube.com`) or contains 2+ primary verbs ("login", "search", "checkout"), split it into 3+ Pages and orchestrate them in a Service or Listener.
- If page use selectors, this Page **SHOULD** use typed selectors and the scaffold **SHOULD** include `--selectors`
- If need handler, the command **SHOULD** include `--handler` for a default `<pageName>Handler`, or `--handler-from` and/or `--handler-to` for transition handlers
- When flag meaning is unclear, agents **MUST** read `yarn odg make:page --help` and **MUST NOT** guess semantics.
- **MUST NOT** change page to singleton, because page is a step of the flow, and it should be created for each flow.
- **MUST NOT** create OneAndOtherPage, because page is one intention
- **MUST** use **setPage()** in page before use **IF** your crawler using browser.

## Naming Convention

| Object | Name Convention | Description |
| --------- | --------- | --------- |
| Class | {{PascalCase}} + `Page` | `ExamplePage`, `LoginPage` |
| File | {{PascalCase}} + `Page.ts` | `ExamplePage.ts`, `LoginPage.ts` |

## How to Create a Page

You **MUST** use the official scaffolding command to create pages.

```bash
yarn odg make:page --help
```

> When creating a page together with handler, selectors, event contract, and listener class, you **SHOULD** prefer a single `make:page` with `--selectors`, `--event`, `--listeners`, and `--register` (see [events.md](./events.md)) unless a documented exception applies.

## BasePage Injected Properties

`BasePage` already injects these via `@$inject`. **NOT MUST** re-inject in the subclass what `BasePage` already provides.

- `this.logger` — `LoggerInterface`
- `this.config` — `ConfigInterface<ConfigType>`
- `this.page` — `PageClassEngine` (Playwright/puppeteer Page, set via `setPage()`)
- `this.$$s` — `typeof Selectors` (all selectors from barrel)

## Components

`Pages/Components/` holds reusable page sub-elements (e.g., `AcceptCookieComponent`) that encapsulate UI logic used across multiple pages.

- Components are **NOT** top-level steps of the flow — they are called inside `Page.execute()` or as injected helpers
- Components **MUST** follow the same injectable pattern as Pages
- Components created with `make:page` but in folder component --path=src/Pages/Components
- Components **MUST** be placed in `src/Pages/Components/index.ts` and exported in the barrel
