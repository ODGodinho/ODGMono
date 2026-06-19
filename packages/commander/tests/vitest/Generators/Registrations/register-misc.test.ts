import {
    mkdir,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises";

import { describe, expect, test } from "vitest";

import { registerArtifact } from "#app/Registrations/register";

import {
    emptyContainerInterfaceWithImport,
    emptyEventBaseInterfaceWithImport,
} from "../../helpers/dts-stub-contents";

const configEnumFixture = "export enum ConfigName {\n}\n";
const defaultConfigValidatorType = "zod.string()";

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

        expect(text).not.toContain("ExampleHandler");
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

        await writeFile(configEnumPath, configEnumFixture, "utf8");
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

        expect(configText).toContain("\"FOO\" = \"FOO\"");
        expect(configText).toContain("\"BAR\" = \"BAR\"");

        const environmentText = await readFile(environmentExamplePath, "utf8");

        expect(environmentText).toContain("FOO=1");
        expect(environmentText).toContain("BAR=2");
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

    test("Listener registration returns early when listenerClassName missing", async () => {
        await expect(registerArtifact({
            kind: "listener",
            name: "Example",
        }, {
            enabled: true,
        })).resolves.toBeUndefined();
    });

    test("Event registration only touches EventName when EventsInterface path omitted", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        const eventEnumPath = `${root}/EventName.ts`;

        await writeFile(eventEnumPath, "export enum EventName {\n}\n", "utf8");

        await registerArtifact({
            kind: "event",
            name: "Solo",
            eventEnumMember: "SoloEvent",
        }, {
            enabled: true,
            eventEnumPath,
        });

        const enumText = await readFile(eventEnumPath, "utf8");

        expect(enumText).toContain("\"SoloEvent\" = \"SoloEvent\"");
    });

    test("Event registration only touches EventsInterface when EventName path omitted", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        const eventsInterfacePath = `${root}/EventsInterface.d.ts`;

        await writeFile(eventsInterfacePath, emptyEventBaseInterfaceWithImport(), "utf8");

        await registerArtifact({
            kind: "event",
            name: "IfaceOnly",
            eventEnumMember: "IfaceOnlyEvent",
        }, {
            enabled: true,
            eventsInterfacePath,
            eventPayloadType: "unknown",
        });

        const ifaceText = await readFile(eventsInterfacePath, "utf8");

        expect(ifaceText).toContain("[EventName.IfaceOnlyEvent]: unknown;");
    });

    test("Event ContainerInterface imports listener type from @listeners when listenersIndexPath omitted", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        const containerInterfacePath = `${root}/ContainerInterface.d.ts`;
        const eventsInterfacePath = `${root}/EventsInterface.d.ts`;

        await writeFile(containerInterfacePath, emptyContainerInterfaceWithImport(), "utf8");
        await writeFile(eventsInterfacePath, emptyEventBaseInterfaceWithImport(), "utf8");

        await registerArtifact({
            kind: "listener",
            name: "Example",
            listenerClassName: "ExampleEventListener",
            containerEnumMember: "ExampleEventListener",
        }, {
            enabled: true,
            containerInterfacePath,
            eventsInterfacePath,
            eventPayloadType: "unknown",
        });

        const text = await readFile(containerInterfacePath, "utf8");

        expect(text).toContain("[ContainerName.ExampleEventListener]: ExampleEventListener;");
        expect(text).toContain("import type { ExampleEventListener } from \"@listeners\";");
    });

    test("Config registers ConfigName enum member and .env.example line", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        const configEnumPath = `${root}/ConfigName.ts`;
        const environmentExamplePath = `${root}/.env.example`;

        await writeFile(configEnumPath, configEnumFixture, "utf8");
        await writeFile(environmentExamplePath, "EXISTING=1\n", "utf8");

        await registerArtifact({
            kind: "config",
            name: "AppName",
            configEnumMembers: [ "APP_NAME" ],
            envExampleLines: [ "APP_NAME=" ],
        }, {
            enabled: true,
            configEnumPath,
            envExamplePath: environmentExamplePath,
        });

        const enumText = await readFile(configEnumPath, "utf8");

        expect(enumText).toContain("\"APP_NAME\" = \"APP_NAME\"");

        const environmentText = await readFile(environmentExamplePath, "utf8");

        expect(environmentText).toContain("APP_NAME=");
    });

    test("Config registers entry inside configValidator zod.object", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        const configEnumPath = `${root}/ConfigName.ts`;
        const configValidatorPath = `${root}/index.ts`;

        await writeFile(configEnumPath, configEnumFixture, "utf8");
        await writeFile(
            configValidatorPath,
            "import zod from \"zod\";\n\nexport const configValidator = zod.object({\n});\n",
            "utf8",
        );

        await registerArtifact({
            kind: "config",
            name: "AppUrl",
            configEnumMembers: [ "APP_URL" ],
            configValidatorType: defaultConfigValidatorType,
        }, {
            enabled: true,
            configEnumPath,
            configValidatorPath,
        });

        const validatorText = await readFile(configValidatorPath, "utf8");

        expect(validatorText).toContain("[ConfigName.APP_URL]");
        expect(validatorText).toContain(defaultConfigValidatorType);
    });

    test("Config uses default validator when configValidatorType is omitted", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        const configEnumPath = `${root}/ConfigName.ts`;
        const configValidatorPath = `${root}/index.ts`;

        await writeFile(configEnumPath, configEnumFixture, "utf8");
        await writeFile(
            configValidatorPath,
            "import zod from \"zod\";\n\nexport const configValidator = zod.object({\n});\n",
            "utf8",
        );

        await registerArtifact({
            kind: "config",
            name: "AppName",
            configEnumMembers: [ "APP_NAME" ],
        }, {
            enabled: true,
            configEnumPath,
            configValidatorPath,
        });

        const validatorText = await readFile(configValidatorPath, "utf8");

        expect(validatorText).toContain("[ConfigName.APP_NAME]");
        expect(validatorText).toContain(defaultConfigValidatorType);
    });
});
