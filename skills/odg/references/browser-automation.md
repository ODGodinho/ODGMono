# Browser automation — Playwright and Puppeteer

Rules for code that drives a browser through Playwright or Puppeteer: Pages, Components, Handlers, and any Service or helper that calls `page`, `locator`, `route` or `context`. The ODG concepts (Page, Handler, `identify*`, `$s`/`$$s`) live in [pages.md](./pages.md), [handler.md](./handler.md) and [selectors.md](./selectors.md); this file covers how the browser API itself is used. Each rule says why, because the failures it prevents depend on timing: they pass on a fast local run and break in production.

## Wait armed before the action

A `waitForResponse`, `waitForRequest`, `waitForURL`, `waitForNavigation` or `waitForEvent` only sees what happens **after** it starts. Create the wait, then act, then await the wait. A wait created after `click()`, `goto()` or `reload()` races the event: when the response is fast it is already gone, and the step times out at random.

Wrong:

```typescript
await this.page.locator(this.$s.buttons.search).click();
const response = await this.page.waitForResponse(this.$s.requests.searchResult);
```

Right:

```typescript
const searchResponse = this.page.waitForResponse(this.$s.requests.searchResult);

await this.page.locator(this.$s.buttons.search).click();

return searchResponse;
```

Puppeteer has the same contract: create `page.waitForNavigation()` (or `waitForResponse`) before `page.click()`, or start both in one `Promise.all([...])`.

- When a Page arms a wait that its Handler resolves ([pages.md](./pages.md)), the Page arms it before the action and stores the promise, and the Handler awaits that promise. A Handler **MUST NOT** start a wait for an event its Page has already triggered.
- A stored promise that nobody awaits yet carries `.catch((exception: unknown) => exception)`, so a rejection before the Handler awaits it never becomes an `unhandledRejection`. The Handler validates the settled value (a response, or the error it settled with).

```typescript
this.searchResponse = this.page.waitForResponse(this.$s.requests.searchResult)
    .catch((exception: unknown) => exception);

await this.page.locator(this.$s.buttons.search).click();
```

- On a retry, arm again before the `reload()` or `goto()` that repeats the event. The previous promise is settled, or bound to a page that is gone.
- The wait's timeout covers everything between arming and the event, navigation included. A timeout sized for the response alone fails when the navigation before it is slow.

## Predicate never rejects

The predicate of `waitForResponse`/`waitForRequest` runs for every response of the page. If it throws or rejects, the wait rejects and takes down every `Promise.race` it belongs to: the Handler fails because of an unrelated response. Decide by `url()`, `status()`, `request().method()` and headers. **MUST NOT** read the body (`text()`, `json()`, `body()`) inside a predicate: redirects (3xx) and responses of a replaced document have no body, and reading it rejects.

Right:

```typescript
return this.page.waitForResponse(
    (response) => response.status() === httpStatus.FORBIDDEN && this.$s.requests.login.test(response.url()),
);
```

When the outcome depends on the body, read it after the wait resolves, in the code that owns the outcome.

## Required step waits

`isVisible()`, `isEnabled()` and `count()` answer **now**; they do not wait. `if (await locator.isVisible())` is right only for an element that is truly optional, such as a cookie banner. A required step acts on the locator (`click()` and `fill()` wait for it) or awaits `locator.waitFor()`. An instant check around a required click skips it on a slow page, and the flow continues in the wrong state. They also never reject when the element is absent or detached — wrapping `isVisible()`, `isEnabled()` or `count()` in `try`/`catch` or `.catch(() => false)` is a **Defensive excess** violation.

## No polling loop

**MUST NOT** poll with `while` or `for` plus `await` (team rule). Use the API that waits for the condition: `locator.waitFor()`, `waitForFunction()`, `waitForResponse()`. When none fits, write a private recursive method with an explicit deadline from config and a named exception when it expires: the wait is bounded, visible, and its failure says what it waited for.

## Timeout is the only expected error

The general rule is **Expected error only** ([review/checklist.md](./review/checklist.md) → *Error*). For a browser wait, the expected error is the timeout: a wait that may legitimately time out catches the timeout error only (Playwright `errors.TimeoutError`, Puppeteer `TimeoutError`) and rethrows everything else. A closed page, a crashed target or an aborted navigation must propagate. A catch that turns every error into `null` or into a warning makes a dead browser look like an optional element that did not appear.

## No history scanning

Decide from what happens **after** your action. **MUST NOT** scan `page.requests()`, earlier responses or earlier screens to infer what already happened: the history depends on what the browser kept and on previous attempts.

## Intercept contract

For `page.route()` handlers:

- `route.fulfill()` in a new intercept follows the shape of its siblings in the same file (`json`, `status`, `headers`). A different shape needs a reason in the card.
- When the upstream call fails (timeout, proxy, TLS: no response), **MUST NOT** fulfill a synthetic `200` with `{}`. The site reads it as valid data and loses whatever that response carried. Log the degradation ([conventions.md](./conventions.md) → *Logging*).
- When the intercepted body fails validation, pass the original response through unchanged and log it the same way. Never re-serialize a body you could not parse.
- Every upstream request made inside an intercept carries an explicit timeout from config.

## Browser state comes from the browser

Cookies, storage and session are read from the browser context (`context.cookies()`, `storageState()`), never from infrastructure state that a toggle can switch off.

## Input clearing on retry

Unlike `fill()`, `pressSequentially()` (`type()`) appends to whatever value is already in the field. In a retryable step (`@attemptableFlow`), a retry that does not reload the document — or a browser that restores form state on reload — leaves the previous attempt's text in the input. Call `await locator.clear()` before `pressSequentially()`, or use `fill()`.

## Preserve the evidence page

When a crawler captures end-of-run screenshots and HTML from `this.page` (`mainPage`) for failure triage, **MUST NOT** navigate `this.page` to another URL inside `retrying()` or `failure()` when the flow may terminate: that overwrites the error screen in the evidence log. Open a separate tab (`await this.page.context().newPage()`) and close it in `finally`, or skip the navigation on the last attempt.
