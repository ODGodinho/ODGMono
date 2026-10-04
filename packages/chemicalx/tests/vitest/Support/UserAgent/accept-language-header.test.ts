import { UserAgent } from "#app";
import { InvalidArgumentException } from "#exceptions";

import {
    elevenLanguages,
    expandedLanguages,
    expandedLanguagesHeader,
    tenLanguages,
} from "../../internal/UserAgentLanguages.js";

const chromeVersion = "124.0.6367.60";

describe("UserAgent.acceptLanguageHeader", () => {
    test.each([
        [ expandedLanguages, expandedLanguagesHeader ],
        [ [ "en" ], "en" ],
        [
            tenLanguages,
            "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6,fr;q=0.5,de;q=0.4,it;q=0.3,ja;q=0.2,ko;q=0.1",
        ],
    ])("weights the expanded list %j", (languages, header) => {
        expect(new UserAgent({ version: chromeVersion, languages }).acceptLanguageHeader()).toBe(header);
    });

    test("throws for more than ten tags instead of cutting", () => {
        const userAgent = new UserAgent({ version: chromeVersion, languages: elevenLanguages });

        expect(() => userAgent.acceptLanguageHeader()).toThrow(InvalidArgumentException);
    });

    test.each([
        [ [ "pt-BR;q=0.9" ] ],
        [ [ "pt-BR,pt" ] ],
        [ [ " en" ] ],
        [ [ "" ] ],
    ])("throws for the malformed tag %j", (languages) => {
        const userAgent = new UserAgent({ version: chromeVersion, languages });

        expect(() => userAgent.acceptLanguageHeader()).toThrow(InvalidArgumentException);
    });

    test.each([
        [ [ "pt-BR", "en-US" ] ],
        [ [ "pt-BR" ] ],
        [ [ "zh-Hant-TW", "en" ] ],
    ])("throws for %j, which Chrome expands", (languages) => {
        const userAgent = new UserAgent({ version: chromeVersion, languages });

        expect(() => userAgent.acceptLanguageHeader()).toThrow(InvalidArgumentException);
    });

    test("accepts a base language followed by its own family", () => {
        const languages = [ "pt", "pt-BR", "en" ];

        const header = new UserAgent({ version: chromeVersion, languages }).acceptLanguageHeader();

        expect(header).toBe("pt,pt-BR;q=0.9,en;q=0.8");
    });

    test("is undefined without languages", () => {
        expect(new UserAgent({ version: chromeVersion }).acceptLanguageHeader()).toBeUndefined();
    });

    test("throws for an empty list", () => {
        const userAgent = new UserAgent({ version: chromeVersion, languages: [] });

        expect(() => userAgent.acceptLanguageHeader()).toThrow(InvalidArgumentException);
    });
});
