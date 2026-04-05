import { vi } from "vitest";

import type { EventListenerInterface } from "src/index";

export class TestEventListeners implements EventListenerInterface<Record<string, unknown>, string> {

    public handler = vi.fn(() => this.test as never);

    private readonly test: string = "test";

}
