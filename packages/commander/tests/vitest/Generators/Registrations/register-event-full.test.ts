import { readFile } from "node:fs/promises";

import { describe, expect, test } from "vitest";

import { registerArtifact } from "src/Registrations/register";

import { prepareEventFullFixture } from "../../helpers/prepare-event-full-fixture";

describe("registerArtifact - event full", () => {
    const root = `${process.cwd()}/tests/vitest/cache/register-event-full`;

    test("full event registration: enums, barrels, interfaces, imports", async () => {
        const paths = await prepareEventFullFixture(root);

        const targets = {
            enabled: true,
            containerEnumPath: paths.containerEnumPath,
            eventEnumPath: paths.eventEnumPath,
            listenersIndexPath: paths.listenersIndexPath,
            containerInterfacePath: paths.containerInterfacePath,
            eventsInterfacePath: paths.eventsInterfacePath,
            eventPayloadType: "unknown",
            typeImports: [
                "import type { ContainerName } from \"./ContainerName\";",
                "import type { EventName } from \"./EventName\";",
            ],
        };

        await registerArtifact({
            kind: "event",
            name: "Example",
            eventEnumMember: "ExampleEvent",
        }, targets);

        await registerArtifact({
            kind: "listener",
            name: "Example",
            listenerClassName: "ExampleEventListener",
            containerEnumMember: "ExampleEventListener",
        }, targets);

        const enumEventText = await readFile(paths.eventEnumPath, "utf8");

        expect(enumEventText.includes("\"ExampleEvent\" = \"ExampleEvent\"")).toBe(true);

        const enumContainerText = await readFile(paths.containerEnumPath, "utf8");

        expect(enumContainerText.includes("\"ExampleEventListener\" = \"example.event.listener\"")).toBe(true);

        const barrelText = await readFile(paths.listenersIndexPath, "utf8");

        expect(barrelText.includes("export * from \"./ExampleEventListener\"")).toBe(true);

        const containerIface = await readFile(paths.containerInterfacePath, "utf8");

        expect(containerIface.includes("[ContainerName.ExampleEventListener]: ExampleEventListener;")).toBe(true);
        expect(
            containerIface.includes("import type { ExampleEventListener } from \"@listeners\";"),
        ).toBe(true);

        const eventsIface = await readFile(paths.eventsInterfacePath, "utf8");

        expect(eventsIface.includes("[EventName.ExampleEvent]: unknown;")).toBe(true);

        expect(containerIface.includes("import type { EventName }")).toBe(true);
        expect(eventsIface.includes("import type { ContainerName }")).toBe(true);
    });
});
