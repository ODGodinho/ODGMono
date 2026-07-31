import { UserAgent, UserAgentPlatform } from "#app";

const chromeVersion = "124.0.6367.60";

describe("UserAgent.metadata", () => {
    test("describes a Chrome 124 Windows desktop", () => {
        const metadata = new UserAgent({
            version: chromeVersion,
            platform: UserAgentPlatform.Windows,
        }).metadata();

        expect(metadata).toStrictEqual({
            brands: [
                { brand: "Chromium", version: "124" },
                { brand: "Google Chrome", version: "124" },
                { brand: "Not-A.Brand", version: "99" },
            ],
            fullVersionList: [
                { brand: "Chromium", version: chromeVersion },
                { brand: "Google Chrome", version: chromeVersion },

                // eslint-disable-next-line sonarjs/no-hardcoded-ip -- GREASE build number, not an IP
                { brand: "Not-A.Brand", version: "99.0.0.0" },
            ],
            fullVersion: chromeVersion,
            platform: "Windows",
            platformVersion: "15.0.0",
            architecture: "x86",
            model: "",
            mobile: false,
            bitness: "64",
            wow64: false,
            formFactors: [ "Desktop" ],
        });
    });

    test("describes a Chrome 124 Android phone", () => {
        const metadata = new UserAgent({
            version: chromeVersion,
            platform: UserAgentPlatform.Android,
            isMobile: true,
        }).metadata();

        expect(metadata).toMatchObject({
            platform: "Android",
            platformVersion: "14.0.0",
            architecture: "",
            bitness: "",
            model: "Pixel 8",
            mobile: true,
            formFactors: [ "Mobile" ],
        });
    });

    test("reports no device model on a desktop identity", () => {
        const metadata = new UserAgent({
            version: chromeVersion,
            platform: UserAgentPlatform.Android,
        }).metadata();

        expect(metadata.model).toBe("");
    });

    test("honours every explicit override", () => {
        const metadata = new UserAgent({
            version: chromeVersion,
            platformVersion: "10.0.0",
            architecture: "arm",
            bitness: "32",
            model: "Custom Device",
            isWow64: true,
        }).metadata();

        expect(metadata).toMatchObject({
            platformVersion: "10.0.0",
            architecture: "arm",
            bitness: "32",
            model: "Custom Device",
            wow64: true,
        });
    });

    test("keeps an explicitly empty model on a mobile identity", () => {
        const metadata = new UserAgent({
            version: chromeVersion,
            platform: UserAgentPlatform.Android,
            isMobile: true,
            model: "",
        }).metadata();

        expect(metadata.model).toBe("");
    });

    test("drops form factors when the release never sent them", () => {
        const metadata = new UserAgent({
            version: chromeVersion,
            shouldIncludeFormFactors: false,
        }).metadata();

        expect(metadata).not.toHaveProperty("formFactors");
    });

    test("advertises the same brands, in the same order, in both lists", () => {
        const metadata = new UserAgent({
            version: "131.0.6778.86",
            additionalBrands: [ { brand: "Microsoft Edge", version: "131.0.2903.51" } ],
        }).metadata();

        expect(metadata.fullVersionList.map((entry) => entry.brand))
            .toStrictEqual(metadata.brands.map((entry) => entry.brand));
    });
});
