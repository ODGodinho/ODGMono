import httpStatus from "http-status";

import type { HttpRequestInterface } from "../../src/interfaces/HttpRequestInterface.ts";
import { CorsMiddleware } from "../../src/Middlewares/CorsMiddleware.ts";

import { createRequest } from "./support.ts";

const origin = "http://localhost:5173";
const allowOriginHeader = "access-control-allow-origin";
const path = "/api/anything";

/**
 * Drives one stage on its own.
 *
 * @param {CorsMiddleware} middleware The stage under test
 * @param {Request} request The incoming request
 * @returns {Promise<Response>} What the stage returned
 */
async function run(middleware: CorsMiddleware, request: Request): Promise<Response> {
    const context: HttpRequestInterface = { request, requestId: "test" };

    return middleware.handle(context, async () => Response.json({ done: true }));
}

describe("CorsMiddleware", () => {
    const middleware = new CorsMiddleware({ origins: [ origin ] });

    test("answers a preflight without reaching the rest of the pipeline", async () => {
        const response = await run(middleware, createRequest(path, {
            method: "OPTIONS",
            headers: {
                origin,
                "access-control-request-method": "GET",
                "access-control-request-headers": "content-type",
            },
        }));

        expect(response.status).toBe(httpStatus.NO_CONTENT);
        expect(response.headers.get("access-control-allow-headers")).toBe("content-type");
        expect(response.headers.get(allowOriginHeader)).toBe(origin);
    });

    test("echoes an allowed origin and credentials on a normal response", async () => {
        const response = await run(middleware, createRequest(path, { headers: { origin } }));

        expect(response.headers.get(allowOriginHeader)).toBe(origin);
        expect(response.headers.get("access-control-allow-credentials")).toBe("true");
        expect(response.headers.get("vary")).toBe("Origin");
    });

    test("an unknown origin gets Vary but no allow-origin", async () => {
        const response = await run(middleware, createRequest(path, {
            headers: { origin: "https://evil.example" },
        }));

        expect(response.headers.get(allowOriginHeader)).toBeNull();
        expect(response.headers.get("vary")).toBe("Origin");
    });
});
