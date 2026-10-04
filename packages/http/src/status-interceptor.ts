import { COMMON_ORPC_ERROR_DEFS } from "@orpc/client";
import { ORPCError } from "@orpc/server";

import type {
    OrpcClientInterceptorType,
    OrpcClientNextOptionsInterface,
    OrpcErrorCodeType,
    StatusInterceptorOptionsInterface,
} from "./interfaces/HttpOptionsInterface.ts";
import { statusOf } from "./status-of.ts";

/**
 * Status → the oRPC code that carries it, read off oRPC's own table rather than written out here.
 *
 * The code is oRPC's vocabulary, not HTTP's, and the two disagree on five statuses — 422 is
 * `UNPROCESSABLE_CONTENT` here and `UNPROCESSABLE_ENTITY` in every HTTP reason-phrase table. A
 * hand-written map would be a third spelling to keep in sync, and would cover only the statuses
 * somebody remembered; this covers every status oRPC defines, and a status it does not define is a
 * 500, which is what "not mapped" means.
 */
const codeByStatus: ReadonlyMap<number, OrpcErrorCodeType> = new Map(
    Object.entries(COMMON_ORPC_ERROR_DEFS).map(
        ([ code, definition ]): [ number, OrpcErrorCodeType ] => [ definition.status, code ],
    ),
);

/**
 * Gives a domain exception thrown inside a procedure the status it already declared.
 *
 * An oRPC transport wraps anything that is not an `ORPCError` as 500 **before** the error contract
 * ever sees the object, so `HttpException.statusCode` would never reach the wire on its own.
 * Without this, every procedure that can fail repeats the same `catch`/`throw new ORPCError(...)`
 * translation, and a 422 arrives as a 500 — which is a defect, not a design choice, and is why the
 * oRPC middlewares install it by default.
 *
 * It is a `clientInterceptors` entry: that hook wraps the handler itself, before either transport
 * converts a throw into its own error frame, so one function covers `/rpc` and `/api` identically.
 *
 * @param {StatusInterceptorOptionsInterface} options The infrastructure-failure rule, if any
 * @returns {OrpcClientInterceptorType} An interceptor translating a status-carrying exception
 */
export function statusInterceptor(
    options: StatusInterceptorOptionsInterface = {},
): OrpcClientInterceptorType {
    return async (callOptions: OrpcClientNextOptionsInterface): Promise<unknown> => {
        try {
            return await callOptions.next();
        } catch (exception) {
            if (exception instanceof ORPCError) {
                throw exception;
            }

            const status = statusOf(exception) ?? options.infrastructureStatus?.(exception);

            if (status === undefined) {
                throw exception;
            }

            throw new ORPCError(codeByStatus.get(status) ?? "INTERNAL_SERVER_ERROR", {
                cause: exception,
                message: exception instanceof Error ? exception.message : String(exception),
                status,
            });
        }
    };
}
