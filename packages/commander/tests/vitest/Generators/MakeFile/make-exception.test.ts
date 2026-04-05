import { unlink } from "node:fs/promises";

import { File } from "@odg/chemical-x";
import { NullLogger } from "@odg/log";
import { vi } from "vitest";

import MakeFile from "src/Generators/MakeFile";

describe("makeEvent Test", () => {
    vi.spyOn(console, "log").mockImplementation(() => void 0);

    const make = new MakeFile(new NullLogger());

    const path = `${process.cwd()}/tests/vitest/cache`;
    const filePath1 = `${path}/LoginException.ts`;
    const filePath2 = `${path}/LoginUnknownException.ts`;

    afterAll(async () => {
        await Promise.all([
            unlink(`${path}/LoginException.ts`).catch(() => null),
            unlink(`${path}/LoginUnknownException.ts`).catch(() => null),
        ]);
    });

    test("Generate LoginException", async () => {
        await expect(make.makeException("Login", { path, isUnknown: false }))
            .resolves
            .toBeUndefined();

        expect(await new File(filePath1).exists())
            .toBeTruthy();
    });

    test("Generate LoginUnknownException", async () => {
        await expect(make.makeException("Login", { path, isUnknown: true }))
            .resolves
            .toBeUndefined();

        expect(await new File(filePath2).exists())
            .toBeTruthy();
    });
});
