import { UserAgent, UserAgentPlatform } from "#app";

const chromeVersion = "124.0.6367.60";
const brandList = "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"";
const fullBrandList = "\"Chromium\";v=\"124.0.6367.60\", \"Google Chrome\";v=\"124.0.6367.60\""
    + ", \"Not-A.Brand\";v=\"99.0.0.0\"";

describe("UserAgent.headers", () => {
    test("serializes every hint of a Chrome 124 Windows desktop", () => {
        const headers = new UserAgent({
            version: chromeVersion,
            platform: UserAgentPlatform.Windows,
        }).headers();

        expect(headers).toStrictEqual({
            "Sec-CH-UA": brandList,
            "Sec-CH-UA-Arch": "\"x86\"",
            "Sec-CH-UA-Bitness": "\"64\"",
            "Sec-CH-UA-Form-Factors": "\"Desktop\"",
            "Sec-CH-UA-Full-Version": "\"124.0.6367.60\"",
            "Sec-CH-UA-Full-Version-List": fullBrandList,
            "Sec-CH-UA-Mobile": "?0",
            "Sec-CH-UA-Model": "\"\"",
            "Sec-CH-UA-Platform": "\"Windows\"",
            "Sec-CH-UA-Platform-Version": "\"15.0.0\"",
            "Sec-CH-UA-WoW64": "?0",
        });
    });

    test("serializes every hint of a Chrome 124 Android phone", () => {
        const headers = new UserAgent({
            version: chromeVersion,
            platform: UserAgentPlatform.Android,
            isMobile: true,
        }).headers();

        expect(headers).toStrictEqual({
            "Sec-CH-UA": brandList,
            "Sec-CH-UA-Arch": "\"\"",
            "Sec-CH-UA-Bitness": "\"\"",
            "Sec-CH-UA-Form-Factors": "\"Mobile\"",
            "Sec-CH-UA-Full-Version": "\"124.0.6367.60\"",
            "Sec-CH-UA-Full-Version-List": fullBrandList,
            "Sec-CH-UA-Mobile": "?1",
            "Sec-CH-UA-Model": "\"Pixel 8\"",
            "Sec-CH-UA-Platform": "\"Android\"",
            "Sec-CH-UA-Platform-Version": "\"14.0.0\"",
            "Sec-CH-UA-WoW64": "?0",
        });
    });

    test("omits the form factors header when the release never sent it", () => {
        const headers = new UserAgent({
            version: chromeVersion,
            shouldIncludeFormFactors: false,
        }).headers();

        expect(headers).not.toHaveProperty("Sec-CH-UA-Form-Factors");
    });

    test("flags a 32 bit build running under the Windows emulation layer", () => {
        const headers = new UserAgent({ version: chromeVersion, isWow64: true }).headers();

        expect(headers["Sec-CH-UA-WoW64"]).toBe("?1");
    });

    test("sends an empty platform version on Linux", () => {
        const headers = new UserAgent({
            version: chromeVersion,
            platform: UserAgentPlatform.Linux,
        }).headers();

        expect(headers["Sec-CH-UA-Platform-Version"]).toBe("\"\"");
    });

    test("sends the build number as platform version on ChromeOS", () => {
        const headers = new UserAgent({
            version: chromeVersion,
            platform: UserAgentPlatform.ChromeOS,
        }).headers();

        expect(headers["Sec-CH-UA-Platform-Version"]).toBe("\"14541.0.0\"");
    });

    test("keeps the lowercase macOS token", () => {
        const headers = new UserAgent({
            version: chromeVersion,
            platform: UserAgentPlatform.MacOS,
        }).headers();

        expect(headers["Sec-CH-UA-Platform"]).toBe("\"macOS\"");
    });

    test("escapes quotes and backslashes as the Structured Fields grammar requires", () => {
        const headers = new UserAgent({
            version: chromeVersion,
            brand: null,
            model: String.raw`Weird "Model" \ Here`,
        }).headers();

        expect(headers["Sec-CH-UA-Model"]).toBe(String.raw`"Weird \"Model\" \\ Here"`);
    });

    test("keeps the Edge brand list in sync between both brand headers", () => {
        const headers = new UserAgent({
            version: "124.0.2478.51",
            brand: "Microsoft Edge",
        }).headers();

        expect(headers["Sec-CH-UA"]).toContain("\"Microsoft Edge\";v=\"124\"");
        expect(headers["Sec-CH-UA-Full-Version-List"]).toContain("\"Microsoft Edge\";v=\"124.0.2478.51\"");
    });
});
