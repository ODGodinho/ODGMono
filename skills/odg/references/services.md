# Services

Services are the orchestration layer of the crawler. They own the browser context lifecycle and drive the flow by dispatching events.

## Responsibility

A Service:

- Creates the browser context and the initial Playwright Page instance
- Dispatches events that trigger Listeners → Pages → Handlers in sequence
- Calls the **transaction handler** directly (the Handler that validates the transition of two steps)
- Closes the browser context when the flow ends or errors

A Service **MUST NOT**:

- contain page interaction logic (navigate, fill, click) — that belongs in Pages
- validate step success inline — that belongs in Handlers
- contain selector literals — that belongs in Selectors

## When to Create a Service

| Situation | Use |
| --- | --- |
| Flow has 2+ steps sharing one browser context | **Service** |
| Single atomic step with no shared context | Listener only |
| Complex flow with diverging paths (e.g. buyWithMoney vs. buyWithPoints) | Separate Services with shared base class |

## Lifecycle

```typescript
// Conceptual lifecycle — adapt to project's BrowserManager API
protected async runCrawler(): Promise<void> {
    const { context, page } = await this.createContextAndPage();

    await this.bus.dispatch(EventName.PrepareEvent, { page });
    await this.prepareToHomeHandler.setPage(page).execute();
    await this.bus.dispatch(EventName.HomeEvent, { page });
    await this.homeToSearchHandler.setPage(page).execute();
    await this.bus.dispatch(EventName.SearchEvent, { page, searchType });

    await context.close();
}
```

## Creation

Services are created **manually** — no scaffold command exists.

1. Create `src/app/Services/<Name>Service.ts`
2. Add `ContainerName.<Name>Service = "<name>.service"` entry under `// Services`
3. Add type entry in `@types/ContainerInterface.d.ts`
4. Export from `src/app/Services/index.ts` barrel
5. Decorate with `@ODGDecorators.injectable(ContainerName.<Name>Service, "Singleton")`
6. Inject via `@$inject(ContainerName.EventBus)`, `@$inject(ContainerName.BrowserManager)`, etc.

## Decorator Pattern

```typescript
@ODGDecorators.injectable(ContainerName.ExampleCrawlerService, "Singleton")
export class ExampleCrawlerService {
    public constructor(
        @$inject(ContainerName.EventBus) private readonly bus: EventBusInterface<EventTypes>,
        @$inject(ContainerName.BrowserManager) private readonly browserManager: BrowserManagerType,
        @$inject(ContainerName.Logger) private readonly log: LoggerInterface,
    ) {}

    public async execute(): Promise<void> {
        await this.runCrawler();
    }

    private async runCrawler(): Promise<void> {
        // context lifecycle + event dispatches + transaction handler
    }
}
```
