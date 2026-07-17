/**
 * Partial Logger interface only for debug of detached promises.
 */
interface LoggerInterface {
    error(error: unknown): unknown;
}

/**
 * Fire-and-forget a promise from a synchronous context (an event listener, a constructor,
 * any `() => void` callback) without ever risking an unhandledRejection.
 *
 * A sync listener cannot `await`, and the usual workarounds are wrong: `void promise` only
 * silences the linter — a rejection still crashes the main thread; `promise.catch(() => null)`
 * swallows the failure with no trace. `detach` routes any rejection to `log.error`, and if the
 * logger itself fails (e.g. its transport is down) it falls back to `console.error`, the one
 * sink that cannot itself reject.
 *
 * @example
 * process.on("session-refreshed", () => {
 *     detach(this.reloadProfile(), this.logger);
 * });
 *
 * @param {Promise<unknown>} promise Operation to run and forget
 * @param {LoggerInterface} log Logger used to record a rejection
 * @returns {void}
 */
export function detach(promise: Promise<unknown>, log: LoggerInterface): void {
    promise.catch(async (error: unknown) => {
        try {
            await log.error(error);
        } catch (exception: unknown) {
            // eslint-disable-next-line no-console -- último recurso: o log falhou ao registrar o erro
            console.error(exception, error);
        }
    });
}
