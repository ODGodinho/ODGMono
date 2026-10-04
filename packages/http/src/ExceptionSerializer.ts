import type { ExceptionObjectLoggerInterface } from "@odg/json-log";
import ErrorStackParser from "error-stack-parser";
import httpStatus from "http-status";

import { statusOf } from "./status-of.ts";

/**
 * Turns anything thrown into the single error contract of the REST surface.
 *
 * A successful response is the procedure's own payload, unwrapped — the HTTP status code already
 * carries the outcome (200/201/404/422/...), so a `success: true` flag would only duplicate it. A
 * failed response is always the structured exception this class builds.
 *
 * The native oRPC surface is not covered: its own error frame is what the typed client parses
 * back into an `ORPCError`.
 *
 * Verbosity is constructor state rather than a parameter on every call: it is decided once per
 * server, from the environment, and never varies per request.
 */
export class ExceptionSerializer {

    /**
     * Builds a serializer for one server's verbosity setting.
     *
     * @param {boolean} isVerbose Whether bodies may include stack and source location. Source
     * paths, line numbers and stack frames describe the server's internals, so outside development
     * a response carries only `type` and `message`; the full exception still reaches the logger,
     * correlated by the correlation header.
     */
    public constructor(
        private readonly isVerbose: boolean,
    ) {
    }

    /**
     * Serializes a thrown value into the same exception shape `@odg/json-log` writes to the log
     * stream, so an error seen by an API consumer and the same error in Graylog/Kibana share one
     * vocabulary (`type`, `message`, `fileException`, `functionName`, `stack`, ...).
     *
     * @param {unknown} error The thrown value
     * @returns {ExceptionObjectLoggerInterface} The structured exception body
     */
    public toBody(error: unknown): ExceptionObjectLoggerInterface {
        if (!(error instanceof Error)) {
            return { message: String(error), type: "UnknownException" };
        }

        const body: ExceptionObjectLoggerInterface = { message: error.message, type: this.toType(error) };

        if (!this.isVerbose) {
            return body;
        }

        return {
            ...body,
            ...this.parseOriginFrame(error),
            ...error.stack === undefined ? {} : { stack: error.stack },
        };
    }

    /**
     * Wraps the body in the response the pipeline returns for anything thrown outside a
     * procedure handler.
     *
     * @param {unknown} error The thrown value
     * @returns {Response} The structured error response
     */
    public toResponse(error: unknown): Response {
        return Response.json(this.toBody(error), { status: this.toStatusCode(error) });
    }

    /**
     * Names the exception for the consumer.
     *
     * An `ORPCError` is a plain `Error` subclass — its `name` is the useless `"Error"`, and the
     * semantic identity (`UNAUTHORIZED`, `NOT_FOUND`, `BAD_REQUEST`) lives in `code`. Without
     * this, every procedure failure on the REST surface reaches the client as `{"type":"Error"}`
     * and only the HTTP status tells them apart.
     *
     * @param {Error} error The thrown error
     * @returns {string} The oRPC code when there is one, the constructor name otherwise
     */
    private toType(error: Error): string {
        const { code } = error as { code?: unknown };

        return typeof code === "string" ? code : error.name;
    }

    /**
     * The status of the response an exception produces. `HttpException` and the rest of the
     * `@odg/exception` family declare it as `statusCode`; anything else is a 500.
     *
     * @param {unknown} error The thrown value
     * @returns {number} Status code for the response
     */
    private toStatusCode(error: unknown): number {
        return statusOf(error) ?? httpStatus.INTERNAL_SERVER_ERROR;
    }

    /**
     * Pulls the originating frame out of an Error. `error-stack-parser` is already an indirect
     * dependency through `@odg/json-log`, so the same parser produces the log entry and this body.
     *
     * @param {Error} error The thrown error
     * @returns {Partial<ExceptionObjectLoggerInterface>} Source location fields, when resolvable
     */
    private parseOriginFrame(error: Error): Partial<ExceptionObjectLoggerInterface> {
        try {
            const frame = ErrorStackParser.parse(error).at(0);

            if (!frame) {
                return {};
            }

            const {
                functionName,
                fileName,
                lineNumber,
                columnNumber,
            } = frame;

            return {
                ...functionName === undefined ? {} : { functionName },
                ...fileName === undefined ? {} : { fileException: fileName },
                ...lineNumber === undefined ? {} : { fileLine: lineNumber },
                ...columnNumber === undefined ? {} : { fileColumn: columnNumber },
            };
        } catch {
            // The parser throws when `stack` is missing or unparseable
            return {};
        }
    }

}
