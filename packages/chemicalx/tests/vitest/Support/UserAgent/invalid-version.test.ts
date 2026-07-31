import { UserAgent } from "#app";
import { InvalidArgumentException } from "#exceptions";

const blankLength = 3;
const invalidVersions = [ "", " ".repeat(blankLength), "stable", "v124", ".124", "Chrome/124" ];
const chromeVersion = "124.0.6367.60";

describe("UserAgent invalid version", () => {
    test.each(invalidVersions)("rejects %j when building the User-Agent string", (version) => {
        expect(() => new UserAgent({ version }).toString()).toThrow(InvalidArgumentException);
    });

    test.each(invalidVersions)("rejects %j when building the brand list", (version) => {
        expect(() => new UserAgent({ version }).brands()).toThrow(InvalidArgumentException);
    });

    test("does not fail at construction time", () => {
        expect(() => new UserAgent({ version: "stable" })).not.toThrow();
    });

    test("names the offending version in the message", () => {
        expect(() => new UserAgent({ version: "v124" }).toString())
            .toThrow("Invalid browser version \"v124\", expected a number first like \"124.0.6367.60\"");
    });

    test("rejects an additional brand whose version has no leading digits", () => {
        const userAgent = new UserAgent({
            version: chromeVersion,
            additionalBrands: [ { brand: "Add Brand", version: "beta" } ],
        });

        expect(() => userAgent.brands()).toThrow(InvalidArgumentException);
    });

    test("passes through an additional brand version that has no leading digits in the full list", () => {
        const userAgent = new UserAgent({
            version: chromeVersion,
            additionalBrands: [ { brand: "Add Brand", version: "beta" } ],
        });

        expect(userAgent.fullVersionList()).toContainEqual({ brand: "Add Brand", version: "beta" });
    });
});
