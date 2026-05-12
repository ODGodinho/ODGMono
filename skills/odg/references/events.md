# Events

An event only takes effect when at least one listener is registered for it.

## Rules

- Event names live in `src/app/Enums/EventName.ts` by default.
- Event payload `EventTypes` live in `@types/EventsInterface.d.ts` by default.
- Every event **MUST** have a payload type declared in `@types/EventsInterface.d.ts` extending `EventBrowserParameters` (which always carries `page: PageClassEngine` if page is required).
- Inject the event bus with `@$inject(ContainerName.EventBus) protected bus: EventBusInterface<EventTypes>,`
- Dispatch events with `await this.bus.dispatch(EventName.CustomEvent, { page, ...extraParams });`
- Events **MUST NOT** have a transaction handler — only a validation handler. The transaction handler is called inside the Service, not the Listener.

## Who Can Dispatch Events

| Caller | Allowed | Notes |
| --- | --- | --- |
| **Service** | ✅ | Primary dispatcher; owns the browser context lifecycle |
| **Handler** | ✅ | Use to trigger a retry path (always throw after dispatch — see handler.md) |
| **Listener** | ✅ | Use to chain to the next step in a composed flow |
| **Page** | ❌ | Pages **MUST NOT** dispatch events |

## Payload Type Pattern

Declare each event's payload in `@types/EventsInterface.d.ts`:

```typescript
// Minimal payload — every event must at least carry the page
export interface EventBrowserParameters {
    page: PageClassEngine;
}

// Extended payload for events that need extra parameters
export interface ExampleParameters extends EventBrowserParameters {
    example: string;
    example2: boolean;
}

export interface EventBaseInterface extends EventObjectType {
    [EventName.HomePageEvent]: EventBrowserParameters;
    [EventName.ExampleEvent]: ExampleParameters;
}

export type EventTypes<T = EventBaseInterface> = T;
```

## Create an Event

- If you need a page and its event together, prefer `yarn odg make:page PageName --event EventName`.

```bash
yarn odg make:event <eventName>
# or
yarn odg make:event --help
```

## Listeners

A listener is a class registered for 1+ events.

### Decorator Pattern

```typescript
@ODGDecorators.injectable(ContainerName.SearchEventListener, "Singleton")
@ODGDecorators.registerListener(EventName.SearchEvent, ContainerName.SearchEventListener, {})
export class SearchEventListener implements EventListenerInterface<EventTypes, EventName.SearchEvent> {
    public constructor(
        @$inject(ContainerName.Logger) public readonly log: LoggerInterface,
        @$inject(ContainerName.SearchPage) public readonly searchPage: SearchPage,
    ) {}

    public async handler({ page }: EventBrowserParameters): Promise<void> {
        await this.searchPage.setPage(page).execute();
    }
}
```

- `@ODGDecorators.registerListener(EventName.X, ContainerName.X, {})` auto-registers the listener in `EventServiceProvider` via `ODGDecorators.getEvents(container)` — **no manual Provider change needed** for the standard case.

### Make listeners

- If you need a listener tied to a page, prefer `yarn odg make:listener ListenerName --event EventName`.

```bash
yarn odg make:listener <listenerName> --event <eventName>
# or
yarn odg make:listener --help
```

## Register Event Listeners Manually

Use manual registration only when a listener needs to be added to an event that already has other auto-registered listeners, or when the decorator approach is not viable.

In `src/app/Provider/EventServiceProvider.ts`:

```typescript
@ODGDecorators.injectable(ContainerName.EventServiceProvider, "Singleton")
export class EventServiceProvider<Events extends EventTypes> extends EventServiceProviderBase<Events> {

    protected readonly listeners: EventListener<EventTypes>;

    public constructor(
        @$inject(ContainerName.Container) private readonly container: Container,
    ) {
        super();
        this.listeners = this.getListeners();
    }

    private getListeners(): EventListener<EventTypes> {
        const listeners = {
            // Auto-registers all @ODGDecorators.registerListener decorators
            ...ODGDecorators.getEvents(this.container),
        };

        // Manual addition — only when the decorator approach isn't sufficient
        listeners[EventName.SearchEvent] ??= [];
        listeners[EventName.SearchEvent].push({
            listener: this.container.get(ContainerName.SearchEventListener),
            options: { once: false },
        });

        return listeners;
    }
}
```
