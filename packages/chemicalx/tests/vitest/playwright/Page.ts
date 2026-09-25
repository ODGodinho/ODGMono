import { Page as PageBase } from "../../../src/crawler/index.ts";

import type {
    ContextClassEngine,
    PageClassEngine,
} from "./engine.ts";

export class Page extends PageBase<
    ContextClassEngine,
    PageClassEngine
> {

    public example(): number {
        return 1;
    }

}
