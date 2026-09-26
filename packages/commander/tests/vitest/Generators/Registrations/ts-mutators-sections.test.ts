import { mkdir, rm, writeFile } from "node:fs/promises";

import { describe, expect, test } from "vitest";

import { didEnsureBarrelLine, didEnsureEnumMember, didEnsureInterfaceProperty } from "#app/Registrations/ts-mutators";

import { read } from "../../helpers/prepare-api-fixture.ts";

const root = `${process.cwd()}/tests/vitest/cache/ts-mutators-sections`;
const filePath = `${root}/file.ts`;
const services = "    // Services";
const request = "    // Request";
const memberA = "    \"A\" = \"a\",";
const memberR = "    \"R\" = \"r\",";
const clock = "    \"ClockService\" = \"clock.service\",";

async function writeFixture(content: string): Promise<void> {
    await rm(root, { recursive: true, force: true });
    await mkdir(root, { recursive: true });
    await writeFile(filePath, content);
}

async function writeEnum(body: string[]): Promise<void> {
    await writeFixture([ "export enum ContainerName {", ...body, "}", "" ].join("\n"));
}

async function didAddClock(): Promise<boolean> {
    return didEnsureEnumMember({
        filePath,
        enumName: "ContainerName",
        memberName: "ClockService",
        memberValue: "clock.service",
        section: "Services",
    });
}

async function didAddProperty(): Promise<boolean> {
    return didEnsureInterfaceProperty({
        filePath,
        interfaceName: "I",
        propertyName: "c",
        propertyType: "C",
        section: "Services",
    });
}

describe("ts-mutators sections and barrel lines", () => {
    test("inserts after the last member of the section, keeping the blank line before the next one", async () => {
        await writeEnum([ services, memberA, "", request, memberR ]);

        await expect(didAddClock()).resolves.toBe(true);
        const expected = [ "export enum ContainerName {", services, memberA, clock, "", request, memberR, "}", "" ];

        expect(await read(filePath)).toBe(expected.join("\n"));
    });

    test("section that is the last one, and an empty section", async () => {
        await writeEnum([ services, memberA ]);
        await didAddClock();
        expect(await read(filePath)).toContain([ memberA, clock, "}" ].join("\n"));

        await writeEnum([ services, "", request, memberR ]);
        await didAddClock();
        expect(await read(filePath)).toContain([ services, clock, "", request ].join("\n"));
    });

    test("falls back to the end when the section does not exist", async () => {
        await writeEnum([ memberA ]);
        await didAddClock();
        expect(await read(filePath)).toContain([ memberA, clock, "}" ].join("\n"));
    });

    test("interface property inside its section, or at the end without one", async () => {
        await writeFixture("export interface I {\n    // Services\n    a: A;\n\n    // Other\n    b: B;\n}\n");

        await expect(didAddProperty()).resolves.toBe(true);
        expect(await read(filePath))
            .toBe("export interface I {\n    // Services\n    a: A;\n    c: C;\n\n    // Other\n    b: B;\n}\n");

        await writeFixture("export interface I {\n    a: A;\n}\n");
        await didAddProperty();
        expect(await read(filePath)).toContain("    a: A;\n    c: C;\n}");
    });

    test("barrel line: created, separated by a blank line, idempotent", async () => {
        await rm(root, { recursive: true, force: true });

        const barrelPath = `${root}/index.ts`;
        const first = "export * from \"./A.js\";";
        const second = "export * as b from \"./b.js\";";

        await expect(didEnsureBarrelLine({ barrelPath, line: first })).resolves.toBe(true);
        await writeFile(barrelPath, first);
        await expect(didEnsureBarrelLine({ barrelPath, line: second })).resolves.toBe(true);
        await expect(didEnsureBarrelLine({ barrelPath, line: second })).resolves.toBe(false);
        expect(await read(barrelPath)).toBe(`${first}\n\n${second}\n`);
    });
});
