import { UserAgent, UserAgentPlatform } from "#app";

const platforms = [
    UserAgentPlatform.Windows,
    UserAgentPlatform.MacOS,
    UserAgentPlatform.Linux,
    UserAgentPlatform.Android,
    UserAgentPlatform.ChromeOS,
];

describe("UserAgent.toNative", () => {
    test.each(platforms)("returns the User-Agent string on %s", (platform) => {
        const userAgent = new UserAgent({ version: "124.0.6367.60", platform });

        expect(userAgent.toNative()).toBe(userAgent.toString());
    });

    test("returns the same string the CDP payload carries", () => {
        const userAgent = new UserAgent({ version: "124.0.6367.60" });

        expect(userAgent.toNative()).toBe(userAgent.cdpParams().userAgent);
    });
});
