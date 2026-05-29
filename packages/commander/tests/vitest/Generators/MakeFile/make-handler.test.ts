import { unlink } from "node:fs/promises";

import { File } from "@odg/chemical-x";
import { NullLogger } from "@odg/log";
import { vi } from "vitest";

import MakeFile from "#app/Generators/MakeFile";

describe("makeHandler Test", () => {
    vi.spyOn(console, "log").mockImplementation(() => void 0);
    const make = new MakeFile(new NullLogger());

    const path = `${process.cwd()}/tests/vitest/cache`;
    let filePath: string;

    test("Generate HomeToLoginHandler", async () => {
        filePath = `${path}/HomeToLoginHandler.ts`;
        await expect(make.makeHandler("Home", { path, handlerTo: "Login" }))
            .resolves
            .toBeUndefined();

        expect(await new File(filePath).exists())
            .toBeTruthy();

        unlink(filePath).catch(() => null);
    });

    test("Generate LoginToHomeHandler", async () => {
        filePath = `${path}/LoginToHomeHandler.ts`;
        await expect(make.makeHandler("Home", { path, handlerFrom: "Login" }))
            .resolves
            .toBeUndefined();

        expect(await new File(filePath).exists())
            .toBeTruthy();

        unlink(filePath).catch(() => null);
    });

    test("Generate From and To Handler", async () => {
        filePath = `${path}/LoginToHomeHandler.ts`;
        await expect(make.makeHandler("Home", { path, handlerFrom: "Login", handlerTo: "Home" }))
            .resolves
            .toBeUndefined();

        expect(await new File(filePath).exists())
            .toBeTruthy();

        unlink(filePath).catch(() => null);
    });

    test("Generate handler without handler-from or handler-to", async () => {
        filePath = `${path}/LoginHandler.ts`;
        await expect(make.makeHandler("Login", { path }))
            .resolves
            .toBeUndefined();

        expect(await new File(filePath).exists())
            .toBeTruthy();

        unlink(filePath).catch(() => null);
    });
});
