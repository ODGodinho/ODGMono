import { detach } from "@odg/chemical-x";

import type { ErrorBoundaryOptionsInterface } from "../interfaces/HttpOptionsInterface.ts";
import type { HttpDispatchType, HttpRequestInterface } from "../interfaces/HttpRequestInterface.ts";
import type { MiddlewareInterface } from "../interfaces/MiddlewareInterface.ts";

/**
 * The error contract: everything thrown below this stage comes back as a structured response, and
 * reaches the logger on the way.
 *
 * It is a middleware rather than something the pipeline does by itself because **where** it sits
 * decides what the rest of the array sees. A stage placed above it — an access log, a metric —
 * receives the error response as the return of its own `await next(...)`; a stage placed below it
 * never sees the throw at all. Baking it in would take that choice away and make every failure
 * invisible to anything the app wrapped around it.
 */
export class ErrorBoundaryMiddleware implements MiddlewareInterface {

    public constructor(
        private readonly options: ErrorBoundaryOptionsInterface,
    ) {
    }

    /**
     * Runs the rest of the pipeline, turning anything it throws into the error contract.
     *
     * @param {HttpRequestInterface} context The request and its correlation id
     * @param {HttpDispatchType} next The rest of the pipeline
     * @returns {Promise<Response>} The stage's response, or the serialized exception
     */
    public async handle(context: HttpRequestInterface, next: HttpDispatchType): Promise<Response> {
        try {
            return await next(context);
        } catch (exception) {
            const { logger, serializer } = this.options;

            /*
             * Detached: the response must not wait on the log transport, and a log transport that
             * is itself down must not turn a handled 422 into a crash.
             */
            void detach(logger.error(exception as Error, { requestId: context.requestId }), logger);

            return serializer.toResponse(exception);
        }
    }

}
