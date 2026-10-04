import type { HttpDispatchType, HttpRequestInterface } from "./HttpRequestInterface.ts";

/**
 * One stage of the pipeline, and the only extension point the package has: every feature it ships
 * is one of these, and so is anything the app writes.
 *
 * The order of the array handed to `HttpPipeline` **is** the nesting — an earlier entry wraps every
 * later one. Whatever a stage runs after `await next(context)` therefore sees the response every
 * stage below it produced, the error contract included; whatever it runs before sees the request on
 * the way down. There is no second interface for the response phase: it is the same method.
 */
export interface MiddlewareInterface {

    /**
     * Answers the request, or hands it down the pipeline.
     *
     * @param {HttpRequestInterface} context The request and its correlation id
     * @param {HttpDispatchType} next The rest of the pipeline
     * @returns {Promise<Response>} The response this stage returns
     */
    handle(context: HttpRequestInterface, next: HttpDispatchType): Promise<Response>;
}
