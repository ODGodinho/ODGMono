import { Context as ContextBase, type ContextOptionsLibraryInterface } from "../../../src/crawler/index.ts";

import type {
    ContextClassEngine,
    PageClassEngine,
} from "./engine.ts";

export class Context extends ContextBase<
    ContextClassEngine,
    PageClassEngine
> {

    public override async defaultPageOptions(): Promise<ContextOptionsLibraryInterface> {
        return {
            ...await super.defaultPageOptions(),
        };
    }

}
