import {
    mkdir,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises";

import { describe, expect, test } from "vitest";

import { registerArtifact } from "src/Registrations/register";

import { emptyContainerInterfaceWithImport } from "../../helpers/dts-stub-contents";

describe("registerArtifact - handler and selector branches", () => {
    const root = `${process.cwd()}/tests/vitest/cache/register-handler-selector`;

    test("Selector no-op when required selector targets are missing", async () => {
        await expect(registerArtifact({
            kind: "selector",
            name: "NoopSelector",
        }, {
            enabled: true,
        })).resolves.toBeUndefined();
    });

    test("Selector registers barrel export", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(`${root}/Selectors`, { recursive: true });

        const selectorsIndexPath = `${root}/Selectors/index.ts`;

        await writeFile(selectorsIndexPath, "", "utf8");

        await registerArtifact({
            kind: "selector",
            name: "Example",
            selectorClassName: "ExampleSelector",
        }, {
            enabled: true,
            selectorsIndexPath,
        });

        const text = await readFile(selectorsIndexPath, "utf8");

        expect(text.includes("export * from \"./ExampleSelector\"")).toBe(true);
    });

    test("Handler registers container enum + handlers barrel + container interface", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(`${root}/Handlers`, { recursive: true });

        const containerEnumPath = `${root}/ContainerName.ts`;
        const handlersIndexPath = `${root}/Handlers/index.ts`;
        const containerInterfacePath = `${root}/ContainerInterface.d.ts`;

        await writeFile(containerEnumPath, "export enum ContainerName {\n}\n", "utf8");
        await writeFile(handlersIndexPath, "", "utf8");
        await writeFile(containerInterfacePath, emptyContainerInterfaceWithImport(), "utf8");

        await registerArtifact({
            kind: "handler",
            name: "Example",
            handlerClassName: "ExampleHandler",
            containerEnumMember: "ExampleHandler",
        }, {
            enabled: true,
            containerEnumPath,
            handlersIndexPath,
            containerInterfacePath,
        });

        const enumText = await readFile(containerEnumPath, "utf8");

        expect(enumText.includes("\"ExampleHandler\" = \"example.handler\"")).toBe(true);

        const barrelText = await readFile(handlersIndexPath, "utf8");

        expect(barrelText.includes("export * from \"./ExampleHandler\"")).toBe(true);

        const ifaceText = await readFile(containerInterfacePath, "utf8");

        expect(ifaceText.includes("import { ExampleHandler } from \"@handlers\";")).toBe(true);
        expect(ifaceText.includes("[ContainerName.ExampleHandler]: ExampleHandler;")).toBe(true);
    });

    test("Handler no-op when enum and barrel targets are missing", async () => {
        await expect(registerArtifact({
            kind: "handler",
            name: "NoopHandler",
            handlerClassName: "NoopHandler",
        }, {
            enabled: true,
        })).resolves.toBeUndefined();
    });
});
