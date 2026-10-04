import type { AnyContractRouter } from "@orpc/contract";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import type { Context as OrpcContext, Router } from "@orpc/server";

import type { HttpPathType, OpenApiOptionsInterface } from "../interfaces/HttpOptionsInterface.ts";
import type { HttpDispatchType, HttpRequestInterface } from "../interfaces/HttpRequestInterface.ts";
import type { MiddlewareInterface } from "../interfaces/MiddlewareInterface.ts";
import { statusInterceptor } from "../status-interceptor.ts";

/**
 * The REST surface, for consumers that are not the typed client.
 *
 * It is public, so a procedure's failure follows the same structured contract as a failure raised
 * anywhere else — which is why it takes the **same** `ExceptionSerializer` instance the boundary
 * holds rather than building one of its own from a flag nobody would remember to keep in sync.
 */
export class OpenApiMiddleware<ContextType extends OrpcContext> implements MiddlewareInterface {

    private readonly handler: OpenAPIHandler<ContextType>;

    private readonly prefix: HttpPathType;

    public constructor(
        router: Router<AnyContractRouter, ContextType>,
        private readonly options: OpenApiOptionsInterface<ContextType>,
    ) {
        const defaultPrefix = "/api";

        this.prefix = options.prefix ?? defaultPrefix;

        /* Copied for the same reason as in `RpcMiddleware`: the handler mutates the array it gets. */
        this.handler = new OpenAPIHandler<ContextType>(router, {
            clientInterceptors: [ ...options.interceptors ?? [ statusInterceptor() ] ],
            customErrorResponseBodyEncoder: (error): unknown => options.serializer.toBody(error),
        });
    }

    /**
     * Answers the request when it is under this prefix and names a procedure, and hands it down
     * otherwise — so a path this transport does not know still reaches whatever the app
     * mounted after it.
     *
     * @param {HttpRequestInterface} context The request and its correlation id
     * @param {HttpDispatchType} next The rest of the pipeline
     * @returns {Promise<Response>} The transport's response, or the rest of the pipeline's
     */
    public async handle(context: HttpRequestInterface, next: HttpDispatchType): Promise<Response> {
        const { pathname } = new URL(context.request.url);

        if (!pathname.startsWith(`${this.prefix}/`)) {
            return next(context);
        }

        const { matched: isMatched, response } = await this.handler.handle(context.request, {
            context: this.options.context(context),
            prefix: this.prefix,
        });

        return isMatched ? response : next(context);
    }

}
