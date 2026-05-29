import { readFile, unlink } from "node:fs/promises";

import { File } from "@odg/chemical-x";
import { NullLogger } from "@odg/log";
import { vi } from "vitest";

import MakeFile from "#app/Generators/MakeFile";

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
                event: "Example",
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

    test("makePage with --listeners and --event scaffolds listener bound to that event", async () => {
        const listenerFile = `${path}/ExampleEventListener.ts`;

        await expect(
            make.makePage("Example", {
                path,
                selectors: false,
                event: "Checkout",
                listeners: true,
                listenersPath: path,
            }),
        )
            .resolves
            .toBeUndefined();

        expect(await new File(listenerFile).exists())
            .toBeTruthy();

        const source = await readFile(listenerFile, "utf8");

        expect(source.includes("EventName.CheckoutEvent")).toBe(true);
        expect(source.includes("export class ExampleEventListener")).toBe(true);
    });

    test("makePage skips listener scaffold when listeners is true but no output path", async () => {
        const listenerFile = `${path}/ExampleEventListener.ts`;

        await expect(
            make.makePage("Example", {
                path,
                selectors: false,
                listeners: true,
            }),
        )
            .resolves
            .toBeUndefined();

        expect(await new File(listenerFile).exists())
            .toBeFalsy();
    });

    test("makePage listener defaults event binding to page name when --event omitted", async () => {
        const listenerFile = `${path}/ExampleEventListener.ts`;

        await expect(
            make.makePage("Example", {
                path,
                selectors: false,
                listeners: true,
                listenersPath: path,
            }),
        )
            .resolves
            .toBeUndefined();

        const source = await readFile(listenerFile, "utf8");

        expect(source.includes("EventName.ExampleEvent")).toBe(true);

        await unlink(listenerFile).catch(() => null);
    });
});
