import {
    mkdir,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises";

import type { MakeServiceOptions } from "#app/Generators/MakeFile";

/** The sections of the Stanley-API `ContainerName`: `// Services` is followed by `// Request`. */
export const apiContainerEnum = [
    "export enum ContainerName {",
    "    \"Logger\" = \"logger\",",
    "",
    "    // Services",
    "    \"HealthService\" = \"health.service\",",
    "",
    "    // Request: bound only in the RequestContainer each request lives inside",
    "    \"Request\" = \"request\",",
    "}",
    "",
].join("\n");

export const apiContainerInterface = [
    "import type { Logger } from \"@odg/log\";",
    "",
    "import type { HealthService } from \"#services\";",
    "",
    "export interface ContainerInterface {",
    "    [ContainerName.Logger]: Logger;",
    "",
    "    // Services",
    "    [ContainerName.HealthService]: HealthService;",
    "}",
    "",
    "export interface RequestContainerInterface extends ContainerInterface {",
    "    [ContainerName.Request]: Request;",
    "}",
    "",
].join("\n");

export interface ApiFixture {
    root: string;
    service: MakeServiceOptions;
    routes: string;
    validators: string;
    interfaces: string;
    middlewares: string;
    tests: string;
}

/**
 * Recreates a minimal Stanley-API tree under `root`: the wiring files with their sections and the
 * barrels that already exist in the template.
 *
 * @param {string} root Fixture folder, wiped first
 * @returns {Promise<ApiFixture>} Paths to pass to the generators
 */
export async function prepareApiFixture(root: string): Promise<ApiFixture> {
    await rm(root, { recursive: true, force: true });

    const fixture: ApiFixture = {
        root,
        service: {
            path: `${root}/src/app/Services`,
            testPath: `${root}/tests/unit/Services`,
            containerEnumPath: `${root}/src/app/Enums/ContainerName.ts`,
            containerInterfacePath: `${root}/@types/ContainerInterface.d.ts`,
        },
        routes: `${root}/src/Http/Routes`,
        validators: `${root}/src/Validators`,
        interfaces: `${root}/src/Interfaces`,
        middlewares: `${root}/src/Http/Middlewares`,
        tests: `${root}/tests/unit/Http`,
    };

    await Promise.all([
        `${root}/src/app/Enums`,
        `${root}/@types`,
        fixture.service.path,
        fixture.routes,
        fixture.validators,
        fixture.interfaces,
    ].map(async (folder) => mkdir(folder, { recursive: true })));

    await Promise.all([
        writeFile(fixture.service.containerEnumPath, apiContainerEnum),
        writeFile(fixture.service.containerInterfacePath, apiContainerInterface),
        writeFile(`${fixture.service.path}/index.ts`, "export * from \"./HealthService.js\";\n"),
        writeFile(`${fixture.routes}/index.ts`, "export * as health from \"./health.js\";\n"),
        writeFile(`${fixture.validators}/index.ts`, "export * from \"./CustomValidator.js\";\n"),
        writeFile(`${fixture.interfaces}/index.ts`, "export type * from \"./DatabaseInterface.js\";\n"),
    ]);

    return fixture;
}

export async function read(path: string): Promise<string> {
    return readFile(path, "utf8");
}
