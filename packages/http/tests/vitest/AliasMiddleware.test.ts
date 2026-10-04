import type { HttpRequestInterface } from "../../src/interfaces/HttpRequestInterface.ts";
import { AliasMiddleware } from "../../src/Middlewares/AliasMiddleware.ts";

import { createRequest } from "./support.ts";

describe("AliasMiddleware", () => {
    const middleware = new AliasMiddleware({ "/api/health": [ "/health", "/healthz" ] });

    /**
     * Runs the stage and reports the pathname the rest of the pipeline received.
     *
     * @param {string} path Path the client called
     * @returns {Promise<string>} The pathname seen downstream
     */
    async function pathnameBelow(path: string): Promise<string> {
        let seen = "";
        const context: HttpRequestInterface = { request: createRequest(path), requestId: "test" };

        await middleware.handle(context, async (downstream) => {
            seen = new URL(downstream.request.url).pathname;

            return new Response(null);
        });

        return seen;
    }

    test("rewrites every alias onto the canonical path", async () => {
        expect(await pathnameBelow("/health")).toBe("/api/health");
        expect(await pathnameBelow("/healthz")).toBe("/api/health");
    });

    test("leaves an unknown path alone, and does not match by prefix", async () => {
        expect(await pathnameBelow("/api/anything")).toBe("/api/anything");
        expect(await pathnameBelow("/health/deep")).toBe("/health/deep");
    });

    test("carries method, headers and body through the rewrite", async () => {
        const request = createRequest("/health", {
            method: "POST",
            body: "payload",
            headers: { "content-type": "text/plain" },
        });
        const context: HttpRequestInterface = { request, requestId: "test" };

        await middleware.handle(context, async (downstream) => {
            expect(downstream.request.method).toBe("POST");
            expect(downstream.request.headers.get("content-type")).toBe("text/plain");
            expect(await downstream.request.text()).toBe("payload");

            return new Response(null);
        });
    });
});
