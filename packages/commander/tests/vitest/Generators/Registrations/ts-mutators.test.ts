import {
    mkdir,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises";

import { describe, expect, test } from "vitest";

import {
    didEnsureBarrelExport,
    didEnsureEnumMember,
    didEnsureEnvironmentExampleLines,
    didEnsureInterfaceProperty,
    didEnsureTopLevelStatements,
    didEnsureTypeNamedImport,
    didEnsureValueNamedImport,
    didEnsureZodObjectEntry,
} from "#app/Registrations/ts-mutators";

const appUrlPropertyName = "[ConfigName.APP_URL]";
const fooPropertyName = "[ConfigName.FOO]";
const zodStringPropertyValue = "zod.string()";

describe("ts-mutators", () => {
    const root = `${process.cwd()}/tests/vitest/cache/ts-mutators`;

    test("Enum member + idempotency", async () => {
        await rm(root, { recursive: true, force: true });
        await mkdir(root, { recursive: true });

        const filePath = `${root}/Enum.ts`;

        await writeFile(filePath, "export enum ContainerName {\n}\n", "utf8");

        await expect(didEnsureEnumMember({
            filePath,
            enumName: "ContainerName",
            memberName: "Foo",
        })).resolves.toBe(true);

        await expect(didEnsureEnumMember({
            filePath,
            enumName: "ContainerName",
            memberName: "Foo",
        })).resolves.toBe(false);
    });

    test("Enum member throws if enum missing", async () => {
        const filePath = `${root}/NoEnum.ts`;

        await writeFile(filePath, "export const x = 1;\n", "utf8");

        await expect(didEnsureEnumMember({
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

        await expect(didEnsureEnumMember({
            filePath,
            enumName: "ContainerName",
            memberName: "ExamplePage",
            memberValue: "ExamplePage",
        })).resolves.toBe(true);

        const text = await readFile(filePath, "utf8");

        expect(text).not.toContain(",,");
        expect(text).toContain("\"ExamplePage\" = \"ExamplePage\"");
    });

    test("Barrel export + idempotency", async () => {
        const barrelPath = `${root}/index.ts`;

        await writeFile(barrelPath, "", "utf8");

        await expect(didEnsureBarrelExport({ barrelPath, relativeExportPath: "./A" })).resolves.toBe(true);
        await expect(didEnsureBarrelExport({ barrelPath, relativeExportPath: "./A" })).resolves.toBe(false);
    });

    test("Top-level statements insertion + idempotency + empty", async () => {
        const filePath = `${root}/statements.ts`;

        await writeFile(filePath, "export const x = 1;\n", "utf8");

        const typeImportStatement = "import type { X } from \"x\";";

        await expect(didEnsureTopLevelStatements({ filePath, statements: [] })).resolves.toBe(false);
        await expect(didEnsureTopLevelStatements({
            filePath,
            statements: [ typeImportStatement ],
        })).resolves.toBe(true);
        await expect(didEnsureTopLevelStatements({
            filePath,
            statements: [ typeImportStatement ],
        })).resolves.toBe(false);
    });

    test("Top-level statements works when file does not exist yet", async () => {
        const filePath = `${root}/new-file.ts`;

        await expect(didEnsureTopLevelStatements({
            filePath,
            statements: [ "export const created = true;" ],
        })).resolves.toBe(true);
    });

    test("Interface property + idempotency", async () => {
        const filePath = `${root}/iface.d.ts`;

        await writeFile(filePath, "export interface ContainerInterface {\n}\n", "utf8");

        await expect(didEnsureInterfaceProperty({
            filePath,
            interfaceName: "ContainerInterface",
            propertyName: "[ContainerName.Foo]",
            propertyType: "unknown",
        })).resolves.toBe(true);

        await expect(didEnsureInterfaceProperty({
            filePath,
            interfaceName: "ContainerInterface",
            propertyName: "[ContainerName.Foo]",
            propertyType: "unknown",
        })).resolves.toBe(false);
    });

    test("Interface property throws if interface missing", async () => {
        const filePath = `${root}/NoIface.d.ts`;

        await writeFile(filePath, "export type X = 1;\n", "utf8");

        await expect(didEnsureInterfaceProperty({
            filePath,
            interfaceName: "MissingInterface",
            propertyName: "a",
            propertyType: "unknown",
        })).rejects.toBeTruthy();
    });

    test("Type-only named import + idempotency", async () => {
        const filePath = `${root}/type-import.d.ts`;

        await writeFile(filePath, "export interface X {}\n", "utf8");

        await expect(didEnsureTypeNamedImport({
            filePath,
            moduleSpecifier: "./SomeModule",
            name: "FooType",
        })).resolves.toBe(true);

        const textAfter = await readFile(filePath, "utf8");

        expect(textAfter.includes("import type { FooType } from \"./SomeModule\";")).toBe(true);

        await expect(didEnsureTypeNamedImport({
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

        await expect(didEnsureTypeNamedImport({
            filePath,
            moduleSpecifier: "./Shared",
            name: "Beta",
        })).resolves.toBe(true);

        const text = await readFile(filePath, "utf8");

        expect(text).toContain("Alpha");
        expect(text).toContain("Beta");
    });

    test("Value named import + idempotency", async () => {
        const filePath = `${root}/value-import.d.ts`;

        await writeFile(filePath, "export interface X {}\n", "utf8");

        await expect(didEnsureValueNamedImport({
            filePath,
            moduleSpecifier: "@pages",
            name: "ExamplePage",
        })).resolves.toBe(true);

        const textAfter = await readFile(filePath, "utf8");

        expect(textAfter.includes("import { ExamplePage } from \"@pages\";")).toBe(true);

        await expect(didEnsureValueNamedImport({
            filePath,
            moduleSpecifier: "@pages",
            name: "ExamplePage",
        })).resolves.toBe(false);
    });

    test("Environment example lines + idempotency", async () => {
        const filePath = `${root}/.env.example`;

        await writeFile(filePath, "A=1\n", "utf8");

        await expect(didEnsureEnvironmentExampleLines({
            filePath,
            lines: [ "B=2" ],
        })).resolves.toBe(true);

        await expect(didEnsureEnvironmentExampleLines({
            filePath,
            lines: [ "B=2" ],
        })).resolves.toBe(false);

        const text = await readFile(filePath, "utf8");

        expect(text).toContain("A=1");
        expect(text).toContain("B=2");
    });

    test("Environment example lines handles empty file and missing trailing newline", async () => {
        const filePath = `${root}/.env.example.no-newline`;

        await writeFile(filePath, "A=1", "utf8");

        await expect(didEnsureEnvironmentExampleLines({
            filePath,
            lines: [ "B=2" ],
        })).resolves.toBe(true);

        const text = await readFile(filePath, "utf8");

        expect(text).toContain("A=1\nB=2\n");

        const emptyPath = `${root}/.env.example.empty`;

        await writeFile(emptyPath, "", "utf8");
        await expect(didEnsureEnvironmentExampleLines({
            filePath: emptyPath,
            lines: [ "C=3" ],
        })).resolves.toBe(true);
    });

    test("Barrel export normalizes missing ./ prefix", async () => {
        const barrelPath = `${root}/normalize.ts`;

        await writeFile(barrelPath, "", "utf8");

        await expect(didEnsureBarrelExport({ barrelPath, relativeExportPath: "Z" })).resolves.toBe(true);
        const text = await readFile(barrelPath, "utf8");

        expect(text).toContain("export * from \"./Z\";");
    });

    test("ZodObjectEntry adds property to zod.object + idempotency", async () => {
        const filePath = `${root}/config-validator.ts`;

        await writeFile(
            filePath,
            "import { zod } from \"@odg/config\";\n\nexport const configValidator = zod.object({\n});\n",
            "utf8",
        );

        await expect(didEnsureZodObjectEntry({
            filePath,
            constName: "configValidator",
            propertyName: appUrlPropertyName,
            propertyValue: zodStringPropertyValue,
        })).resolves.toBe(true);

        const text = await readFile(filePath, "utf8");

        expect(text).toContain(appUrlPropertyName);
        expect(text).toContain(zodStringPropertyValue);

        // Idempotency
        await expect(didEnsureZodObjectEntry({
            filePath,
            constName: "configValidator",
            propertyName: appUrlPropertyName,
            propertyValue: zodStringPropertyValue,
        })).resolves.toBe(false);
    });

    test("ZodObjectEntry throws when const not found", async () => {
        const filePath = `${root}/config-missing.ts`;

        await writeFile(filePath, "export const other = 1;\n", "utf8");

        await expect(didEnsureZodObjectEntry({
            filePath,
            constName: "configValidator",
            propertyName: fooPropertyName,
            propertyValue: zodStringPropertyValue,
        })).rejects.toThrow("configValidator");
    });

    test("ZodObjectEntry throws when initializer is not a call expression", async () => {
        const filePath = `${root}/config-not-call.ts`;

        await writeFile(filePath, "export const configValidator = {};\n", "utf8");

        await expect(didEnsureZodObjectEntry({
            filePath,
            constName: "configValidator",
            propertyName: fooPropertyName,
            propertyValue: zodStringPropertyValue,
        })).rejects.toThrow("call expression");
    });

    test("ZodObjectEntry throws when first argument is not an object literal", async () => {
        const filePath = `${root}/config-not-object.ts`;

        await writeFile(filePath, "export const configValidator = zod.object(someRef);\n", "utf8");

        await expect(didEnsureZodObjectEntry({
            filePath,
            constName: "configValidator",
            propertyName: fooPropertyName,
            propertyValue: zodStringPropertyValue,
        })).rejects.toThrow("object literal");
    });
});
