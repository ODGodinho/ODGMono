import type { PageEngineInterface } from "../../index.ts";
import { BasePage } from "../BasePage.ts";

export abstract class BaseComponentPage<
    PageClassEngine extends PageEngineInterface,
> extends BasePage<PageClassEngine> {

}
