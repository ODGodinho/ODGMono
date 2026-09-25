import type { Browser as BrowserBase } from "./Browser.ts";
import type { Context as ContextBase } from "./Context.ts";
import type { Page as PageBase } from "./Page.ts";

declare module "playwright" {
    interface Page extends PageBase {
    }

    interface Frame extends PageBase {
    }

    interface BrowserContext extends ContextBase {
    }

    interface Browser extends BrowserBase {
    }
}
