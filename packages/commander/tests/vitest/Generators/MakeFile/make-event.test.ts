import { unlink } from "node:fs/promises";

import { File } from "@odg/chemical-x";
import { NullLogger } from "@odg/log";
import { vi } from "vitest";

import MakeFile from "#app/Generators/MakeFile";

describe("makeEvent Test", () => {
    vi.spyOn(console, "log").mockImplementation(() => void 0);

    const make = new MakeFile(new NullLogger());

    const path = `${process.cwd()}/tests/vitest/cache`;
    const listenerFile = `${path}/ExampleEventListener.ts`;

    afterEach(async () => {
        await unlink(listenerFile).catch(() => null);
    });

    test("makeEvent does not create an EventListener file", async () => {
        await expect(make.makeEvent("Example", {}))
            .resolves
            .toBeUndefined();

        expect(await new File(listenerFile).exists())
            .toBeFalsy();
    });
});
