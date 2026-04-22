import {
    mkdir,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises";

import { describe, expect, test } from "vitest";

import { registerArtifact } from "src/Registrations/register";

import {
    emptyContainerInterfaceWithImport,
    emptyEventBaseInterfaceWithImport,
} from "../../helpers/dts-stub-contents";

describe("registerArtifact - misc branches", () => {
    const root = `${process.cwd()}/tests/vitest/cache/register-misc`;

    test("Disabled registration does nothing", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        const containerEnumPath = `${root}/ContainerName.ts`;

        await writeFile(containerEnumPath, "export enum ContainerName {\n}\n", "utf8");

        await registerArtifact({
            kind: "handler",
            name: "Example",
            handlerClassName: "ExampleHandler",
            containerEnumMember: "ExampleHandler",
        }, {
            enabled: false,
            containerEnumPath,
        });

        const text = await readFile(containerEnumPath, "utf8");

        expect(text.includes("ExampleHandler")).toBe(false);
    });

    test("Event registration throws if EventsInterface target set but payload type missing", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        const eventEnumPath = `${root}/EventName.ts`;
        const eventsInterfacePath = `${root}/EventsInterface.d.ts`;

        await writeFile(eventEnumPath, "export enum EventName {\n}\n", "utf8");
        await writeFile(eventsInterfacePath, emptyEventBaseInterfaceWithImport(), "utf8");

        await expect(registerArtifact({
            kind: "event",
            name: "Example",
            eventEnumMember: "ExampleEvent",
            listenerClassName: "ExampleEventListener",
            containerEnumMember: "ExampleEventListener",
        }, {
            enabled: true,
            eventEnumPath,
            eventsInterfacePath,
        })).rejects.toBeTruthy();
    });

    test("Page can register config enum + env example lines", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        const configEnumPath = `${root}/ConfigName.ts`;
        const environmentExamplePath = `${root}/.env.example`;

        await writeFile(configEnumPath, "export enum ConfigName {\n}\n", "utf8");
        await writeFile(environmentExamplePath, "A=1\n", "utf8");

        await registerArtifact({
            kind: "page",
            name: "Example",
            pageClassName: "ExamplePage",
            containerEnumMember: "ExamplePage",
            configEnumMembers: [ "FOO", "BAR" ],
            envExampleLines: [ "FOO=1", "BAR=2" ],
        }, {
            enabled: true,
            configEnumPath,
            envExamplePath: environmentExamplePath,
        });

        const configText = await readFile(configEnumPath, "utf8");

        expect(configText.includes("\"FOO\" = \"FOO\"")).toBe(true);
        expect(configText.includes("\"BAR\" = \"BAR\"")).toBe(true);

        const environmentText = await readFile(environmentExamplePath, "utf8");

        expect(environmentText.includes("FOO=1")).toBe(true);
        expect(environmentText.includes("BAR=2")).toBe(true);
    });

    test("Unknown kind is a no-op", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        await expect(registerArtifact({

            // Force default case for coverage
            kind: "unknown" as never,
            name: "Example",
        }, {
            enabled: true,
        })).resolves.toBeUndefined();
    });

    test("Event ContainerInterface imports listener type from @listeners when listenersIndexPath omitted", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        const containerInterfacePath = `${root}/ContainerInterface.d.ts`;
        const eventsInterfacePath = `${root}/EventsInterface.d.ts`;

        await writeFile(containerInterfacePath, emptyContainerInterfaceWithImport(), "utf8");
        await writeFile(eventsInterfacePath, emptyEventBaseInterfaceWithImport(), "utf8");

        await registerArtifact({
            kind: "event",
            name: "Example",
            eventEnumMember: "ExampleEvent",
            listenerClassName: "ExampleEventListener",
            containerEnumMember: "ExampleEventListener",
        }, {
            enabled: true,
            containerInterfacePath,
            eventsInterfacePath,
            eventPayloadType: "unknown",
        });

        const text = await readFile(containerInterfacePath, "utf8");

        expect(text.includes("[ContainerName.ExampleEventListener]: ExampleEventListener;")).toBe(true);
        expect(text.includes("import type { ExampleEventListener } from \"@listeners\";")).toBe(true);
    });
});
