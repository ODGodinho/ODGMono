import { UserAgent, UserAgentPlatform } from "#app";

const chromeVersion = "124.0.6367.60";

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
            platform: "macOS",
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

    test("keeps the CDP platform equal to the platform hint", () => {
        const userAgent = new UserAgent({
            version: chromeVersion,
            platform: UserAgentPlatform.ChromeOS,
        });

        expect(userAgent.cdpParams().platform).toBe(userAgent.metadata().platform);
    });

    test("produces the same payload for the same input", () => {
        const first = new UserAgent({ version: chromeVersion }).cdpParams();
        const second = new UserAgent({ version: chromeVersion }).cdpParams();

        expect(first).toStrictEqual(second);
    });
});
