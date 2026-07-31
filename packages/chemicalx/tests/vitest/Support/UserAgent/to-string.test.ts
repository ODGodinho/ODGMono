import { UserAgent, UserAgentPlatform } from "#app";

const engine = "AppleWebKit/537.36 (KHTML, like Gecko)";
const chromeVersion = "124.0.6367.60";

const vectors = [
    {
        name: "Windows desktop",
        platform: UserAgentPlatform.Windows,
        isMobile: false,
        expected: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) ${engine} Chrome/124.0.0.0 Safari/537.36`,
    },
    {
        name: "macOS desktop",
        platform: UserAgentPlatform.MacOS,
        isMobile: false,
        expected: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ${engine} Chrome/124.0.0.0 Safari/537.36`,
    },
    {
        name: "Linux desktop",
        platform: UserAgentPlatform.Linux,
        isMobile: false,
        expected: `Mozilla/5.0 (X11; Linux x86_64) ${engine} Chrome/124.0.0.0 Safari/537.36`,
    },
    {
        name: "ChromeOS desktop",
        platform: UserAgentPlatform.ChromeOS,
        isMobile: false,
        expected: `Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) ${engine} Chrome/124.0.0.0 Safari/537.36`,
    },
    {
        name: "Android phone",
        platform: UserAgentPlatform.Android,
        isMobile: true,
        expected: `Mozilla/5.0 (Linux; Android 10; K) ${engine} Chrome/124.0.0.0 Mobile Safari/537.36`,
    },
    {
        name: "Android tablet",
        platform: UserAgentPlatform.Android,
        isMobile: false,
        expected: `Mozilla/5.0 (Linux; Android 10; K) ${engine} Chrome/124.0.0.0 Safari/537.36`,
    },
];

describe("UserAgent.toString", () => {
    test.each(vectors)("builds the $name string", (vector) => {
        const userAgent = new UserAgent({
            version: chromeVersion,
            platform: vector.platform,
            isMobile: vector.isMobile,
        });

        expect(userAgent.toString()).toBe(vector.expected);
    });

    test("assumes Windows when no platform is given", () => {
        const userAgent = new UserAgent({ version: chromeVersion });

        expect(userAgent.toString()).toContain("(Windows NT 10.0; Win64; x64)");
    });

    test("reduces the build and patch numbers to zero", () => {
        const userAgent = new UserAgent({ version: "131.0.6778.86" });

        expect(userAgent.toString()).toContain("Chrome/131.0.0.0 ");
    });

    test("backs the string conversion of the instance", () => {
        const userAgent = new UserAgent({ version: chromeVersion });

        expect(String(userAgent)).toBe(userAgent.toString());
    });
});
