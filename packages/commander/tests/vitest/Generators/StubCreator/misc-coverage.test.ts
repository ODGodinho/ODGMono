import { mkdir, rm, writeFile } from "node:fs/promises";

import { InvalidArgumentException } from "@odg/exception";
import { describe, expect, test } from "vitest";

import StubCreator from "src/Generators/StubCreator";

describe("StubCreator - misc coverage", () => {
    const root = `${process.cwd()}/tests/vitest/cache/stubcreator-misc`;

    test("getPath builds destination path", async () => {
        const creator = new StubCreator();
        const basePath = `${root}/tmp`;

        await expect(creator.getPath("Foo", basePath)).resolves.toBe(`${basePath}/Foo.ts`);
    });

    test("create throws when destination file already exists", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(`${root}/stubs`, { recursive: true });
        await mkdir(`${root}/out`, { recursive: true });

        await writeFile(`${root}/stubs/page.stub`, "export const ok = true;\n", "utf8");
        await writeFile(`${root}/out/Foo.ts`, "export const x = 1;", "utf8");

        const previousCwd = process.cwd();

        process.chdir(root);

        try {
            const creator = new StubCreator();

            await expect(creator.create("page", "Foo", `${root}/out`, {
                "PageName:UCFirst": "Foo",
                "PageName:LCFirst": "foo",
            })).rejects.toBeInstanceOf(InvalidArgumentException);
        } finally {
            process.chdir(previousCwd);
        }
    });

    test("create does not append when index.ts missing", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(`${root}/stubs`, { recursive: true });
        await mkdir(`${root}/out`, { recursive: true });

        await writeFile(`${root}/stubs/handler.stub`, "export const ok = true;\n", "utf8");

        const previousCwd = process.cwd();

        process.chdir(root);

        try {
            const creator = new StubCreator();

            await expect(creator.create("handler", "FooHandler", `${root}/out`, {
                "HandlerClassName": "FooHandler",
            })).resolves.toContain("/out/FooHandler.ts");
        } finally {
            process.chdir(previousCwd);
        }
    });
});
