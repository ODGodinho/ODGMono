import {
    mkdir,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises";

import { NullLogger } from "@odg/log";
import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from "vitest";

import MakeFile, { type RemoveConfigOptions } from "#app/Generators/MakeFile";

const root = `${process.cwd()}/tests/vitest/cache/remove-config`;

const appBlock = [ "# Application", "APP_NAME=\"Stanley\"", "" ];

const files = {
    configName: [
        "export enum ConfigName {",
        "    \"APP_NAME\" = \"APP_NAME\",",
        "    \"DB_HOST\" = \"DB_HOST\",",
        "    \"DB_PORT\" = \"DB_PORT\",",
        "    \"PEER_REQUEST_TIMEOUT\" = \"PEER_REQUEST_TIMEOUT\",",
        "}",
        "",
    ].join("\n"),
    validator: [
        "import zod from \"zod\";",
        "import { ConfigName } from \"#enums\";",
        "",
        "export const configValidator = zod.object({",
        "    [ConfigName.APP_NAME]: zod.string(),",
        "    [ConfigName.DB_HOST]: zod.string(),",
        "    [ConfigName.DB_PORT]: zod.coerce.number(),",
        "    [ConfigName.PEER_REQUEST_TIMEOUT]: zod.coerce.number(),",
        "});",
        "",
    ].join("\n"),
    setup: [
        "import { ConfigName } from \"#enums\";",
        "",
        "export const testEnvironmentDefaults: Record<ConfigName, string> = {",
        "    [ConfigName.APP_NAME]: \"App\",",
        "    [ConfigName.DB_HOST]: \"localhost\",",
        "    [ConfigName.DB_PORT]: \"5433\",",
        "    [ConfigName.PEER_REQUEST_TIMEOUT]: \"5000\",",
        "};",
        "",
    ].join("\n"),
    example: [
        ...appBlock,
        "# Postgres credentials",
        "DB_HOST=\"localhost\"",
        "DB_PORT=5433",
        "",
        "# MS one node waits for another to answer",
        "PEER_REQUEST_TIMEOUT=5000",
        "",
    ].join("\n"),
    environment: "APP_NAME=\"Local\"\nDB_HOST=localhost\nDB_PORT=5434\nPEER_REQUEST_TIMEOUT=5000\n",
};

const paths: Required<Omit<RemoveConfigOptions, "force">> = {
    configEnumPath: `${root}/src/ConfigName.ts`,
    configValidatorPath: `${root}/src/Config.ts`,
    testSetupPath: `${root}/tests/bootstrap.ts`,
    envExamplePath: `${root}/.env.example`,
    envPath: `${root}/.env`,
    rootPath: root,
};

async function read(path: string): Promise<string> {
    return readFile(path, "utf8");
}

describe("removeConfig", () => {
    const logger = new NullLogger();
    const make = new MakeFile(logger);
    const info = vi.spyOn(logger, "info");
    const warning = vi.spyOn(logger, "warning");

    beforeEach(async () => {
        info.mockClear();
        warning.mockClear();
        await rm(root, { recursive: true, force: true });
        await mkdir(`${root}/src`, { recursive: true });
        await mkdir(`${root}/tests`, { recursive: true });
        await writeFile(paths.configEnumPath, files.configName, "utf8");
        await writeFile(paths.configValidatorPath, files.validator, "utf8");
        await writeFile(paths.testSetupPath, files.setup, "utf8");
        await writeFile(paths.envExamplePath, files.example, "utf8");
        await writeFile(paths.envPath, files.environment, "utf8");
    });

    test("takes the key out of the enum, the validator, the test defaults and both env files", async () => {
        await make.removeConfig([ "PEER_REQUEST_TIMEOUT" ], paths);

        for (const path of Object.values(paths).slice(0, 5)) {
            expect(await read(path)).not.toContain("PEER_REQUEST_TIMEOUT");
        }

        expect(await read(paths.configEnumPath)).toContain("\"APP_NAME\" = \"APP_NAME\"");
        expect(await read(paths.configValidatorPath)).toContain("[ConfigName.DB_PORT]: zod.coerce.number()");
        expect(await read(paths.testSetupPath)).toContain("[ConfigName.DB_HOST]: \"localhost\"");
        expect(info).toHaveBeenCalledWith(expect.stringContaining("Config \"PEER_REQUEST_TIMEOUT\" removed from:"));
        expect(warning).not.toHaveBeenCalled();
    });

    test("takes the comment of a lone variable with it, and the blank line that separated it", async () => {
        await make.removeConfig([ "PEER_REQUEST_TIMEOUT" ], paths);

        expect(await read(paths.envExamplePath)).toBe([
            ...appBlock,
            "# Postgres credentials",
            "DB_HOST=\"localhost\"",
            "DB_PORT=5433",
            "",
        ].join("\n"));
    });

    test("keeps the header of a group until its last variable goes", async () => {
        await make.removeConfig([ "DB_HOST" ], paths);

        expect(await read(paths.envExamplePath)).toContain("# Postgres credentials\nDB_PORT=5433");

        await make.removeConfig([ "DB_PORT" ], paths);

        expect(await read(paths.envExamplePath)).toBe([
            ...appBlock,
            "# MS one node waits for another to answer",
            "PEER_REQUEST_TIMEOUT=5000",
            "",
        ].join("\n"));
    });

    test("removes several keys at once, spelled as make:config takes them", async () => {
        await make.removeConfig([ "DbHost", "DB_PORT" ], paths);

        expect(await read(paths.configEnumPath)).not.toContain("DB_");
        expect(await read(paths.envPath)).toBe("APP_NAME=\"Local\"\nPEER_REQUEST_TIMEOUT=5000\n");
    });

    test("refuses, and changes nothing, while code still reads the key", async () => {
        await writeFile(`${root}/src/Service.ts`, "const timeout = config.get(ConfigName.DB_HOST);\n", "utf8");

        await expect(make.removeConfig([ "DB_PORT", "DB_HOST" ], paths)).rejects.toThrow(
            "Config still read by code, nothing was removed (use --force to remove anyway):\n"
            + "  src/Service.ts:1  const timeout = config.get(ConfigName.DB_HOST);",
        );
        expect(await read(paths.configEnumPath)).toBe(files.configName);
        expect(await read(paths.envPath)).toBe(files.environment);
    });

    test("removes it anyway with force", async () => {
        await writeFile(`${root}/src/Service.ts`, "const timeout = config.get(ConfigName.DB_HOST);\n", "utf8");
        await make.removeConfig([ "DB_HOST" ], { ...paths, force: true });

        expect(await read(paths.configEnumPath)).not.toContain("DB_HOST");
    });

    test("does not mistake a longer key for the one being removed", async () => {
        await writeFile(`${root}/src/Service.ts`, "config.get(ConfigName.DB_HOST_REPLICA);\n", "utf8");
        await make.removeConfig([ "DB_HOST" ], paths);

        expect(await read(paths.configEnumPath)).not.toContain("\"DB_HOST\"");
    });

    test("warns about a key that is nowhere, without failing", async () => {
        await make.removeConfig([ "NOT_THERE" ], paths);

        expect(warning).toHaveBeenCalledWith("Config \"NOT_THERE\" was not found in any file");
    });

    test("reports what still mentions the key and is not edited blindly, but not the env files", async () => {
        await mkdir(`${root}/.github`, { recursive: true });
        await mkdir(`${root}/node_modules/pkg`, { recursive: true });
        await writeFile(`${root}/.github/ci.yml`, "env:\n  DB_HOST: localhost\n", "utf8");
        await writeFile(`${root}/node_modules/pkg/index.ts`, "DB_HOST\n", "utf8");
        await writeFile(`${root}/.env.local`, "DB_HOST=other\n", "utf8");
        await make.removeConfig([ "DB_HOST" ], paths);

        expect(warning).toHaveBeenCalledTimes(1);
        expect(warning).toHaveBeenCalledWith("Still mentioned, check by hand: .github/ci.yml:2  DB_HOST: localhost");
    });

    test("works with only the paths it was given", async () => {
        await make.removeConfig([ "ZZ_NOT_A_REAL_KEY" ], { rootPath: root });

        expect(warning).toHaveBeenCalledWith("Config \"ZZ_NOT_A_REAL_KEY\" was not found in any file");
    });

    test("scans the current folder when no root is given", async () => {
        await make.removeConfig([ "ZZ_NOT_A_REAL_KEY" ], {});

        expect(warning).toHaveBeenCalledWith("Config \"ZZ_NOT_A_REAL_KEY\" was not found in any file");
    });
});
