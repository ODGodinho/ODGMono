import {
    mkdir,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises";

import { describe, expect, test } from "vitest";

import StubCreator from "#app/Generators/StubCreator";

const selectorStubBody = "export const ok = true;\n";

describe("StubCreator - index.ts append idempotency", () => {
    const root = `${process.cwd()}/tests/vitest/cache/stubcreator-index`;

    test("Does not duplicate export when index.ts already contains it", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        // Fake local stubs so StubCreator reads from ./stubs.
        await mkdir(`${root}/stubs`, { recursive: true });
        await writeFile(`${root}/stubs/selector.stub`, selectorStubBody, "utf8");

        await mkdir(`${root}/out`, { recursive: true });
        await writeFile(`${root}/out/index.ts`, "export * from \"./Foo\";\n", "utf8");

        const previousCwd = process.cwd();

        process.chdir(root);

        try {
            const creator = new StubCreator();

            await creator.create("selector", "Foo", `${root}/out`, {
                "SelectorName:UCFirst": "Foo",
                "SelectorName:LCFirst": "foo",
            });
        } finally {
            process.chdir(previousCwd);
        }

        const text = await readFile(`${root}/out/index.ts`, "utf8");

        expect(text.match(/export \* from "\.\/Foo";/g)?.length ?? 0).toBe(1);
    });

    test("Appends export with newline when index.ts has no trailing newline", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        await mkdir(`${root}/stubs`, { recursive: true });
        await writeFile(`${root}/stubs/selector.stub`, selectorStubBody, "utf8");

        await mkdir(`${root}/out`, { recursive: true });
        await writeFile(`${root}/out/index.ts`, "export const x = 1;", "utf8");

        const previousCwd = process.cwd();

        process.chdir(root);

        try {
            const creator = new StubCreator();

            await creator.create("selector", "Bar", `${root}/out`, {
                "SelectorName:UCFirst": "Bar",
                "SelectorName:LCFirst": "bar",
            });
        } finally {
            process.chdir(previousCwd);
        }

        const text = await readFile(`${root}/out/index.ts`, "utf8");

        expect(text.includes("export const x = 1;\nexport * from \"./Bar\";\n")).toBe(true);
    });
});
