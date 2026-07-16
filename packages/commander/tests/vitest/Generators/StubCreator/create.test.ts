import { mkdir, rm } from "node:fs/promises";

import { File } from "@odg/chemical-x";
import { InvalidArgumentException } from "@odg/exception";

import StubCreator from "#app/Generators/StubCreator";

describe("Create Page StubTest", () => {
    const stubCreator = new StubCreator();
    const path = `${process.cwd()}/tests/vitest/cache`;

    afterAll(async () => {
        await Promise.all([
            rm(`${path}/ExamplePage1.ts`, { force: true }),
            rm(`${path}/ExamplePage2.ts`, { force: true }),
        ]);
    });

    test("Generate ExamplePage", async () => {
        const file = new File(`${path}/ExamplePage1.ts`);

        await expect(stubCreator.create("page", "ExamplePage1", path, {
            "PageName:UCFirst": "Payment",
            "PageName": "payment",
        }))
            .resolves
            .toBeDefined();

        expect(await file.exists())
            .toBeTruthy();
    });

    test("Generate ExamplePage2 Exists", async () => {
        const fileClass = new File(`${path}/ExamplePage2.ts`);

        expect(await fileClass.exists())
            .toBeFalsy();

        await stubCreator.create("page", "ExamplePage2", path, {
            "PageName:UCFirst": "Payment",
            "PageName": "payment",
        });

        expect(await fileClass.exists())
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
        const indexFilePath = `${directoryWithoutIndex}/index.ts`;

        await mkdir(directoryWithoutIndex, { recursive: true });
        const fileNoIndex = new File(`${directoryWithoutIndex}/ExamplePageNoIndex.ts`);
        const indexFile = new File(indexFilePath);

        try {
            await expect(stubCreator.create("page", "ExamplePageNoIndex", directoryWithoutIndex, {
                "PageName:UCFirst": "Payment",
                "PageName": "payment",
            }))
                .resolves
                .toBe(fileNoIndex.subject);

            expect(await fileNoIndex.exists())
                .toBeTruthy();
            expect(await indexFile.exists())
                .toBeFalsy();
        } finally {
            await rm(directoryWithoutIndex, { recursive: true, force: true });
        }
    });
});
