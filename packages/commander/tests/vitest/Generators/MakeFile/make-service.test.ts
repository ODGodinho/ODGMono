import { writeFile } from "node:fs/promises";

import { NullLogger } from "@odg/log";
import { describe, expect, test } from "vitest";

import MakeFile from "#app/Generators/MakeFile";

import { apiContainerEnum, prepareApiFixture, read } from "../../helpers/prepare-api-fixture.ts";

describe("make:service", () => {
    const make = new MakeFile(new NullLogger());
    const root = `${process.cwd()}/tests/vitest/cache/make-service`;

    test("wires enum → ContainerInterface → barrel → Singleton class, and its test", async () => {
        const { service } = await prepareApiFixture(root);

        await make.generateService("clock", service);

        expect(await read(service.containerEnumPath)).toBe(apiContainerEnum.replace(
            "    \"HealthService\" = \"health.service\",\n",
            "    \"HealthService\" = \"health.service\",\n    \"ClockService\" = \"clock.service\",\n",
        ));

        const containerInterface = await read(service.containerInterfacePath);

        expect(containerInterface).toContain("import type { HealthService, ClockService } from \"#services\";");
        expect(containerInterface).toContain([
            "    // Services",
            "    [ContainerName.HealthService]: HealthService;",
            "    [ContainerName.ClockService]: ClockService;",
            "}",
        ].join("\n"));
        expect(await read(`${service.path}/index.ts`))
            .toBe("export * from \"./HealthService.js\";\n\nexport * from \"./ClockService.js\";\n");

        const serviceClass = await read(`${service.path}/ClockService.ts`);

        expect(serviceClass).toContain("@ODGDecorators.injectable(ContainerName.ClockService, \"Singleton\")");
        expect(serviceClass).toContain(" * Singleton: one per process;");
        expect(serviceClass).not.toContain("{{");

        const serviceTest = await read(`${service.testPath}/ClockService.test.ts`);

        expect(serviceTest).toContain("import { container } from \"");
        expect(serviceTest).toContain("const service = container.get(ContainerName.ClockService);");
    });

    test("--request leaves the class without scope and resolves it from a request", async () => {
        const { service } = await prepareApiFixture(root);

        await make.generateService("Session", { ...service, request: true });

        const serviceClass = await read(`${service.path}/SessionService.ts`);

        expect(serviceClass).toContain("@ODGDecorators.injectable(ContainerName.SessionService)\n");
        expect(serviceClass).toContain(" * No scope: a new instance per injection");
        expect(await read(`${service.testPath}/SessionService.test.ts`))
            .toContain("const service = forRequest().get(ContainerName.SessionService);");
    });

    test("a second run aborts and touches nothing", async () => {
        const { service } = await prepareApiFixture(root);

        await make.generateService("Clock", service);

        const wiring = [ service.containerEnumPath, service.containerInterfacePath, `${service.path}/index.ts` ];
        const before = await Promise.all(wiring.map(read));

        await expect(make.generateService("Clock", service)).rejects.toThrow("already exists");
        await expect(Promise.all(wiring.map(read))).resolves.toEqual(before);
    });

    test("wiring left behind by a deleted class is not duplicated", async () => {
        const { service } = await prepareApiFixture(root);

        await writeFile(`${service.path}/index.ts`, "export * from \"./ClockService.js\";\n");
        await writeFile(service.containerEnumPath, apiContainerEnum.replace(
            "\"HealthService\" = \"health.service\",",
            "\"ClockService\" = \"clock.service\",",
        ));

        await make.generateService("Clock", service);

        const containerEnum = await read(service.containerEnumPath);

        expect(containerEnum.match(/ClockService/g)).toHaveLength(1);
        expect(await read(`${service.path}/index.ts`)).toBe("export * from \"./ClockService.js\";\n");
    });
});
