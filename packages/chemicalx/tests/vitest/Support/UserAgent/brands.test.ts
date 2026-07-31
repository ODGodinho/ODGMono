/* eslint-disable sonarjs/no-duplicate-string -- Vector table copied from the Chromium unit tests. */
import { UserAgent } from "#app";
import type { UserAgentBrandInterface, UserAgentOptionsInterface } from "#interfaces";

interface BrandVectorInterface {
    name: string;
    options: UserAgentOptionsInterface;
    expected: UserAgentBrandInterface[];
}

/**
 * The first six vectors are the `GenerateBrandVersionList` cases of
 * `user_agent_utils_unittest.cc`; the last four are `Sec-CH-UA` values observed on
 * shipped Chrome stable releases, which also pin down the permutation order.
 */
const vectors: BrandVectorInterface[] = [
    {
        name: "pure Chromium build on seed 84",
        options: { version: "84", brand: null },
        expected: [
            { brand: "Not;A=Brand", version: "8" },
            { brand: "Chromium", version: "84" },
        ],
    },
    {
        name: "pure Chromium build on seed 85 swaps the order",
        options: { version: "85", brand: null },
        expected: [
            { brand: "Chromium", version: "85" },
            { brand: "Not=A?Brand", version: "99" },
        ],
    },
    {
        name: "product brand on seed 84",
        options: { version: "84", brand: "Totally A Brand" },
        expected: [
            { brand: "Not;A=Brand", version: "8" },
            { brand: "Chromium", version: "84" },
            { brand: "Totally A Brand", version: "84" },
        ],
    },
    {
        name: "additional brand without a product brand on seed 84",
        options: {
            version: "84",
            brand: null,
            additionalBrands: [ { brand: "Add Brand", version: "1" } ],
        },
        expected: [
            { brand: "Not;A=Brand", version: "8" },
            { brand: "Chromium", version: "84" },
            { brand: "Add Brand", version: "1" },
        ],
    },
    {
        name: "additional brand alongside a product brand on seed 84",
        options: {
            version: "84",
            brand: "Product Brand",
            additionalBrands: [ { brand: "Add Brand", version: "1" } ],
        },
        expected: [
            { brand: "Chromium", version: "84" },
            { brand: "Product Brand", version: "84" },
            { brand: "Not;A=Brand", version: "8" },
            { brand: "Add Brand", version: "1" },
        ],
    },
    {
        name: "additional brand alongside a product brand on seed 86",
        options: {
            version: "86",
            brand: "Product Brand",
            additionalBrands: [ { brand: "Add Brand", version: "1" } ],
        },
        expected: [
            { brand: "Product Brand", version: "86" },
            { brand: "Chromium", version: "86" },
            { brand: "Not?A_Brand", version: "24" },
            { brand: "Add Brand", version: "1" },
        ],
    },
    {
        name: "Chrome 116 stable",
        options: { version: "116.0.5845.96" },
        expected: [
            { brand: "Chromium", version: "116" },
            { brand: "Not)A;Brand", version: "24" },
            { brand: "Google Chrome", version: "116" },
        ],
    },
    {
        name: "Chrome 120 stable",
        options: { version: "120.0.6099.109" },
        expected: [
            { brand: "Not_A Brand", version: "8" },
            { brand: "Chromium", version: "120" },
            { brand: "Google Chrome", version: "120" },
        ],
    },
    {
        name: "Chrome 124 stable",
        options: { version: "124.0.6367.60" },
        expected: [
            { brand: "Chromium", version: "124" },
            { brand: "Google Chrome", version: "124" },
            { brand: "Not-A.Brand", version: "99" },
        ],
    },
    {
        name: "Chrome 131 stable",
        options: { version: "131.0.6778.86" },
        expected: [
            { brand: "Google Chrome", version: "131" },
            { brand: "Chromium", version: "131" },
            { brand: "Not_A Brand", version: "24" },
        ],
    },
];

const chromeVersion = "124.0.6367.60";

describe("UserAgent.brands", () => {
    test.each(vectors)("$name", (vector) => {
        expect(new UserAgent(vector.options).brands()).toStrictEqual(vector.expected);
    });

    test("defaults the product brand to Google Chrome", () => {
        const brands = new UserAgent({ version: chromeVersion }).brands();

        expect(brands.map((entry) => entry.brand)).toContain("Google Chrome");
    });

    test("drops the product brand when it is explicitly null", () => {
        const brands = new UserAgent({ version: chromeVersion, brand: null }).brands();

        expect(brands).toStrictEqual([
            { brand: "Not-A.Brand", version: "99" },
            { brand: "Chromium", version: "124" },
        ]);
    });

    test("reduces the version of an additional brand to its release number", () => {
        const brands = new UserAgent({
            version: chromeVersion,
            additionalBrands: [ { brand: "Microsoft Edge", version: "124.0.2478.51" } ],
        }).brands();

        expect(brands).toContainEqual({ brand: "Microsoft Edge", version: "124" });
    });

    test("lets an additional brand inherit the declared browser version", () => {
        const brands = new UserAgent({
            version: chromeVersion,
            additionalBrands: [ { brand: "Add Brand" } ],
        }).brands();

        expect(brands).toContainEqual({ brand: "Add Brand", version: "124" });
    });

    test("ignores surrounding whitespace in the declared version", () => {
        const padded = new UserAgent({ version: `  ${chromeVersion}  ` }).brands();
        const clean = new UserAgent({ version: chromeVersion }).brands();

        expect(padded).toStrictEqual(clean);
    });
});
