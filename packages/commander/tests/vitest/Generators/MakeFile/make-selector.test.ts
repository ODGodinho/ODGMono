import { rm } from "node:fs/promises";

import { File } from "@odg/chemical-x";
import { NullLogger } from "@odg/log";
import { vi } from "vitest";

import MakeFile from "#app/Generators/MakeFile";

describe("makeSelectors Test", () => {
    vi.spyOn(console, "log").mockImplementation(() => void 0);

    const make = new MakeFile(new NullLogger());

    const path = `${process.cwd()}/tests/vitest/cache`;
    const filePath = `${path}/Example1Selector.ts`;

    afterAll(async () => {
        await rm(`${path}/Example1Selector.ts`, { force: true });
    });

    test("Generate Example1Selectors", async () => {
        await expect(make.generateSelectors("Example1", { path }))
            .resolves
            .toBeUndefined();

        const fileInstance = new File(filePath);

        expect(await fileInstance.exists())
            .toBeTruthy();
    });
});
