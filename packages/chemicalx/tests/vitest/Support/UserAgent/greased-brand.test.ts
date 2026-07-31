/* eslint-disable sonarjs/no-hardcoded-ip -- Browser build numbers, not IP addresses. */
import { UserAgent, UserAgentVersionType } from "#app";

const greaseCharsetLength = 11;
const greaseCharPosition = 3;
const seedSweepLength = 110;

/**
 * Seeds 84/85/86 come from `user_agent_utils_unittest.cc`; the remaining ones were
 * observed on shipped Chrome stable releases.
 */
const vectors = [
    {
        version: "84",
        brand: "Not;A=Brand",
        major: "8",
        full: "8.0.0.0",
    },
    {
        version: "85",
        brand: "Not=A?Brand",
        major: "99",
        full: "99.0.0.0",
    },
    {
        version: "86",
        brand: "Not?A_Brand",
        major: "24",
        full: "24.0.0.0",
    },
    {
        version: "116.0.5845.96",
        brand: "Not)A;Brand",
        major: "24",
        full: "24.0.0.0",
    },
    {
        version: "119.0.6045.105",
        brand: "Not?A_Brand",
        major: "24",
        full: "24.0.0.0",
    },
    {
        version: "120.0.6099.109",
        brand: "Not_A Brand",
        major: "8",
        full: "8.0.0.0",
    },
    {
        version: "124.0.6367.60",
        brand: "Not-A.Brand",
        major: "99",
        full: "99.0.0.0",
    },
    {
        version: "131.0.6778.86",
        brand: "Not_A Brand",
        major: "24",
        full: "24.0.0.0",
    },
];

describe("UserAgent.greasedBrand", () => {
    test.each(vectors)("major grease brand of $version", (vector) => {
        const greased = new UserAgent({ version: vector.version })
            .greasedBrand(UserAgentVersionType.Major);

        expect(greased).toStrictEqual({ brand: vector.brand, version: vector.major });
    });

    test.each(vectors)("full grease brand of $version", (vector) => {
        const greased = new UserAgent({ version: vector.version })
            .greasedBrand(UserAgentVersionType.Full);

        expect(greased).toStrictEqual({ brand: vector.brand, version: vector.full });
    });

    test.each(vectors)("falls back to the major grease brand of $version", (vector) => {
        const greased = new UserAgent({ version: vector.version }).greasedBrand();

        expect(greased).toStrictEqual({ brand: vector.brand, version: vector.major });
    });

    test("never produces a brand starting with a space", () => {
        const leading = new Set<string>();

        for (let seed = 0; seed < seedSweepLength; seed++) {
            leading.add(new UserAgent({ version: `${seed}` }).greasedBrand().brand.charAt(0));
        }

        expect([ ...leading ]).toStrictEqual([ "N" ]);
    });

    test("walks the whole GREASE character set across consecutive seeds", () => {
        const chars = new Set<string>();

        for (let seed = 0; seed < greaseCharsetLength; seed++) {
            chars.add(new UserAgent({ version: `${seed}` }).greasedBrand().brand.charAt(greaseCharPosition));
        }

        expect(chars.size).toBe(greaseCharsetLength);
    });

    test("keeps the same brand for every build of the same release", () => {
        const early = new UserAgent({ version: "124.0.6367.60" }).greasedBrand();
        const late = new UserAgent({ version: "124.0.6367.243" }).greasedBrand();

        expect(early).toStrictEqual(late);
    });
});
