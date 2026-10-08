import type { ErrorBoundaryOptionsInterface } from "../interfaces/HttpOptionsInterface.ts";
import type { HttpDispatchType, HttpRequestInterface } from "../interfaces/HttpRequestInterface.ts";
import type { MiddlewareInterface } from "../interfaces/MiddlewareInterface.ts";
import { reportException } from "../report-exception.ts";

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
            const response = this.options.serializer.toResponse(exception);

            reportException(this.options.logger, exception, response, context.requestId);

            return response;
        }
    }

}
