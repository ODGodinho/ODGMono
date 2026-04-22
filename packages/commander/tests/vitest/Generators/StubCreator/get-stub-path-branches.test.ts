import { mkdir, rm, writeFile } from "node:fs/promises";

import { describe, expect, test } from "vitest";

import StubCreator from "src/Generators/StubCreator";

describe("StubCreator - getStubPath branches", () => {
    const root = `${process.cwd()}/tests/vitest/cache/stubcreator-stubpath`;

    test("Prefers local ./stubs when present", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(`${root}/stubs`, { recursive: true });
        await writeFile(`${root}/stubs/page.stub`, "export const ok = true;\n", "utf8");

        const previousCwd = process.cwd();

        process.chdir(root);

        try {
            const creator = new StubCreator();
            const stubPath = await creator.getStubPath("page");

            expect(stubPath.endsWith("/stubs")).toBe(true);
        } finally {
            process.chdir(previousCwd);
        }
    });

    test("Falls back to node_modules stubs when local missing", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        const previousCwd = process.cwd();

        process.chdir(root);

        try {
            const creator = new StubCreator();
            const stubPath = await creator.getStubPath("page");

            expect(stubPath.includes("node_modules/@odg/command/stubs")).toBe(true);
        } finally {
            process.chdir(previousCwd);
        }
    });
});
