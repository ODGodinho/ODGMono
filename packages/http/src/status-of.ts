/**
 * The HTTP status a thrown value declares, if it declares one.
 *
 * Read structurally rather than with `instanceof HttpException`, so an exception from another
 * family that also carries `statusCode` is honoured the same way. Three places ask this question —
 * the serializer, the pipeline's last resort and the oRPC interceptor — and they have to agree.
 *
 * @param {unknown} exception The thrown value, which may be anything at all
 * @returns {number | undefined} The declared status, or `undefined` when there is none
 */
export function statusOf(exception: unknown): number | undefined {
    /*
     * `exception` arrives as whatever was thrown — `throw null` from a dependency included, which
     * would make a bare destructuring blow up inside the error path itself.
     */
    const { statusCode } = (exception ?? {}) as { statusCode?: unknown };

    return typeof statusCode === "number" ? statusCode : undefined;
}
