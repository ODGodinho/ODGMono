import type { Browser as BrowserBase } from "./Browser";
import type { Context as ContextBase } from "./Context";
import type { Page as PageBase } from "./Page";

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
