import httpStatus from "http-status";

import { ExceptionSerializer } from "../../src/ExceptionSerializer.ts";
import { HttpPipeline } from "../../src/HttpPipeline.ts";
import type { HttpRequestInterface } from "../../src/interfaces/HttpRequestInterface.ts";
import { OpenApiDocumentMiddleware } from "../../src/Middlewares/OpenApiDocumentMiddleware.ts";
import { OpenApiMiddleware } from "../../src/Middlewares/OpenApiMiddleware.ts";
import { RpcMiddleware } from "../../src/Middlewares/RpcMiddleware.ts";

import { createRequest, router, type TestContextInterface } from "./support.ts";

const serializer = new ExceptionSerializer(false);
const documentPath = "/api/openapi";
const statusFailurePath = "/api/boom-with-status";

/**
 * The context the fixture procedures run with, carrying the correlation id the pipeline resolved.
 *
 * @param {HttpRequestInterface} context The request and its correlation id
 * @returns {TestContextInterface} Context handed to the procedures
 */
function createContext(context: HttpRequestInterface): TestContextInterface {
    return { requestId: context.requestId };
}

/**
 * The composition a REST + RPC API declares, with the document exposed.
 *
 * @returns {HttpPipeline} A pipeline over the fixture router
 */
function createPipeline(): HttpPipeline {
    return new HttpPipeline({
        middlewares: [
            new OpenApiDocumentMiddleware(router, { path: documentPath, title: "Fixture" }),
            new RpcMiddleware(router, { context: createContext, prefix: "/rpc" }),
            new OpenApiMiddleware(router, { context: createContext, prefix: "/api", serializer }),
        ],
    });
}

describe("oRPC surfaces", () => {
    const pipeline = createPipeline();

    test("answers a procedure on both surfaces", async () => {
        const rest = await pipeline.fetch(createRequest("/api/ping"));
        const rpc = await pipeline.fetch(createRequest("/rpc/ping", { method: "POST", body: "{}" }));

        expect(rest.status).toBe(httpStatus.OK);
        expect(rpc.status).toBe(httpStatus.OK);
    });

    test("a domain exception keeps the status it declared", async () => {
        const response = await pipeline.fetch(createRequest(statusFailurePath));

        expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    test("the REST surface encodes a procedure failure with the shared serializer", async () => {
        const response = await pipeline.fetch(createRequest("/api/boom"));

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
        expect(await response.json()).toMatchObject({ type: "UNAUTHORIZED" });
    });

    test("serves the OpenAPI document, generating it once", async () => {
        const first = await pipeline.fetch(createRequest(documentPath));
        const second = await pipeline.fetch(createRequest(documentPath));

        expect(await first.json()).toMatchObject({ info: { title: "Fixture", version: "0.0.0" } });
        expect(second.status).toBe(httpStatus.OK);
    });

    test("a path under a prefix that names no procedure falls through to the pipeline", async () => {
        const response = await pipeline.fetch(createRequest("/api/nope"));

        expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    test("names the failure with oRPC's own code, not the HTTP reason phrase", async () => {
        const response = await pipeline.fetch(createRequest(statusFailurePath));

        expect(await response.json()).toMatchObject({ type: "FORBIDDEN" });
    });

    test("interceptors can be removed, and then the status is lost", async () => {
        const bare = new HttpPipeline({
            middlewares: [ new OpenApiMiddleware(router, { context: createContext, interceptors: [], serializer }) ],
        });

        const response = await bare.fetch(createRequest(statusFailurePath));

        expect(response.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    });
});
