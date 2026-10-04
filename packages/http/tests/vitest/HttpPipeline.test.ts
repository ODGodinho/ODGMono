import { vi } from "vitest";

import { ExceptionSerializer } from "../../src/ExceptionSerializer.ts";
import { HttpPipeline } from "../../src/HttpPipeline.ts";
import type { HttpRequestInterface } from "../../src/interfaces/HttpRequestInterface.ts";
import type { MiddlewareInterface } from "../../src/interfaces/MiddlewareInterface.ts";
import { ErrorBoundaryMiddleware } from "../../src/Middlewares/ErrorBoundaryMiddleware.ts";

import { createLogger, createRequest } from "./support.ts";

const requestIdPattern = /^[\d\-a-f]{36}$/u;

/**
 * A stage that answers every request, so the pipeline never reaches its own 404.
 *
 * @returns {MiddlewareInterface} The terminal stage
 */
function answering(): MiddlewareInterface {
    return {
        handle: async (context: HttpRequestInterface): Promise<Response> => Response.json({ id: context.requestId }),
    };
}

/**
 * A stage that records when it ran, before and after the rest of the pipeline.
 *
 * @param {string} name How this stage appears in the trace
 * @param {string[]} trace Where the marks are collected
 * @returns {MiddlewareInterface} The recording stage
 */
function tracing(name: string, trace: string[]): MiddlewareInterface {
    return {
        handle: async (context, next): Promise<Response> => {
            trace.push(`${name}:before`);

            const response = await next(context);

            trace.push(`${name}:after:${response.status}`);

            return response;
        },
    };
}

/**
 * A stage that throws, standing in for any failure below the boundary.
 *
 * @returns {MiddlewareInterface} The failing stage
 */
function failing(): MiddlewareInterface {
    return {
        handle: async (): Promise<Response> => {
            throw new Error("nothing caught this");
        },
    };
}

describe("HttpPipeline", () => {
    test("generates a correlation id and echoes it on the response", async () => {
        const pipeline = new HttpPipeline({ middlewares: [ answering() ] });
        const response = await pipeline.fetch(createRequest("/anything"));

        expect(response.headers.get(HttpPipeline.requestIdHeader)).toMatch(requestIdPattern);
    });

    test("keeps the caller's correlation id, and ignores a blank one", async () => {
        const pipeline = new HttpPipeline({ middlewares: [ answering() ] });
        const kept = await pipeline.fetch(createRequest("/anything", { headers: { "x-request-id": " kept " } }));
        const blank = await pipeline.fetch(createRequest("/anything", {
            headers: { "x-request-id": " ".repeat(3) },
        }));

        expect(kept.headers.get(HttpPipeline.requestIdHeader)).toBe("kept");
        expect(blank.headers.get(HttpPipeline.requestIdHeader)).toMatch(requestIdPattern);
    });

    test("an unmatched request reaches the last stage as a 404", async () => {
        const pipeline = new HttpPipeline({ middlewares: [] });
        const response = await pipeline.fetch(createRequest("/nowhere"));

        expect(response.status).toBe(404);
    });

    test("the last resort answers a status without a body, and records it", async () => {
        const logger = createLogger();
        const error = vi.spyOn(logger, "error").mockResolvedValue();
        const pipeline = new HttpPipeline({ logger, middlewares: [ failing() ] });

        const response = await pipeline.fetch(createRequest("/anything"));

        expect(response.status).toBe(500);
        expect(await response.text()).toBe("");
        expect(error).toHaveBeenCalledOnce();
    });

    test("array order is the nesting: a stage above the boundary sees the error response", async () => {
        const trace: string[] = [];
        const logger = createLogger();

        vi.spyOn(logger, "error").mockResolvedValue();

        const pipeline = new HttpPipeline({
            middlewares: [
                tracing("outer", trace),
                new ErrorBoundaryMiddleware({ logger, serializer: new ExceptionSerializer(false) }),
                tracing("inner", trace),
            ],
        });

        const response = await pipeline.fetch(createRequest("/nowhere"));

        expect(response.status).toBe(404);
        expect(trace).toStrictEqual([ "outer:before", "inner:before", "outer:after:404" ]);
    });
});
