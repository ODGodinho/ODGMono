import {
    mkdir,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises";
import nodePath from "node:path";

import { NullLogger } from "@odg/log";
import { describe, expect, test } from "vitest";

import MakeFile from "#app/Generators/MakeFile";
import { registerArtifact } from "#app/Registrations/register";

import { emptyEventBaseInterfaceWithImport } from "../../helpers/dts-stub-contents";

describe("Registrations - event", () => {
    const make = new MakeFile(new NullLogger());
    const cacheRoot = `${process.cwd()}/tests/vitest/cache/registrations-event`;

    test("Registers EventName + EventsInterface mapping (idempotent)", async () => {
        await rm(cacheRoot, { recursive: true, force: true });
        await mkdir(cacheRoot, { recursive: true });

        const eventEnumPath = `${cacheRoot}/EventName.ts`;
        const eventsInterfacePath = `${cacheRoot}/EventsInterface.d.ts`;

        await writeFile(eventEnumPath, "export enum EventName {\n}\n", "utf8");
        await writeFile(eventsInterfacePath, emptyEventBaseInterfaceWithImport(), "utf8");

        const registrationTargets = {
            eventEnumPath,
            eventsInterfacePath,
            eventPayloadType: "unknown",
            typeImports: [ "import type { EventName } from \"./EventName\";" ],
        };

        await make.makeEvent("Example", {
            register: true,
            registrationTargets,
        });

        await expect(
            make.makeEvent("Example", {
                register: true,
                registrationTargets,
            }),
        )
            .resolves
            .toBeUndefined();

        const enumText = await readFile(eventEnumPath, "utf8");

        expect(enumText.match(/"ExampleEvent"\s*=\s*"ExampleEvent"/g)?.length ?? 0).toBe(1);

        const ifaceText = await readFile(eventsInterfacePath, "utf8");

        expect(ifaceText.includes("[EventName.ExampleEvent]: unknown;")).toBe(true);
    });

    test("Registers listener barrel without filePath (fallback mode)", async () => {
        const cacheRootFallback = `${cacheRoot}-fallback`;

        await rm(cacheRootFallback, { recursive: true, force: true });
        await mkdir(cacheRootFallback, { recursive: true });

        const listenersPath = nodePath.join(cacheRootFallback, "listeners");
        const listenersBarrelPath = nodePath.join(listenersPath, "index.ts");

        await mkdir(listenersPath, { recursive: true });
        await writeFile(listenersBarrelPath, "", "utf8");

        await registerArtifact({
            kind: "listener",
            name: "Fallback",
            listenerClassName: "FallbackEventListener",
            containerEnumMember: "FallbackEventListener",
        }, {
            enabled: true,
            listenersIndexPath: listenersBarrelPath,
        });

        const barrelText = await readFile(listenersBarrelPath, "utf8");

        // Should use fallback: ./FallbackEventListener
        expect(barrelText.includes("export * from \"./FallbackEventListener\";")).toBe(true);
    });

    test("Registers listener barrel with nested filePath", async () => {
        const cacheRootNested = `${cacheRoot}-nested`;

        await rm(cacheRootNested, { recursive: true, force: true });
        await mkdir(cacheRootNested, { recursive: true });

        const listenersPath = nodePath.join(cacheRootNested, "listeners");
        const nestedPath = nodePath.join(listenersPath, "events");
        const listenersBarrelPath = nodePath.join(listenersPath, "index.ts");

        await mkdir(nestedPath, { recursive: true });
        await writeFile(listenersBarrelPath, "", "utf8");

        await registerArtifact({
            kind: "listener",
            name: "Nested",
            listenerClassName: "NestedEventListener",
            containerEnumMember: "NestedEventListener",
            filePath: nodePath.join(nestedPath, "NestedEventListener.ts"),
        }, {
            enabled: true,
            listenersIndexPath: listenersBarrelPath,
        });

        const barrelText = await readFile(listenersBarrelPath, "utf8");

        // Should use correct relative path: ./events/NestedEventListener
        expect(barrelText.includes("export * from \"./events/NestedEventListener\";")).toBe(true);
    });
});
