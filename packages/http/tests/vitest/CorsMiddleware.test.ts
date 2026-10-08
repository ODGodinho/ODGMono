import httpStatus from "http-status";

import type { HttpRequestInterface } from "../../src/interfaces/HttpRequestInterface.ts";
import { CorsMiddleware } from "../../src/Middlewares/CorsMiddleware.ts";

import { createRequest } from "./support.ts";

const origin = "http://localhost:5173";
const allowOriginHeader = "access-control-allow-origin";
const allowCredentialsHeader = "access-control-allow-credentials";
const requestMethodHeader = "access-control-request-method";
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
                [requestMethodHeader]: "GET",
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
        expect(response.headers.get(allowCredentialsHeader)).toBe("true");
        expect(response.headers.get("vary")).toBe("Origin");
    });

    test("an unknown origin gets Vary but no allow-origin", async () => {
        const response = await run(middleware, createRequest(path, {
            headers: { origin: "https://evil.example" },
        }));

        expect(response.headers.get(allowOriginHeader)).toBeNull();
        expect(response.headers.get("vary")).toBe("Origin");
    });

    test("a single '*' origin allows every caller and omits credentials", async () => {
        const open = new CorsMiddleware({ origins: [ "*" ] });
        const response = await run(open, createRequest(path, { headers: { origin: "https://anywhere.example" } }));

        expect(response.headers.get(allowOriginHeader)).toBe("*");
        expect(response.headers.has(allowCredentialsHeader)).toBe(false);
        expect(response.headers.has("vary")).toBe(false);
    });

    test("'*' on a preflight is the same mode", async () => {
        const open = new CorsMiddleware({ origins: [ "*" ] });
        const response = await run(open, createRequest(path, {
            method: "OPTIONS",
            headers: {
                origin: "https://anywhere.example",
                [requestMethodHeader]: "POST",
            },
        }));

        expect(response.status).toBe(httpStatus.NO_CONTENT);
        expect(response.headers.get(allowOriginHeader)).toBe("*");
        expect(response.headers.has(allowCredentialsHeader)).toBe(false);
    });

    test("'*' mixed with another origin is rejected", () => {
        expect(() => new CorsMiddleware({ origins: [ "*", origin ] })).toThrow(
            "CORS origin \"*\" cannot be combined with other origins",
        );
    });

    test("a preflight that asks for no headers gets no allow-headers", async () => {
        const response = await run(middleware, createRequest(path, {
            method: "OPTIONS",
            headers: { origin, [requestMethodHeader]: "GET" },
        }));

        expect(response.status).toBe(httpStatus.NO_CONTENT);
        expect(response.headers.has("access-control-allow-headers")).toBe(false);
    });
});
