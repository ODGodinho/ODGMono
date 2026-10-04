import { UserAgent, UserAgentPlatform } from "#app";
import { InvalidArgumentException } from "#exceptions";

import { elevenLanguages, expandedLanguages, tenLanguages } from "../../internal/UserAgentLanguages.js";

const chromeVersion = "124.0.6367.60";
const linuxPlatform = "Linux x86_64";

describe("UserAgent.cdpParams", () => {
    test("carries the User-Agent string, the platform and the metadata", () => {
        const userAgent = new UserAgent({
            version: chromeVersion,
            platform: UserAgentPlatform.MacOS,
        });
        const parameters = userAgent.cdpParams();

        expect(parameters).toStrictEqual({
            userAgent: userAgent.toString(),
            acceptLanguage: undefined,
            platform: "MacIntel",
            userAgentMetadata: userAgent.metadata(),
        });
    });

    test("sends no accept language without languages", () => {
        expect(new UserAgent({ version: chromeVersion }).cdpParams().acceptLanguage).toBeUndefined();
    });

    test.each([
        [ expandedLanguages, "pt-BR,pt,en-US,en" ],
        [
            tenLanguages,
            "pt-BR,pt,en-US,en,es,fr,de,it,ja,ko",
        ],
    ])("sends %j as a list without q-values", (languages, acceptLanguage) => {
        expect(new UserAgent({ version: chromeVersion, languages }).cdpParams().acceptLanguage).toBe(acceptLanguage);
    });

    test("throws for a list Chrome would expand", () => {
        const userAgent = new UserAgent({ version: chromeVersion, languages: [ "pt-BR", "en-US" ] });

        expect(() => userAgent.cdpParams()).toThrow(InvalidArgumentException);
    });

    test("throws for more than ten tags", () => {
        const userAgent = new UserAgent({ version: chromeVersion, languages: elevenLanguages });

        expect(() => userAgent.cdpParams()).toThrow(InvalidArgumentException);
    });

    test("throws for an empty list", () => {
        const userAgent = new UserAgent({ version: chromeVersion, languages: [] });

        expect(() => userAgent.cdpParams()).toThrow(InvalidArgumentException);
    });

    test.each([
        [ UserAgentPlatform.Windows, "Win32" ],
        [ UserAgentPlatform.MacOS, "MacIntel" ],
        [ UserAgentPlatform.Linux, linuxPlatform ],
        [ UserAgentPlatform.Android, "Linux armv81" ],
        [ UserAgentPlatform.ChromeOS, linuxPlatform ],
    ])("reports the frozen navigator.platform of %s", (platform, navigatorPlatform) => {
        const userAgent = new UserAgent({ version: chromeVersion, platform });

        expect(userAgent.cdpParams().platform).toBe(navigatorPlatform);
    });

    test("never sends the platform hint token as the CDP platform", () => {
        const userAgent = new UserAgent({
            version: chromeVersion,
            platform: UserAgentPlatform.ChromeOS,
        });

        expect(userAgent.metadata().platform).toBe("Chrome OS");
        expect(userAgent.cdpParams().platform).not.toBe(userAgent.metadata().platform);
    });

    test("honours the explicit navigator platform override", () => {
        const parameters = new UserAgent({
            version: chromeVersion,
            platform: UserAgentPlatform.Windows,
            navigatorPlatform: linuxPlatform,
        }).cdpParams();

        expect(parameters.platform).toBe(linuxPlatform);
        expect(parameters.userAgentMetadata.platform).toBe("Windows");
    });

    test("produces the same payload for the same input", () => {
        const first = new UserAgent({ version: chromeVersion }).cdpParams();
        const second = new UserAgent({ version: chromeVersion }).cdpParams();

        expect(first).toStrictEqual(second);
    });
});
