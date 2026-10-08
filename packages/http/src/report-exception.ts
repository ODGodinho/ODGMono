import { detach } from "@odg/chemical-x";
import type { LoggerInterface } from "@odg/log";
import httpStatus from "http-status";

/**
 * Records a failure at the level the response status deserves.
 *
 * A 4xx is logged as `notice` with the message, `exception.type` and the status, because
 * `@odg/json-log` attaches `stack` whenever the argument is an `Error`. A 5xx keeps the exception.
 * The status is the one on `response`, the same value about to be sent.
 *
 * @param {LoggerInterface | undefined} logger Where the line goes; absent means nothing is recorded
 * @param {unknown} exception The thrown value
 * @param {Response} response The response about to be sent; its status picks the level
 * @param {string} requestId Correlation id for the line
 */
export function reportException(
    logger: LoggerInterface | undefined,
    exception: unknown,
    response: Response,
    requestId: string,
): void {
    if (logger === undefined) return;

    const { status } = response;

    if (status >= httpStatus.BAD_REQUEST && status < httpStatus.INTERNAL_SERVER_ERROR) {
        const { message, name } = exception as { message?: unknown; name?: unknown };

        void detach(logger.notice(typeof message === "string" ? message : "Client error", {
            exception: { type: name },
            requestId,
            status,
        }), logger);

        return;
    }

    void detach(logger.error(exception as Error, { requestId }), logger);
}
