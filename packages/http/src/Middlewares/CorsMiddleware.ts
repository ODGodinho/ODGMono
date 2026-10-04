import httpStatus from "http-status";

import type { CorsOptionsInterface } from "../interfaces/HttpOptionsInterface.ts";
import type { HttpDispatchType, HttpRequestInterface } from "../interfaces/HttpRequestInterface.ts";
import type { MiddlewareInterface } from "../interfaces/MiddlewareInterface.ts";

/**
 * Decides what cross-origin headers each response carries, for a fixed set of trusted browser
 * origins.
 *
 * The matching origin is echoed back rather than answered with `*` because `*` is illegal together
 * with `Access-Control-Allow-Credentials: true` — the browser would drop the session cookie.
 *
 * Placed above the surfaces rather than inside one: an oRPC plugin would only cover the procedures,
 * leaving a mounted SDK and the 404 path without headers, which a browser reads as a network
 * failure instead of the status the server sent. An API with no browser client simply leaves this
 * class out of the array, and then no response carries `Vary: Origin` to fragment upstream caches.
 */
export class CorsMiddleware implements MiddlewareInterface {

    private readonly allowedOrigins: Set<string>;

    private readonly allowedMethods: string;

    private readonly maxAge: string;

    public constructor(options: CorsOptionsInterface) {
        const defaultMethods = [ "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS" ];
        const defaultMaxAgeSeconds = 86_400;

        this.allowedOrigins = new Set(options.origins);
        this.allowedMethods = (options.methods ?? defaultMethods).join(", ");
        this.maxAge = String(options.maxAgeSeconds ?? defaultMaxAgeSeconds);
    }

    /**
     * Answers a preflight itself, or decorates whatever the rest of the pipeline returned — errors
     * and 404s included, since those are exactly the responses a browser would otherwise report as
     * a network failure.
     *
     * @param {HttpRequestInterface} context The request and its correlation id
     * @param {HttpDispatchType} next The rest of the pipeline
     * @returns {Promise<Response>} The decorated response
     */
    public async handle(context: HttpRequestInterface, next: HttpDispatchType): Promise<Response> {
        const { request } = context;
        const response = this.preflight(request) ?? await next(context);

        this.decorate(request, response.headers);

        return response;
    }

    /**
     * The 204 a preflight is answered with, or null when the request is not one.
     *
     * `Access-Control-Allow-Origin` and `Vary: Origin` are deliberately absent: `handle` decorates
     * every response it returns, this one included, and setting them twice would duplicate the
     * `Vary` entry.
     *
     * @param {Request} request The incoming request
     * @returns {Response | null} The preflight response, or null
     */
    private preflight(request: Request): Response | null {
        if (request.method !== "OPTIONS" || !request.headers.has("access-control-request-method")) {
            return null;
        }

        const headers = new Headers({
            "access-control-allow-methods": this.allowedMethods,
            "access-control-max-age": this.maxAge,
        });
        const requestedHeaders = request.headers.get("access-control-request-headers");

        if (requestedHeaders !== null) {
            headers.set("access-control-allow-headers", requestedHeaders);
            headers.append("vary", "Access-Control-Request-Headers");
        }

        return new Response(null, { headers, status: httpStatus.NO_CONTENT });
    }

    /**
     * Adds the cross-origin headers to a response that is already built.
     *
     * @param {Request} request The request the response answers
     * @param {Headers} headers Headers of the outgoing response
     * @returns {void}
     */
    private decorate(request: Request, headers: Headers): void {
        const origin = request.headers.get("origin");

        headers.append("vary", "Origin");

        if (origin === null || !this.allowedOrigins.has(origin)) {
            return;
        }

        headers.set("access-control-allow-origin", origin);
        headers.set("access-control-allow-credentials", "true");
    }

}
