import { UserAgent } from "#app";

const chromeVersion = "124.0.6367.60";
const edgeBrand = "Microsoft Edge";
const edgeVersion = "124.0.2478.51";

describe("UserAgent.clone", () => {
    test("returns a new instance", () => {
        const userAgent = new UserAgent({ version: chromeVersion });
        const copy = userAgent.clone();

        expect(copy).toBeInstanceOf(UserAgent);
        expect(copy).not.toBe(userAgent);
    });

    test("produces the same identity", () => {
        const userAgent = new UserAgent({
            version: chromeVersion,
            additionalBrands: [ { brand: edgeBrand, version: edgeVersion } ],
        });

        expect(userAgent.clone().cdpParams()).toStrictEqual(userAgent.cdpParams());
    });

    test("clones an identity that has no additional brands", () => {
        const userAgent = new UserAgent({ version: chromeVersion });

        expect(userAgent.clone().cdpParams()).toStrictEqual(userAgent.cdpParams());
    });

    test("stops sharing the additional brand list with the original", () => {
        const additional = [ { brand: edgeBrand, version: edgeVersion } ];
        const userAgent = new UserAgent({ version: chromeVersion, additionalBrands: additional });
        const copy = userAgent.clone();

        additional[0].brand = "Mutated Brand";

        expect(copy.brands()).toContainEqual({ brand: edgeBrand, version: "124" });
        expect(userAgent.brands()).toContainEqual({ brand: "Mutated Brand", version: "124" });
    });
});
