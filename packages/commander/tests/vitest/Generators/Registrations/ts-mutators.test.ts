import {
    mkdir,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises";

import { describe, expect, test } from "vitest";

import {
    ensureBarrelExport,
    ensureEnumMember,
    ensureEnvironmentExampleLines,
    ensureInterfaceProperty,
    ensureTopLevelStatements,
    ensureTypeNamedImport,
    ensureValueNamedImport,
} from "src/Registrations/ts-mutators";

describe("ts-mutators", () => {
    const root = `${process.cwd()}/tests/vitest/cache/ts-mutators`;

    test("Enum member + idempotency", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        const filePath = `${root}/Enum.ts`;

        await writeFile(filePath, "export enum ContainerName {\n}\n", "utf8");

        await expect(ensureEnumMember({
            filePath,
            enumName: "ContainerName",
            memberName: "Foo",
        })).resolves.toBe(true);

        await expect(ensureEnumMember({
            filePath,
            enumName: "ContainerName",
            memberName: "Foo",
        })).resolves.toBe(false);
    });

    test("Enum member throws if enum missing", async () => {
        const filePath = `${root}/NoEnum.ts`;

        await writeFile(filePath, "export const x = 1;\n", "utf8");

        await expect(ensureEnumMember({
            filePath,
            enumName: "Missing",
            memberName: "Foo",
        })).rejects.toBeTruthy();
    });

    test("Enum member after trailing comma and section comment does not produce ,,", async () => {
        const filePath = `${root}/EnumWithComment.ts`;

        await writeFile(
            filePath,
            [
                "export enum ContainerName {",
                "    \"GoogleSearchToSelectionHandler\" = \"google.search.to.selection.handler\",",
                "",
                "    // Events",
                "}",
                "",
            ].join("\n"),
            "utf8",
        );

        await expect(ensureEnumMember({
            filePath,
            enumName: "ContainerName",
            memberName: "ExamplePage",
            memberValue: "ExamplePage",
        })).resolves.toBe(true);

        const text = await readFile(filePath, "utf8");

        expect(text.includes(",,")).toBe(false);
        expect(text.includes("\"ExamplePage\" = \"ExamplePage\"")).toBe(true);
    });

    test("Barrel export + idempotency", async () => {
        const barrelPath = `${root}/index.ts`;

        await writeFile(barrelPath, "", "utf8");

        await expect(ensureBarrelExport({ barrelPath, relativeExportPath: "./A" })).resolves.toBe(true);
        await expect(ensureBarrelExport({ barrelPath, relativeExportPath: "./A" })).resolves.toBe(false);
    });

    test("Top-level statements insertion + idempotency + empty", async () => {
        const filePath = `${root}/statements.ts`;

        await writeFile(filePath, "export const x = 1;\n", "utf8");

        const typeImportStatement = "import type { X } from \"x\";";

        await expect(ensureTopLevelStatements({ filePath, statements: [] })).resolves.toBe(false);
        await expect(ensureTopLevelStatements({
            filePath,
            statements: [ typeImportStatement ],
        })).resolves.toBe(true);
        await expect(ensureTopLevelStatements({
            filePath,
            statements: [ typeImportStatement ],
        })).resolves.toBe(false);
    });

    test("Top-level statements works when file does not exist yet", async () => {
        const filePath = `${root}/new-file.ts`;

        await expect(ensureTopLevelStatements({
            filePath,
            statements: [ "export const created = true;" ],
        })).resolves.toBe(true);
    });

    test("Interface property + idempotency", async () => {
        const filePath = `${root}/iface.d.ts`;

        await writeFile(filePath, "export interface ContainerInterface {\n}\n", "utf8");

        await expect(ensureInterfaceProperty({
            filePath,
            interfaceName: "ContainerInterface",
            propertyName: "[ContainerName.Foo]",
            propertyType: "unknown",
        })).resolves.toBe(true);

        await expect(ensureInterfaceProperty({
            filePath,
            interfaceName: "ContainerInterface",
            propertyName: "[ContainerName.Foo]",
            propertyType: "unknown",
        })).resolves.toBe(false);
    });

    test("Interface property throws if interface missing", async () => {
        const filePath = `${root}/NoIface.d.ts`;

        await writeFile(filePath, "export type X = 1;\n", "utf8");

        await expect(ensureInterfaceProperty({
            filePath,
            interfaceName: "MissingInterface",
            propertyName: "a",
            propertyType: "unknown",
        })).rejects.toBeTruthy();
    });

    test("Type-only named import + idempotency", async () => {
        const filePath = `${root}/type-import.d.ts`;

        await writeFile(filePath, "export interface X {}\n", "utf8");

        await expect(ensureTypeNamedImport({
            filePath,
            moduleSpecifier: "./SomeModule",
            name: "FooType",
        })).resolves.toBe(true);

        const textAfter = await readFile(filePath, "utf8");

        expect(textAfter.includes("import type { FooType } from \"./SomeModule\";")).toBe(true);

        await expect(ensureTypeNamedImport({
            filePath,
            moduleSpecifier: "./SomeModule",
            name: "FooType",
        })).resolves.toBe(false);
    });

    test("Type named import merges into existing same-module import", async () => {
        const filePath = `${root}/type-import-merge.d.ts`;

        await writeFile(
            filePath,
            "import type { Alpha } from \"./Shared\";\n\nexport interface X {}\n",
            "utf8",
        );

        await expect(ensureTypeNamedImport({
            filePath,
            moduleSpecifier: "./Shared",
            name: "Beta",
        })).resolves.toBe(true);

        const text = await readFile(filePath, "utf8");

        expect(text.includes("Alpha")).toBe(true);
        expect(text.includes("Beta")).toBe(true);
    });

    test("Value named import + idempotency", async () => {
        const filePath = `${root}/value-import.d.ts`;

        await writeFile(filePath, "export interface X {}\n", "utf8");

        await expect(ensureValueNamedImport({
            filePath,
            moduleSpecifier: "@pages",
            name: "ExamplePage",
        })).resolves.toBe(true);

        const textAfter = await readFile(filePath, "utf8");

        expect(textAfter.includes("import { ExamplePage } from \"@pages\";")).toBe(true);

        await expect(ensureValueNamedImport({
            filePath,
            moduleSpecifier: "@pages",
            name: "ExamplePage",
        })).resolves.toBe(false);
    });

    test("Environment example lines + idempotency", async () => {
        const filePath = `${root}/.env.example`;

        await writeFile(filePath, "A=1\n", "utf8");

        await expect(ensureEnvironmentExampleLines({
            filePath,
            lines: [ "B=2" ],
        })).resolves.toBe(true);

        await expect(ensureEnvironmentExampleLines({
            filePath,
            lines: [ "B=2" ],
        })).resolves.toBe(false);

        const text = await readFile(filePath, "utf8");

        expect(text.includes("A=1")).toBe(true);
        expect(text.includes("B=2")).toBe(true);
    });

    test("Environment example lines handles empty file and missing trailing newline", async () => {
        const filePath = `${root}/.env.example.no-newline`;

        await writeFile(filePath, "A=1", "utf8");

        await expect(ensureEnvironmentExampleLines({
            filePath,
            lines: [ "B=2" ],
        })).resolves.toBe(true);

        const text = await readFile(filePath, "utf8");

        expect(text.includes("A=1\nB=2\n")).toBe(true);

        const emptyPath = `${root}/.env.example.empty`;

        await writeFile(emptyPath, "", "utf8");
        await expect(ensureEnvironmentExampleLines({
            filePath: emptyPath,
            lines: [ "C=3" ],
        })).resolves.toBe(true);
    });

    test("Barrel export normalizes missing ./ prefix", async () => {
        const barrelPath = `${root}/normalize.ts`;

        await writeFile(barrelPath, "", "utf8");

        await expect(ensureBarrelExport({ barrelPath, relativeExportPath: "Z" })).resolves.toBe(true);
        const text = await readFile(barrelPath, "utf8");

        expect(text.includes("export * from \"./Z\"")).toBe(true);
    });
});
