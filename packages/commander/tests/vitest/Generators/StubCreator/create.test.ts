import { mkdir, rm, unlink } from "node:fs/promises";

import { File } from "@odg/chemical-x";
import { InvalidArgumentException } from "@odg/exception";

import StubCreator from "src/Generators/StubCreator";

describe("Create Page StubTest", () => {
    const stubCreator = new StubCreator();
    const path = `${process.cwd()}/tests/vitest/cache`;

    afterAll(async () => {
        unlink(`${path}/ExamplePage1.ts`).catch(() => null);
        unlink(`${path}/ExamplePage2.ts`).catch(() => null);
    });

    test("Generate ExamplePage", async () => {
        const filePath = `${path}/ExamplePage1.ts`;

        await expect(stubCreator.create("page", "ExamplePage1", path, {
            "PageName:UCFirst": "Payment",
            "PageName": "payment",
        }))
            .resolves
            .toBeDefined();

        expect(await new File(filePath).exists())
            .toBeTruthy();
    });

    test("Generate ExamplePage2 Exists", async () => {
        const filePath = `${path}/ExamplePage2.ts`;

        expect(await new File(filePath).exists())
            .toBeFalsy();

        await stubCreator.create("page", "ExamplePage2", path, {
            "PageName:UCFirst": "Payment",
            "PageName": "payment",
        });

        expect(await new File(filePath).exists())
            .toBeTruthy();

        const file = stubCreator.create("page", "ExamplePage2", path, {
            "PageName:UCFirst": "Payment",
            "PageName": "payment",
        });

        await expect(file)
            .rejects
            .toThrow(new InvalidArgumentException("The ExamplePage2 already exists."));
    });

    test("Generate when destination has no index.ts skips append", async () => {
        const directoryWithoutIndex = `${path}/no-index-dir`;

        await mkdir(directoryWithoutIndex, { recursive: true });
        const filePathNoIndex = `${directoryWithoutIndex}/ExamplePageNoIndex.ts`;

        try {
            await expect(stubCreator.create("page", "ExamplePageNoIndex", directoryWithoutIndex, {
                "PageName:UCFirst": "Payment",
                "PageName": "payment",
            }))
                .resolves
                .toBe(filePathNoIndex);

            expect(await new File(filePathNoIndex).exists())
                .toBeTruthy();
            expect(await new File(`${directoryWithoutIndex}/index.ts`).exists())
                .toBeFalsy();
        } finally {
            await unlink(filePathNoIndex).catch(() => null);
            await rm(directoryWithoutIndex, { recursive: true }).catch(() => null);
        }
    });
});
