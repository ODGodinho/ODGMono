import { Logger } from "@odg/log";
import { ORPCError, os } from "@orpc/server";
import httpStatus from "http-status";
import * as zod from "zod";

/** Context the fixture procedures receive, standing in for a real API's own. */
interface TestContextInterface {
    requestId: string;
}

const base = os.$context<TestContextInterface>();

/**
 * Three procedures are enough to cover every outcome a transport can produce: one that answers,
 * one that fails with an `ORPCError` (whose semantic code the error contract has to preserve),
 * and one that fails with a plain exception carrying its own `statusCode` — the case
 * `statusInterceptor` exists for.
 */
const router = {
    ping: base
        .route({ method: "GET", path: "/ping" })
        .output(zod.object({ requestId: zod.string().trim() }))
        .handler(async ({ context }) => ({ requestId: context.requestId })),

    boom: base
        .route({ method: "GET", path: "/boom" })
        .handler(() => {
            throw new ORPCError("UNAUTHORIZED");
        }),

    boomWithStatus: base
        .route({ method: "GET", path: "/boom-with-status" })
        .handler(() => {
            throw Object.assign(new Error("no session"), { statusCode: httpStatus.FORBIDDEN });
        }),
};

/**
 * A logger with no handler pushed: it formats and resolves without writing anywhere, so a spy
 * sees exactly what the code under test passed it.
 *
 * @returns {Logger} A silent logger
 */
function createLogger(): Logger {
    return new Logger();
}

/**
 * Builds a request the way `Bun.serve` would hand one over: absolute URL, real `Headers`.
 *
 * @param {string} path Path, with or without a query string
 * @param {RequestInit} init Method, headers and body
 * @returns {Request} A request rooted at localhost
 */
function createRequest(path: string, init: RequestInit = {}): Request {
    return new Request(new URL(path, "http://localhost"), init);
}

export {
    createLogger,
    createRequest,
    router,
    type TestContextInterface,
};
