import {
    mkdir,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises";

import {
    beforeEach,
    describe,
    expect,
    test,
} from "vitest";

import { didRemoveEnvironmentVariable, findProjectLines, hasWord } from "#app/Registrations/config-removal";
import { didRemoveEnumMember, didRemoveObjectProperty } from "#app/Registrations/ts-mutators";

const root = `${process.cwd()}/tests/vitest/cache/config-removal`;
const dotenvPath = `${root}/.env`;

beforeEach(async () => {
    await rm(root, { recursive: true, force: true });
    await mkdir(`${root}/cache`, { recursive: true });
});

describe("didRemoveEnvironmentVariable", () => {
    test("is false for a file that is not there, and does not create it", async () => {
        expect(await didRemoveEnvironmentVariable({ filePath: dotenvPath, key: "A" })).toBe(false);
        await expect(readFile(dotenvPath, "utf8")).rejects.toThrow("ENOENT");
    });

    test("is false, and leaves the file alone, when the variable is not in it", async () => {
        await writeFile(dotenvPath, "B=1\nAB=2\n", "utf8");

        expect(await didRemoveEnvironmentVariable({ filePath: dotenvPath, key: "A" })).toBe(false);
        expect(await readFile(dotenvPath, "utf8")).toBe("B=1\nAB=2\n");
    });

    test.each([
        [ "the first variable, and the blank line it leaves at the top", "A=1\n\nB=2\n", "B=2\n" ],
        [ "an exported variable in a file with no final newline", "# about A\nexport A = 1", "" ],
        [ "the last variable of a file with no final newline", "B=2\n\nA=1", "B=2" ],
        [ "a variable, keeping a blank line that separates other things", "X=1\n\nA=1\nB=2\n", "X=1\n\nB=2\n" ],
    ])("removes %s", async (_title, before, after) => {
        await writeFile(dotenvPath, before, "utf8");

        expect(await didRemoveEnvironmentVariable({ filePath: dotenvPath, key: "A" })).toBe(true);
        expect(await readFile(dotenvPath, "utf8")).toBe(after);
    });
});

describe("didRemoveEnumMember", () => {
    test("is false for a file, an enum or a member that is not there", async () => {
        await writeFile(`${root}/E.ts`, "export enum Other { \"A\" = \"A\" }\nexport enum ConfigName { \"B\" = \"B\" }\n", "utf8");

        expect(await didRemoveEnumMember({ filePath: `${root}/none.ts`, enumName: "ConfigName", memberName: "B" })).toBe(false);
        expect(await didRemoveEnumMember({ filePath: `${root}/E.ts`, enumName: "Missing", memberName: "B" })).toBe(false);
        expect(await didRemoveEnumMember({ filePath: `${root}/E.ts`, enumName: "ConfigName", memberName: "A" })).toBe(false);
    });
});

describe("didRemoveObjectProperty", () => {
    test("is false for a file that is not there, or a property that is not in it", async () => {
        await writeFile(`${root}/o.ts`, "export const o = { a: 1 };\n", "utf8");

        expect(await didRemoveObjectProperty({ filePath: `${root}/none.ts`, propertyName: "a" })).toBe(false);
        expect(await didRemoveObjectProperty({ filePath: `${root}/o.ts`, propertyName: "b" })).toBe(false);
    });

    test("removes it from every object of the file", async () => {
        await writeFile(`${root}/o.ts`, "export const o = { a: 1, b: 2 };\nexport const p = { a: 3 };\n", "utf8");

        expect(await didRemoveObjectProperty({ filePath: `${root}/o.ts`, propertyName: "a" })).toBe(true);
        expect(await readFile(`${root}/o.ts`, "utf8")).toBe("export const o = { b: 2 };\nexport const p = { };\n");
    });

    test("keeps the trailing comma of a multiline object when its last property goes", async () => {
        await writeFile(`${root}/o.ts`, "export const o = {\n    a: 1,\n    b: 2,\n};\n", "utf8");
        await didRemoveObjectProperty({ filePath: `${root}/o.ts`, propertyName: "b" });

        expect(await readFile(`${root}/o.ts`, "utf8")).toBe("export const o = {\n    a: 1,\n};\n");
    });
});

describe("hasWord", () => {
    test("matches the whole word only", () => {
        expect(hasWord("get(ConfigName.DB_HOST)", "ConfigName.DB_HOST")).toBe(true);
        expect(hasWord("DB_HOST_REPLICA and DB_HOST", "DB_HOST")).toBe(true);
        expect(hasWord("DB_HOST_REPLICA, MY_DB_HOST", "DB_HOST")).toBe(false);
    });
});

describe("findProjectLines", () => {
    test("looks at source, docs and dotenv files; skips dependencies, caches and what the caller edits", async () => {
        await writeFile(`${root}/a.ts`, "KEY\n", "utf8");
        await writeFile(`${root}/b.md`, "no\nKEY here\n", "utf8");
        await writeFile(`${root}/.env.local`, "KEY=1\n", "utf8");
        await writeFile(`${root}/c.txt`, "KEY\n", "utf8");
        await writeFile(`${root}/cache/d.ts`, "KEY\n", "utf8");
        await writeFile(`${root}/skipped.ts`, "KEY\n", "utf8");

        const found = await findProjectLines({
            root,
            skip: [ `${root}/skipped.ts` ],
            matches: (text) => text.includes("KEY"),
        });

        expect(found.map(({ file, line }) => `${file}:${line}`).toSorted((first, second) => first.localeCompare(second)))
            .toEqual([ ".env.local:1", "a.ts:1", "b.md:2" ]);
    });
});
