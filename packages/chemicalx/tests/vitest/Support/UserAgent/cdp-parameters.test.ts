import { UserAgent, UserAgentPlatform } from "#app";

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

    test("forwards the configured accept language", () => {
        const parameters = new UserAgent({
            version: chromeVersion,
            acceptLanguage: "pt-BR,pt;q=0.9,en;q=0.8",
        }).cdpParams();

        expect(parameters.acceptLanguage).toBe("pt-BR,pt;q=0.9,en;q=0.8");
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
