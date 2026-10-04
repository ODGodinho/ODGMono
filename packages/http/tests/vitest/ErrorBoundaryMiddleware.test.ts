import { vi } from "vitest";

import { NotFoundException } from "../../src/exceptions/NotFoundException.ts";
import { ExceptionSerializer } from "../../src/ExceptionSerializer.ts";
import type { HttpRequestInterface } from "../../src/interfaces/HttpRequestInterface.ts";
import { ErrorBoundaryMiddleware } from "../../src/Middlewares/ErrorBoundaryMiddleware.ts";

import { createLogger, createRequest } from "./support.ts";

describe("ErrorBoundaryMiddleware", () => {
    const context: HttpRequestInterface = { request: createRequest("/api/anything"), requestId: "abc" };

    test("serializes a thrown exception into the error contract and records it", async () => {
        const logger = createLogger();
        const error = vi.spyOn(logger, "error").mockResolvedValue();
        const middleware = new ErrorBoundaryMiddleware({ logger, serializer: new ExceptionSerializer(false) });

        const response = await middleware.handle(context, async () => {
            throw new NotFoundException("no route");
        });

        expect(response.status).toBe(404);
        expect(await response.json()).toStrictEqual({ message: "no route", type: "NotFoundException" });
        expect(error).toHaveBeenCalledWith(expect.any(Error), { requestId: "abc" });
    });

    test("passes a successful response through untouched", async () => {
        const logger = createLogger();
        const error = vi.spyOn(logger, "error").mockResolvedValue();
        const middleware = new ErrorBoundaryMiddleware({ logger, serializer: new ExceptionSerializer(false) });

        const response = await middleware.handle(context, async () => Response.json({ done: true }));

        expect(await response.json()).toStrictEqual({ done: true });
        expect(error).not.toHaveBeenCalled();
    });
});
