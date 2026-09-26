import { writeFile } from "node:fs/promises";

import { File } from "@odg/chemical-x";
import { NullLogger } from "@odg/log";
import { describe, expect, test } from "vitest";

import MakeFile, { type MakeRouteOptions } from "#app/Generators/MakeFile";

import { type ApiFixture, prepareApiFixture, read } from "../../helpers/prepare-api-fixture.ts";

function routeOptions(fixture: ApiFixture, options: Partial<MakeRouteOptions> = {}): MakeRouteOptions {
    return {
        method: "GET",
        serviceOptions: fixture.service,
        routesPath: fixture.routes,
        validatorsPath: fixture.validators,
        interfacesPath: fixture.interfaces,
        testPath: `${fixture.tests}/Routes`,
        ...options,
    };
}

describe("make:route", () => {
    const make = new MakeFile(new NullLogger());
    const root = `${process.cwd()}/tests/vitest/cache/make-route`;

    test("writes procedures only, validator, interface, their barrels and the router line", async () => {
        const fixture = await prepareApiFixture(root);

        await make.generateRoute("order", routeOptions(fixture, { method: "POST", path: "/orders" }));

        const route = await read(`${fixture.routes}/order.ts`);

        expect(route).toContain("export const store = base");
        expect(route).toContain(".route({ method: \"POST\", path: \"/orders\" })");
        expect(route).toContain(".handler(() => ({}));");
        expect(route).not.toContain("ContainerName");
        expect(await read(`${fixture.validators}/OrderValidator.ts`)).toContain("export namespace OrderValidator {");
        expect(await read(`${fixture.interfaces}/OrderInterface.ts`))
            .toContain("export type Output = zod.infer<typeof OrderValidator.outputValidator>;");
        expect(await read(`${fixture.tests}/Routes/order.test.ts`)).toContain("call(order.store, {}, { context })");
        expect(await read(`${fixture.routes}/index.ts`))
            .toBe("export * as health from \"./health.js\";\n\nexport * as order from \"./order.js\";\n");
        expect(await read(`${fixture.validators}/index.ts`)).toContain("\n\nexport * from \"./OrderValidator.js\";\n");
        expect(await read(`${fixture.interfaces}/index.ts`))
            .toContain("\n\nexport type * from \"./OrderInterface.js\";\n");
        expect(await read(fixture.service.containerEnumPath)).not.toContain("OrderService");
    });

    test("--service chains make:service, typed by the feature interface", async () => {
        const fixture = await prepareApiFixture(root);

        await make.generateRoute("purchase-order", routeOptions(fixture, { service: true }));

        const route = await read(`${fixture.routes}/purchaseOrder.ts`);

        expect(route).toContain("export const show = base");
        expect(route).toContain("path: \"/purchaseOrder\"");
        expect(route).toContain("context.container.get(ContainerName.PurchaseOrderService)");
        expect(await read(`${fixture.service.path}/PurchaseOrderService.ts`))
            .toContain("execute(input: PurchaseOrderInterface.Input): Promise<PurchaseOrderInterface.Output>");
        expect(await read(`${fixture.service.testPath}/PurchaseOrderService.test.ts`))
            .toContain("expect(await service.execute({})).toEqual({});");
        expect(await read(fixture.service.containerEnumPath))
            .toContain("\"PurchaseOrderService\" = \"purchase.order.service\",");
        expect(await read(`${fixture.routes}/index.ts`)).toContain("export * as purchaseOrder from \"./purchaseOrder.js\";");
    });

    test("an existing service aborts before the route is written", async () => {
        const fixture = await prepareApiFixture(root);

        await writeFile(`${fixture.service.path}/OrderService.ts`, "");

        await expect(make.generateRoute("order", routeOptions(fixture, { service: true })))
            .rejects
            .toThrow("OrderService.ts");
        expect(await new File(`${fixture.routes}/order.ts`).exists()).toBe(false);
        expect(await read(`${fixture.routes}/index.ts`)).toBe("export * as health from \"./health.js\";\n");
    });

    test("a second run aborts and touches nothing", async () => {
        const fixture = await prepareApiFixture(root);

        await make.generateRoute("order", routeOptions(fixture));

        const barrels = [ fixture.routes, fixture.validators, fixture.interfaces ].map((folder) => `${folder}/index.ts`);
        const before = await Promise.all(barrels.map(read));

        await expect(make.generateRoute("order", routeOptions(fixture))).rejects.toThrow("already exists");
        await expect(Promise.all(barrels.map(read))).resolves.toEqual(before);
    });
});
