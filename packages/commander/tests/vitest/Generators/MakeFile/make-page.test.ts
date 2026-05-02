import { readFile, unlink } from "node:fs/promises";

import { File } from "@odg/chemical-x";
import { NullLogger } from "@odg/log";
import { vi } from "vitest";

import MakeFile from "src/Generators/MakeFile";

describe("makePage Test", () => {
    vi.spyOn(console, "log").mockImplementation(() => void 0);

    const make = new MakeFile(new NullLogger());

    const path = `${process.cwd()}/tests/vitest/cache`;
    const filePath = `${path}/ExamplePage.ts`;

    afterEach(async () => {
        await unlink(`${path}/ExamplePage.ts`).catch(() => null);
    });
    afterEach(async () => {
        await unlink(`${path}/ExampleEventListener.ts`).catch(() => null);
    });
    afterEach(async () => {
        await unlink(`${path}/ExampleSelector.ts`).catch(() => null);
    });
    afterEach(async () => {
        await unlink(`${path}/ExampleToExampleHandler.ts`).catch(() => null);
    });
    afterEach(async () => {
        await unlink(`${path}/LoginPage.ts`).catch(() => null);
    });
    afterEach(async () => {
        await unlink(`${path}/LoginHandler.ts`).catch(() => null);
    });

    test("Generate ExamplePage", async () => {
        const makePage = make.makePage(
            "Example",
            {
                path,
                selectors: true,
                event: true,
                eventPath: path,
                selectorPath: path,
                handlerPath: path,
                handlerFrom: "Example",
            },
        );

        await expect(makePage)
            .resolves
            .toBeUndefined();

        expect(await new File(filePath).exists())
            .toBeTruthy();
    });

    test("Generate With To Handler", async () => {
        const makePage = make.makePage(
            "Example",
            {
                path,
                selectors: false,
                event: false,
                handlerPath: path,
                handlerTo: "Example",
            },
        );

        await expect(makePage)
            .resolves
            .toBeUndefined();

        expect(await new File(filePath).exists())
            .toBeTruthy();
    });

    test("Skips handler when handlerPath set but handlerFrom and handlerTo omitted", async () => {
        const handlerFile = `${path}/ExampleToExampleHandler.ts`;

        await expect(
            make.makePage("Example", {
                path,
                selectors: false,
                event: false,
                handlerPath: path,
            }),
        )
            .resolves
            .toBeUndefined();

        expect(await new File(filePath).exists())
            .toBeTruthy();
        expect(await new File(handlerFile).exists())
            .toBeFalsy();
    });

    test("creates LoginPage and LoginHandler when --handler flag is set", async () => {
        const pageFile = `${path}/LoginPage.ts`;
        const handlerFile = `${path}/LoginHandler.ts`;

        await expect(
            make.makePage("Login", {
                path,
                selectors: false,
                event: false,
                handlerPath: path,
                handler: true,
            }),
        )
            .resolves
            .toBeUndefined();

        expect(await new File(pageFile).exists())
            .toBeTruthy();
        expect(await new File(handlerFile).exists())
            .toBeTruthy();

        const handlerSource = await readFile(handlerFile, "utf8");

        expect(handlerSource.includes("export class LoginHandler"))
            .toBe(true);
    });
});
