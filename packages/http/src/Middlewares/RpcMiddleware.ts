import type { AnyContractRouter } from "@orpc/contract";
import type { Context as OrpcContext, Router } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

import type { HttpPathType, OrpcTransportOptionsInterface } from "../interfaces/HttpOptionsInterface.ts";
import type { HttpDispatchType, HttpRequestInterface } from "../interfaces/HttpRequestInterface.ts";
import type { MiddlewareInterface } from "../interfaces/MiddlewareInterface.ts";
import { statusInterceptor } from "../status-interceptor.ts";

/**
 * The native oRPC protocol, for the typed client.
 *
 * Its error frame is oRPC's own, deliberately: that frame is what the client reconstructs into an
 * `ORPCError`. The structured contract belongs to the REST surface, where the consumer is somebody
 * else's HTTP client.
 */
export class RpcMiddleware<ContextType extends OrpcContext> implements MiddlewareInterface {

    private readonly handler: RPCHandler<ContextType>;

    private readonly prefix: HttpPathType;

    public constructor(
        router: Router<AnyContractRouter, ContextType>,
        private readonly options: OrpcTransportOptionsInterface<ContextType>,
    ) {
        const defaultPrefix = "/rpc";

        this.prefix = options.prefix ?? defaultPrefix;

        /*
         * Copied, never the caller's array: `RPCHandler`'s constructor mutates whatever array it is
         * handed (verified — sharing one turns a second handler's copy into something that throws),
         * so a template passing one `interceptors` array to both transports would break the second.
         */
        this.handler = new RPCHandler<ContextType>(router, {
            clientInterceptors: [ ...options.interceptors ?? [ statusInterceptor() ] ],
        });
    }

    /**
     * Answers the request when it is under this prefix and names a procedure, and hands it down
     * otherwise — an unmatched path is the pipeline's 404, not this transport's.
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
