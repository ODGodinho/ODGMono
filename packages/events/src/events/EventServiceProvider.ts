import type { EventOptions } from "..";
import type { EventBusInterface, EventListenerInterface, EventObjectType } from "../interfaces";

export interface EventListenerOptions<
    Events extends EventObjectType,
    EventName extends keyof Events = keyof Events,
> {
    listener: EventListenerInterface<Events, EventName>;
    options: EventOptions;
}

export type EventListener<
    Events extends EventObjectType,
    EventName extends keyof Events = keyof Events,
> = Record<EventName, Array<EventListenerOptions<Events, EventName>>>;

export type EventListenerNotation<
    Events extends EventObjectType,
    EventName extends keyof Events = keyof Events,
> = Record<EventName, Array<Partial<EventListenerOptions<Events, EventName>> & { containerName: string }>>;

export abstract class EventServiceProvider<Events extends EventObjectType> {

    private readonly listenersMap = new Map<
        string | symbol,
        Array<(argument: Events[keyof Events]) => Promise<void> | void>
    >();

    protected abstract bus: EventBusInterface<Events>;

    protected abstract listeners: EventListener<Events>;

    /**
     * Boot Event Service Provider to register all events listeners
     *
     * @memberof EventServiceProvider
     */
    public async boot(): Promise<void> {
        for (const event of Reflect.ownKeys(this.listeners)) {
            const listeners = this.listeners[event];

            for (const listener of listeners) {
                const bind = listener.listener.handler.bind(listener.listener);

                this.listenersMap.set(
                    event,
                    [
                        ...this.listenersMap.get(event) ?? [],
                        bind,
                    ],
                );
                await this.bus.subscribe(
                    event,
                    bind,
                    listener.options,
                );
            }
        }
    }

    /**
     * Event Service provider unregister functions
     *
     * @memberof EventServiceProvider
     */
    public async shutdown(): Promise<void> {
        for (const [ event, listeners ] of this.listenersMap.entries()) {
            for (const listener of listeners) {
                await this.bus.unsubscribe(
                    event,
                    listener,
                );
            }
        }
    }

}
