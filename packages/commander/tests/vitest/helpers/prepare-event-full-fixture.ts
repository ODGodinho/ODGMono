import {
    mkdir,
    rm,
    writeFile,
} from "node:fs/promises";

import {
    emptyContainerInterfaceWithImport,
    emptyEventBaseInterfaceWithImport,
} from "./dts-stub-contents";

export interface EventFullFixturePaths {
    containerEnumPath: string;
    eventEnumPath: string;
    listenersIndexPath: string;
    containerInterfacePath: string;
    eventsInterfacePath: string;
}

export async function prepareEventFullFixture(root: string): Promise<EventFullFixturePaths> {
    await rm(root, { recursive: true, force: true });
    await mkdir(root, { recursive: true });

    const containerEnumPath = `${root}/ContainerName.ts`;
    const eventEnumPath = `${root}/EventName.ts`;
    const listenersIndexPath = `${root}/Listeners/index.ts`;
    const containerInterfacePath = `${root}/ContainerInterface.d.ts`;
    const eventsInterfacePath = `${root}/EventsInterface.d.ts`;

    await writeFile(containerEnumPath, "export enum ContainerName {\n}\n", "utf8");
    await writeFile(eventEnumPath, "export enum EventName {\n}\n", "utf8");
    await mkdir(`${root}/Listeners`, { recursive: true });
    await writeFile(listenersIndexPath, "", "utf8");
    await writeFile(containerInterfacePath, emptyContainerInterfaceWithImport(), "utf8");
    await writeFile(eventsInterfacePath, emptyEventBaseInterfaceWithImport(), "utf8");

    return {
        containerEnumPath,
        eventEnumPath,
        listenersIndexPath,
        containerInterfacePath,
        eventsInterfacePath,
    };
}
