/* eslint-disable sonarjs/no-duplicate-string, sonarjs/no-hardcoded-ip -- Chromium vector table. */
import { UserAgent } from "#app";
import type { UserAgentBrandInterface, UserAgentOptionsInterface } from "#interfaces";

interface BrandVectorInterface {
    name: string;
    options: UserAgentOptionsInterface;
    expected: UserAgentBrandInterface[];
}

/**
 * Same `GenerateBrandVersionList` cases of `user_agent_utils_unittest.cc`, now asking
 * for complete versions: the GREASE brand gains a `.0.0.0` tail and the real brands
 * carry the four part build number.
 */
const vectors: BrandVectorInterface[] = [
    {
        name: "pure Chromium build on seed 84",
        options: { version: "84.0.0.0", brand: null },
        expected: [
            { brand: "Not;A=Brand", version: "8.0.0.0" },
            { brand: "Chromium", version: "84.0.0.0" },
        ],
    },
    {
        name: "pure Chromium build on seed 85 swaps the order",
        options: { version: "85.0.0.0", brand: null },
        expected: [
            { brand: "Chromium", version: "85.0.0.0" },
            { brand: "Not=A?Brand", version: "99.0.0.0" },
        ],
    },
    {
        name: "product brand on seed 84",
        options: { version: "84.0.0.0", brand: "Totally A Brand" },
        expected: [
            { brand: "Not;A=Brand", version: "8.0.0.0" },
            { brand: "Chromium", version: "84.0.0.0" },
            { brand: "Totally A Brand", version: "84.0.0.0" },
        ],
    },
    {
        name: "additional brand alongside a product brand on seed 84",
        options: {
            version: "84.0.0.0",
            brand: "Product Brand",
            additionalBrands: [ { brand: "Add Brand", version: "1.0.0.0" } ],
        },
        expected: [
            { brand: "Chromium", version: "84.0.0.0" },
            { brand: "Product Brand", version: "84.0.0.0" },
            { brand: "Not;A=Brand", version: "8.0.0.0" },
            { brand: "Add Brand", version: "1.0.0.0" },
        ],
    },
    {
        name: "Chrome 124 stable",
        options: { version: "124.0.6367.60" },
        expected: [
            { brand: "Chromium", version: "124.0.6367.60" },
            { brand: "Google Chrome", version: "124.0.6367.60" },
            { brand: "Not-A.Brand", version: "99.0.0.0" },
        ],
    },
];

const chromeVersion = "124.0.6367.60";
const edgeVersion = "124.0.2478.51";

describe("UserAgent.fullVersionList", () => {
    test.each(vectors)("$name", (vector) => {
        expect(new UserAgent(vector.options).fullVersionList()).toStrictEqual(vector.expected);
    });

    test("keeps the exact brand order of the reduced list", () => {
        const userAgent = new UserAgent({
            version: chromeVersion,
            additionalBrands: [ { brand: "Microsoft Edge", version: edgeVersion } ],
        });

        expect(userAgent.fullVersionList().map((entry) => entry.brand))
            .toStrictEqual(userAgent.brands().map((entry) => entry.brand));
    });

    test("lets an additional brand inherit the declared browser version", () => {
        const brands = new UserAgent({
            version: chromeVersion,
            additionalBrands: [ { brand: "Add Brand" } ],
        }).fullVersionList();

        expect(brands).toContainEqual({ brand: "Add Brand", version: chromeVersion });
    });

    test("keeps the complete version of an additional brand", () => {
        const brands = new UserAgent({
            version: chromeVersion,
            additionalBrands: [ { brand: "Microsoft Edge", version: edgeVersion } ],
        }).fullVersionList();

        expect(brands).toContainEqual({ brand: "Microsoft Edge", version: edgeVersion });
    });
});
