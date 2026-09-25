import {
    type EventBusInterface,
    type EventListener,
    EventServiceProvider as EventServiceProviderBase,
} from "../../../src/index.ts";

import { TestEventListeners } from "./TestEventListeners.ts";

export class EventServiceProvider extends EventServiceProviderBase<Record<string, unknown>> {

    protected listeners: EventListener<Record<string, unknown>> = {
        "test": [
            {
                listener: new TestEventListeners(),
                options: {},
            },
            {
                listener: new TestEventListeners(),
                options: {},
            },
        ],
    };

    public constructor(
        protected bus: EventBusInterface<Record<string, unknown>>,
    ) {
        super();
    }

}
