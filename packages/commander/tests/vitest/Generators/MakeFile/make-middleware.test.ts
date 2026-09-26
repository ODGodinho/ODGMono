import { NullLogger } from "@odg/log";
import {
    describe,
    expect,
    test,
    vi,
} from "vitest";

import MakeFile from "#app/Generators/MakeFile";

import { prepareApiFixture, read } from "../../helpers/prepare-api-fixture.ts";

describe("make:middleware", () => {
    const logger = new NullLogger();
    const make = new MakeFile(logger);
    const root = `${process.cwd()}/tests/vitest/cache/make-middleware`;

    test("writes the class, its test and the barrel, and only prints where it goes", async () => {
        const fixture = await prepareApiFixture(root);
        const info = vi.spyOn(logger, "info");
        const options = { path: fixture.middlewares, testPath: fixture.tests };

        await make.generateMiddleware("request-timing", options);

        expect(await read(`${fixture.middlewares}/RequestTimingMiddleware.ts`))
            .toContain("export class RequestTimingMiddleware implements MiddlewareInterface {");
        expect(await read(`${fixture.tests}/RequestTimingMiddleware.test.ts`))
            .toContain("import { RequestTimingMiddleware } from \"#http/Middlewares/RequestTimingMiddleware.js\";");
        expect(await read(`${fixture.middlewares}/index.ts`)).toBe("export * from \"./RequestTimingMiddleware.js\";\n");

        const [ [ message ] ] = info.mock.calls as [ [ string ] ];

        expect(message).toContain("    new RequestTimingMiddleware(),");
        expect(message).toContain("Above ErrorBoundaryMiddleware");

        await expect(make.generateMiddleware("RequestTiming", options)).rejects.toThrow("already exists");
        expect(await read(`${fixture.middlewares}/index.ts`)).toBe("export * from \"./RequestTimingMiddleware.js\";\n");
    });
});
