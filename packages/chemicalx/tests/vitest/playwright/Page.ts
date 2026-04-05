import { Page as PageBase, type PageChemicalXInterface } from "../../../src/crawler";

import type {
    ContextClassEngine,
    PageClassEngine,
} from "./engine";

export class Page extends PageBase<
    ContextClassEngine,
    PageClassEngine
> implements PageChemicalXInterface<PageClassEngine> {

    public example(): number {
        return 1;
    }

}
