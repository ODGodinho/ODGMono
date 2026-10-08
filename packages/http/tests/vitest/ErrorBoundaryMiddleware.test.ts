import httpStatus from "http-status";
import { vi } from "vitest";

import { NotFoundException } from "../../src/exceptions/NotFoundException.ts";
import { ExceptionSerializer } from "../../src/ExceptionSerializer.ts";
import type { HttpRequestInterface } from "../../src/interfaces/HttpRequestInterface.ts";
import { ErrorBoundaryMiddleware } from "../../src/Middlewares/ErrorBoundaryMiddleware.ts";

import { createLogger, createRequest } from "./support.ts";

describe("ErrorBoundaryMiddleware", () => {
    const context: HttpRequestInterface = { request: createRequest("/api/anything"), requestId: "abc" };

    test("serializes a client exception into the error contract and records it as notice", async () => {
        const logger = createLogger();
        const notice = vi.spyOn(logger, "notice").mockResolvedValue();
        const error = vi.spyOn(logger, "error").mockResolvedValue();
        const middleware = new ErrorBoundaryMiddleware({ logger, serializer: new ExceptionSerializer(false) });

        const response = await middleware.handle(context, async () => {
            throw new NotFoundException("no route");
        });

        expect(response.status).toBe(httpStatus.NOT_FOUND);
        expect(await response.json()).toStrictEqual({ message: "no route", type: "NotFoundException" });
        expect(notice).toHaveBeenCalledWith("no route", {
            exception: { type: "NotFoundException" },
            requestId: "abc",
            status: httpStatus.NOT_FOUND,
        });
        expect(error).not.toHaveBeenCalled();
    });

    test("records a server failure as error, with the exception", async () => {
        const logger = createLogger();
        const error = vi.spyOn(logger, "error").mockResolvedValue();
        const notice = vi.spyOn(logger, "notice").mockResolvedValue();
        const middleware = new ErrorBoundaryMiddleware({ logger, serializer: new ExceptionSerializer(false) });
        const failure = new Error("db down");

        const response = await middleware.handle(context, async () => {
            throw failure;
        });

        expect(response.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
        expect(error).toHaveBeenCalledWith(failure, { requestId: "abc" });
        expect(notice).not.toHaveBeenCalled();
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
