# Events

An event only takes effect when at least one listener is registered for it.

## Rules

- Every event **MUST** have a payload in `@types/EventsInterface.d.ts` extending `EventBrowserParameters` (pattern below).
- Events **MUST NOT** have a transaction handler — only a validation handler. The transaction handler is called inside the Service, not the Listener.
- An event without a listener is a no-op, so declaring one is a violation. **WHEN** a change removes the last listener of an event, the event, its payload entry and its enum member go with it.
- Service, Handler and Listener may all dispatch; a Handler that dispatches **MUST** then throw (see [handler.md](./handler.md)).

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

Page + event together: `$$PM odg make:page <Name> --event <Name>`. Event alone:

```bash
$$PM odg make:event <Name>
```

## Listeners

A listener is a class registered for 1+ events. Create it with the CLI — the generated `@ODGDecorators.registerListener(...)` auto-registers it in `EventServiceProvider`, **no Provider change needed**:

```bash
$$PM odg make:listener <Name> --event <EventName>
```

## Register Event Listeners Manually

Use manual registration only when a listener needs to be added to an event that already has other auto-registered listeners, or when the decorator approach is not viable.

In `src/app/Providers/EventServiceProvider.ts`:

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
