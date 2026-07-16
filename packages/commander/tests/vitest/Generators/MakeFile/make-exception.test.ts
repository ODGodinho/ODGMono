import { rm } from "node:fs/promises";

import { File } from "@odg/chemical-x";
import { NullLogger } from "@odg/log";
import { vi } from "vitest";

import MakeFile from "#app/Generators/MakeFile";

describe("makeEvent Test", () => {
    vi.spyOn(console, "log").mockImplementation(() => void 0);

    const make = new MakeFile(new NullLogger());

    const path = `${process.cwd()}/tests/vitest/cache`;
    const filePath1 = `${path}/LoginException.ts`;
    const filePath2 = `${path}/LoginUnknownException.ts`;

    afterAll(async () => {
        await Promise.all([
            rm(`${path}/LoginException.ts`, { force: true }),
            rm(`${path}/LoginUnknownException.ts`, { force: true }),
        ]);
    });

    test("Generate LoginException", async () => {
        await expect(make.generateException("Login", { path, isUnknown: false }))
            .resolves
            .toBeUndefined();

        const fileInstance1 = new File(filePath1);

        expect(await fileInstance1.exists())
            .toBeTruthy();
    });

    test("Generate LoginUnknownException", async () => {
        await expect(make.generateException("Login", { path, isUnknown: true }))
            .resolves
            .toBeUndefined();

        const fileInstance2 = new File(filePath2);

        expect(await fileInstance2.exists())
            .toBeTruthy();
    });
});
