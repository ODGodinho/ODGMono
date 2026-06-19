import {
    mkdir,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises";

import { NullLogger } from "@odg/log";
import { describe, expect, test } from "vitest";

import MakeFile from "#app/Generators/MakeFile";

const configEnumFixture = "export enum ConfigName {\n}\n";

function emptyConfigValidator(): string {
    return [
        "import zod from \"zod\";",
        "import { ConfigName } from \"#enums\";",
        "",
        "export const configValidator = zod.object({",
        "});",
        "",
    ].join("\n");
}

describe("makeConfig Test", () => {
    const make = new MakeFile(new NullLogger());
    const cacheRoot = `${process.cwd()}/tests/vitest/cache/make-config`;

    test("makeConfig no-op when register=false (default)", async () => {
        await rm(cacheRoot, { recursive: true, force: true });
        await mkdir(cacheRoot, { recursive: true });

        await expect(make.generateConfig("AppName", {})).resolves.toBeUndefined();
    });

    test("Registers ConfigName enum member and .env.example with comment and empty default value", async () => {
        await rm(cacheRoot, { recursive: true, force: true });
        await mkdir(cacheRoot, { recursive: true });

        const configEnumPath = `${cacheRoot}/ConfigName.ts`;
        const environmentExamplePath = `${cacheRoot}/.env.example`;

        await writeFile(configEnumPath, configEnumFixture, "utf8");
        await writeFile(environmentExamplePath, "EXISTING=1\n", "utf8");

        await make.generateConfig("HANDLER_TIMEOUT", {
            register: true,
            configEnumPath,
            envExamplePath: environmentExamplePath,
        });

        const enumText = await readFile(configEnumPath, "utf8");

        expect(enumText.includes("\"HANDLER_TIMEOUT\" = \"HANDLER_TIMEOUT\"")).toBeTruthy();

        const environmentText = await readFile(environmentExamplePath, "utf8");

        expect(environmentText.includes("EXISTING=1\n\n# HANDLER_TIMEOUT")).toBeTruthy();
        expect(environmentText.includes("# HANDLER_TIMEOUT")).toBeTruthy();
        expect(environmentText.includes("HANDLER_TIMEOUT=\"\"")).toBeTruthy();
    });

    test("Registers entry in configValidator zod.object with default validator", async () => {
        await rm(cacheRoot, { recursive: true, force: true });
        await mkdir(cacheRoot, { recursive: true });

        const configEnumPath = `${cacheRoot}/ConfigName.ts`;
        const configValidatorPath = `${cacheRoot}/index.ts`;

        await writeFile(configEnumPath, configEnumFixture, "utf8");
        await writeFile(configValidatorPath, emptyConfigValidator(), "utf8");

        await make.generateConfig("APP_URL", {
            register: true,
            configEnumPath,
            configValidatorPath,
        });

        const validatorText = await readFile(configValidatorPath, "utf8");

        expect(validatorText.includes("[ConfigName.APP_URL]")).toBeTruthy();
        expect(validatorText.includes("zod.string()")).toBeTruthy();
    });

    test("Registers entry in configValidator with custom validator expression", async () => {
        await rm(cacheRoot, { recursive: true, force: true });
        await mkdir(cacheRoot, { recursive: true });

        const configEnumPath = `${cacheRoot}/ConfigName.ts`;
        const configValidatorPath = `${cacheRoot}/index.ts`;

        await writeFile(configEnumPath, configEnumFixture, "utf8");
        await writeFile(configValidatorPath, emptyConfigValidator(), "utf8");

        await make.generateConfig("USE_HEADLESS", {
            register: true,
            configEnumPath,
            configValidatorPath,
            validator: "CustomValidator.zodStringToBoolean()",
        });

        const validatorText = await readFile(configValidatorPath, "utf8");

        expect(validatorText.includes("[ConfigName.USE_HEADLESS]")).toBeTruthy();
        expect(validatorText.includes("CustomValidator.zodStringToBoolean()")).toBeTruthy();
    });

    test("Preserves config name already in CONST_CASE", async () => {
        await rm(cacheRoot, { recursive: true, force: true });
        await mkdir(cacheRoot, { recursive: true });

        const configEnumPath = `${cacheRoot}/ConfigName.ts`;
        const configValidatorPath = `${cacheRoot}/index.ts`;

        await writeFile(configEnumPath, configEnumFixture, "utf8");
        await writeFile(configValidatorPath, emptyConfigValidator(), "utf8");

        await make.generateConfig("ZECA_URL", {
            register: true,
            configEnumPath,
            configValidatorPath,
        });

        const enumText = await readFile(configEnumPath, "utf8");
        const validatorText = await readFile(configValidatorPath, "utf8");

        expect(enumText.includes("\"ZECA_URL\" = \"ZECA_URL\"")).toBeTruthy();
        expect(validatorText.includes("[ConfigName.ZECA_URL]")).toBeTruthy();
    });
});
