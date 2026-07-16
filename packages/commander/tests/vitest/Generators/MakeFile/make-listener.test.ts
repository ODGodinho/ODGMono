import {
    mkdir,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises";

import { File } from "@odg/chemical-x";
import { NullLogger } from "@odg/log";
import { vi } from "vitest";

import MakeFile from "#app/Generators/MakeFile";

import {
    emptyContainerInterfaceWithImport,
    emptyEventBaseInterfaceWithImport,
} from "../../helpers/dts-stub-contents";

async function prepareListenerRegisterFixture(root: string): Promise<{
    eventEnumPath: string;
    eventsInterfacePath: string;
    containerEnumPath: string;
    containerInterfacePath: string;
    listenersDirectory: string;
    listenersIndexPath: string;
    listenerFile: string;
}> {
    await rm(root, { recursive: true, force: true });
    await mkdir(root, { recursive: true });

    const eventEnumPath = `${root}/EventName.ts`;
    const eventsInterfacePath = `${root}/EventsInterface.d.ts`;
    const containerEnumPath = `${root}/ContainerName.ts`;
    const containerInterfacePath = `${root}/ContainerInterface.d.ts`;

    await Promise.all([
        writeFile(eventEnumPath, "export enum EventName {\n}\n", "utf8"),
        writeFile(eventsInterfacePath, emptyEventBaseInterfaceWithImport(), "utf8"),
        writeFile(containerEnumPath, "export enum ContainerName {\n}\n", "utf8"),
        writeFile(containerInterfacePath, emptyContainerInterfaceWithImport(), "utf8"),
    ]);

    const listenersDirectory = `${root}/Listeners`;

    await mkdir(listenersDirectory, { recursive: true });

    const listenersIndexPath = `${listenersDirectory}/index.ts`;

    await writeFile(listenersIndexPath, "", "utf8");

    return {
        eventEnumPath,
        eventsInterfacePath,
        containerEnumPath,
        containerInterfacePath,
        listenersDirectory,
        listenersIndexPath,
        listenerFile: `${listenersDirectory}/NotifyEventListener.ts`,
    };
}

describe("makeListener Test", () => {
    vi.spyOn(console, "log").mockImplementation(() => void 0);

    const make = new MakeFile(new NullLogger());

    const path = `${process.cwd()}/tests/vitest/cache`;
    const loginSaveListener = `${path}/LoginSaveEventListener.ts`;

    afterEach(async () => {
        await rm(loginSaveListener, { force: true });
    });

    test("creates LoginSaveEventListener bound to Login event", async () => {
        await expect(
            make.generateListener("LoginSave", {
                path,
                event: "Login",
            }),
        )
            .resolves
            .toBeUndefined();

        const listenerFileInstance = new File(loginSaveListener);

        expect(await listenerFileInstance.exists())
            .toBeTruthy();

        const source = await readFile(loginSaveListener, "utf8");

        expect(source.includes("export class LoginSaveEventListener")).toBe(true);
        expect(source.includes("EventName.LoginEvent")).toBe(true);
        expect(source.includes("@$inject(ContainerName.LoginPage)")).toBe(true);
    });

    test("makeListener with register ensures event enum member before listener file", async () => {
        const root = `${process.cwd()}/tests/vitest/cache/listener-with-register`;
        const fixture = await prepareListenerRegisterFixture(root);

        await expect(
            make.generateListener("Notify", {
                path: fixture.listenersDirectory,
                event: "Notify",
                register: true,
                eventEnumPath: fixture.eventEnumPath,
                eventsInterfacePath: fixture.eventsInterfacePath,
                containerEnumPath: fixture.containerEnumPath,
                containerInterfacePath: fixture.containerInterfacePath,
                listenersIndexPath: fixture.listenersIndexPath,
                eventPayloadType: "unknown",
                typeImports: [
                    "import type { EventName } from \"./EventName\";",
                    "import type { ContainerName } from \"./ContainerName\";",
                ],
            }),
        )
            .resolves
            .toBeUndefined();

        const enumText = await readFile(fixture.eventEnumPath, "utf8");

        expect(enumText).toContain("NotifyEvent");
        const listenerFileInstance = new File(fixture.listenerFile);

        expect(await listenerFileInstance.exists()).toBeTruthy();

        await rm(root, { recursive: true, force: true });
    });
});
