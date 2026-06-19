import { readFile } from "node:fs/promises";

import { describe, expect, test } from "vitest";

import { registerArtifact } from "#app/Registrations/register";

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

        expect(enumEventText).toContain("\"ExampleEvent\" = \"ExampleEvent\"");

        const enumContainerText = await readFile(paths.containerEnumPath, "utf8");

        expect(enumContainerText).toContain("\"ExampleEventListener\" = \"example.event.listener\"");

        const barrelText = await readFile(paths.listenersIndexPath, "utf8");

        expect(barrelText).toContain("export * from \"./ExampleEventListener\"");

        const containerIface = await readFile(paths.containerInterfacePath, "utf8");

        expect(containerIface).toContain("[ContainerName.ExampleEventListener]: ExampleEventListener;");
        expect(containerIface).toContain(
            "import type { ExampleEventListener } from \"@listeners\";",
        );

        const eventsIface = await readFile(paths.eventsInterfacePath, "utf8");

        expect(eventsIface).toContain("[EventName.ExampleEvent]: unknown;");

        expect(containerIface).toContain("import type { EventName }");
        expect(eventsIface).toContain("import type { ContainerName }");
    });
});
