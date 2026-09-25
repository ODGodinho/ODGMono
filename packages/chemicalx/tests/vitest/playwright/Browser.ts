import { Browser as BrowserBase } from "../../../src/crawler/index.ts";

import type {
    BrowserClassEngine,
    BrowserOptionsEngine,
    ContextClassEngine,
    PageClassEngine,
} from "./engine.ts";

export class Browser extends BrowserBase<
    BrowserClassEngine,
    ContextClassEngine,
    PageClassEngine
> {

    public override async defaultContextOptions(): Promise<BrowserOptionsEngine> {
        return {
            ...await super.defaultContextOptions(),
            headless: true,
            args: [ "--no-sandbox" ],
        };
    }

}
