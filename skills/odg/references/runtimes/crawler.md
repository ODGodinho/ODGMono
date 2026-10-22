# Runtime — Crawler

Entry ring for a browser/HTTP crawler. Read [architecture.md](../architecture.md) for the universal spine first.

## Entry ring

```text
src/
    index.ts            Container.setUp() → Kernel.boot() → Service.execute() → Kernel.shutdown()
    engine.ts           engine type aliases (Browser/Context/Page — Playwright/Puppeteer)
    Browser/            Browser/Context/Page wrappers (OMITTED by API-only crawlers)
    Pages/              one page-interaction step; execute() drives the DOM via $s/$$s
        BasePage.ts
        <?Group>/<Name>Page.ts
        Components/     reusable page fragments
    Handlers/           success/gate logic for a step
        BaseHandler.ts
        <?Group>/<Name>Handler.ts
    Selectors/          centralized typed selector constants
        <?Group>/<Name>Selector.ts
```

## Runtime lifecycle

```text
index.ts
 ├─ Container.setUp()   bindKernel(Config, Logger, EventBus, …) → ODGDecorators.loadModule(this)
 │                       [auto-registers every @injectable class] → bindCrawler(BrowserManager)
 │                       → Kernel.init() → project-specific bind (e.g. Requester, JSONLogger)
 ├─ Kernel.boot()       logs + browser + EventServiceProvider.boot() [registers Listeners]
 ├─ Service.execute()   get context/page → bus.dispatch(EventName.X, { page })
 │                       → handler.setPage(page).execute()
 │      Event ─▶ Listener.handler({ page }) → page.setPage(page).execute()
 │      Handler.execute() → waitForHandler() races identify*() → *Solution(); retrying(); success()
 └─ Kernel.shutdown()
```

**Lifecycle contract:** managed artifacts (Page/Handler) are always driven as `.setPage(page).execute()`. Calling `execute()` before `setPage()` is a bug (`Cannot read properties of undefined`).

**Logging before boot:** work that logs runs only after `Kernel.boot()` has given the logger its identity (`bootLogs()`); before that, the json-log plugin and the identifier are missing and the log reaches Graylog/Kibana broken. An action that must start early (a capacity scale-up) runs right after `bootLogs()`, not after the whole boot.
