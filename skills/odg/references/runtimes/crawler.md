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

**Selectors are never inlined.** A CSS or XPath string **MUST NOT** appear in a Page or Handler.

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
