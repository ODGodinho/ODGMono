import { mkdir, readFile } from "node:fs/promises";
import nodePath from "node:path";

import { NullLogger } from "@odg/log";
import { describe, expect, test } from "vitest";

import MakeFile from "#app/Generators/MakeFile";
import { registerArtifact } from "#app/Registrations/register";

import { preparePageRegistrationFixture } from "../../helpers/prepare-page-registration-fixture";

describe("Registrations - page", () => {
    const make = new MakeFile(new NullLogger());
    const cacheRoot = `${process.cwd()}/tests/vitest/cache/registrations-page`;

    test("Registers ContainerName + ContainerInterface + pages index (idempotent)", async () => {
        const paths = await preparePageRegistrationFixture(cacheRoot);

        const registrationTargets = {
            containerEnumPath: paths.containerEnumPath,
            containerInterfacePath: paths.containerInterfacePath,
            pagesIndexPath: paths.pagesIndexPath,
            typeImports: [ "import type { ContainerName } from \"./ContainerName\";" ],
        };

        // Create pages in the same directory as the barrel (Pages)
        const pagesPath = nodePath.dirname(paths.pagesIndexPath);

        const pageOptions = {
            path: pagesPath,
            selectors: false,
            register: true,
            registrationTargets,
        };

        await make.generatePage("Example", pageOptions);
        await make.generatePage("Example2", pageOptions);

        await make.generateSelectors("Example", { path: pagesPath, register: false });

        const enumText = await readFile(paths.containerEnumPath, "utf8");

        expect(enumText.match(/"ExamplePage"\s*=\s*"example\.page"/g)?.length ?? 0).toBe(1);
        expect(enumText.match(/"Example2Page"\s*=\s*"example2\.page"/g)?.length ?? 0).toBe(1);

        const ifaceText = await readFile(paths.containerInterfacePath, "utf8");

        expect(ifaceText).toContain("import { ExamplePage, Example2Page } from \"@pages\";");
        expect(ifaceText).toContain("[ContainerName.ExamplePage]: ExamplePage;");
        expect(ifaceText).toContain("[ContainerName.Example2Page]: Example2Page;");

        const barrelText = await readFile(paths.pagesIndexPath, "utf8");

        expect(barrelText).toContain("export * from \"./ExamplePage\";");
        expect(barrelText).toContain("export * from \"./Example2Page\";");
    });

    test("Registers page without filePath (fallback mode)", async () => {
        const paths = await preparePageRegistrationFixture(`${cacheRoot}-fallback`);

        const registrationTargets = {
            pagesIndexPath: paths.pagesIndexPath,
        };

        // Register without filePath to test the fallback logic
        await registerArtifact({
            kind: "page",
            name: "FallbackTest",
            pageClassName: "FallbackTestPage",
            containerEnumMember: "FallbackTestPage",
        }, {
            enabled: true,
            ...registrationTargets,
        });

        const barrelText = await readFile(paths.pagesIndexPath, "utf8");

        // Should use fallback: ./FallbackTestPage
        expect(barrelText).toContain("export * from \"./FallbackTestPage\";");
    });

    test("Registers selector and handler with custom paths", async () => {
        const paths = await preparePageRegistrationFixture(`${cacheRoot}-nested`);

        const baseDirectory = nodePath.dirname(paths.pagesIndexPath);
        const selectorsPath = nodePath.join(baseDirectory, "selectors");
        const selectorsBarrelPath = nodePath.join(selectorsPath, "index.ts");

        const handlersPath = nodePath.join(baseDirectory, "handlers");
        const handlersBarrelPath = nodePath.join(handlersPath, "index.ts");

        // Create directories and barrels
        await mkdir(selectorsPath, { recursive: true });
        await mkdir(handlersPath, { recursive: true });

        const fs = await import("node:fs/promises");

        await fs.writeFile(selectorsBarrelPath, "", "utf8");
        await fs.writeFile(handlersBarrelPath, "", "utf8");

        const registrationTargets = {
            selectorsIndexPath: selectorsBarrelPath,
            handlersIndexPath: handlersBarrelPath,
            containerEnumPath: paths.containerEnumPath,
        };

        // Register selector with filePath
        await registerArtifact({
            kind: "selector",
            name: "Login",
            selectorClassName: "LoginSelector",
            filePath: nodePath.join(selectorsPath, "LoginSelector.ts"),
        }, {
            enabled: true,
            ...registrationTargets,
        });

        // Register handler with filePath
        await registerArtifact({
            kind: "handler",
            name: "Browse",
            handlerClassName: "BrowseHandler",
            containerEnumMember: "BrowseHandler",
            filePath: nodePath.join(handlersPath, "BrowseHandler.ts"),
        }, {
            enabled: true,
            ...registrationTargets,
        });

        const selectorBarrel = await readFile(selectorsBarrelPath, "utf8");
        const handlerBarrel = await readFile(handlersBarrelPath, "utf8");

        expect(selectorBarrel.includes("export * from \"./LoginSelector\";")).toBe(true);
        expect(handlerBarrel.includes("export * from \"./BrowseHandler\";")).toBe(true);
    });
});
