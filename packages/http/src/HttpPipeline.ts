import { detach } from "@odg/chemical-x";
import httpStatus from "http-status";

import { NotFoundException } from "./exceptions/NotFoundException.ts";
import type { HttpPipelineOptionsInterface } from "./interfaces/HttpOptionsInterface.ts";
import type { HttpDispatchType, HttpRequestInterface } from "./interfaces/HttpRequestInterface.ts";
import { statusOf } from "./status-of.ts";

export class HttpPipeline {

    public static readonly requestIdHeader = "x-request-id";

    private readonly dispatch: HttpDispatchType;

    private readonly header: string;

    public constructor(
        private readonly options: HttpPipelineOptionsInterface,
    ) {
        this.header = options.requestIdHeader ?? HttpPipeline.requestIdHeader;
        this.dispatch = options.middlewares.reduceRight<HttpDispatchType>(
            (next, middleware) => async (context): Promise<Response> => middleware.handle(context, next),
            async (context): Promise<Response> => {
                throw new NotFoundException(`No route matches ${new URL(context.request.url).pathname}`);
            },
        );
    }

    /**
     * Answers one request, whatever happens inside.
     *
     * @param {Request} request The incoming request
     * @returns {Promise<Response>} The response, carrying the correlation header
     */
    public async fetch(request: Request): Promise<Response> {
        const context: HttpRequestInterface = { request, requestId: this.resolveRequestId(request) };
        const response = await this.answer(context);

        response.headers.set(this.header, context.requestId);

        return response;
    }

    /**
     * Whether a header value is a usable correlation id: present, not just whitespace, and not so
     * long it stops being an identifier. A blank id would correlate every request with every other,
     * which is worse than generating one.
     *
     * @param {string | null} value Raw header value
     * @returns {value is string} True when the value can be used as-is (after trimming)
     */
    private isUsableRequestId(value: string | null): value is string {
        const maxRequestIdLength = 200;

        return value !== null && value.trim().length > 0 && value.length <= maxRequestIdLength;
    }

    /**
     * Runs the chain, with a last resort under it.
     *
     * The last resort is **not** the error contract — `ErrorBoundaryMiddleware` is, and it belongs
     * in the array where the app can see it, move it and drop it. This only exists so that
     * a chain assembled without a boundary returns a status instead of tearing down the connection
     * with no answer at all. It sends no body: inventing one here would be a second, invisible
     * contract competing with the one the app chose.
     *
     * @param {HttpRequestInterface} context The request and its correlation id
     * @returns {Promise<Response>} The chain's response, or a bare status
     */
    private async answer(context: HttpRequestInterface): Promise<Response> {
        try {
            return await this.dispatch(context);
        } catch (exception) {
            const { logger } = this.options;

            void detach(logger?.error(exception as Error, { requestId: context.requestId }), logger ?? null);

            return new Response(null, { status: statusOf(exception) ?? httpStatus.INTERNAL_SERVER_ERROR });
        }
    }

    /**
     * The correlation id for this request: the caller's, when it sent a usable one, or a fresh one.
     *
     * @param {Request} request The incoming request
     * @returns {string} The resolved correlation id
     */
    private resolveRequestId(request: Request): string {
        const candidate = request.headers.get(this.header);

        return this.isUsableRequestId(candidate) ? candidate.trim() : crypto.randomUUID();
    }

}
