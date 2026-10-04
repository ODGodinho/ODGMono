import { ORPCError } from "@orpc/server";
import httpStatus from "http-status";

import type { StatusInterceptorOptionsInterface } from "../../src/interfaces/HttpOptionsInterface.ts";
import { statusInterceptor } from "../../src/status-interceptor.ts";

/**
 * Runs the interceptor over a procedure that throws the given value.
 *
 * @param {unknown} thrown What the procedure throws
 * @param {StatusInterceptorOptionsInterface | undefined} options Options for the interceptor
 * @returns {Promise<unknown>} Whatever came back out, thrown or returned
 */
async function intercept(thrown: unknown, options?: StatusInterceptorOptionsInterface): Promise<unknown> {
    return statusInterceptor(options)({
        next: async (): Promise<unknown> => {
            throw thrown;
        },
    }).catch((error: unknown) => error);
}

describe("statusInterceptor", () => {
    test("uses oRPC's own code for a status, including where HTTP spells it differently", async () => {
        const unprocessable = await intercept(
            Object.assign(new Error("invalid"), { statusCode: httpStatus.UNPROCESSABLE_ENTITY }),
        );
        const notAllowed = await intercept(
            Object.assign(new Error("nope"), { statusCode: httpStatus.METHOD_NOT_ALLOWED }),
        );

        expect(unprocessable).toMatchObject({ code: "UNPROCESSABLE_CONTENT", status: 422 });
        expect(notAllowed).toMatchObject({ code: "METHOD_NOT_SUPPORTED", status: 405 });
    });

    test("a status oRPC does not define reads as an internal error, keeping the status", async () => {
        const teapot = await intercept(Object.assign(new Error("short and stout"), { statusCode: 418 }));

        expect(teapot).toMatchObject({ code: "INTERNAL_SERVER_ERROR", status: 418 });
    });

    test("leaves an ORPCError and a status-less exception alone", async () => {
        const raised = new ORPCError("UNAUTHORIZED");
        const plain = new Error("no status here");

        expect(await intercept(raised)).toBe(raised);
        expect(await intercept(plain)).toBe(plain);
    });

    test("applies the infrastructure rule when the exception declares nothing", async () => {
        const failure = await intercept(new Error("ECONNREFUSED"), {
            infrastructureStatus: (): number => httpStatus.SERVICE_UNAVAILABLE,
        });

        expect(failure).toMatchObject({ code: "SERVICE_UNAVAILABLE", status: 503 });
    });

    test("a thrown value that is not an Error is stringified into the message", async () => {
        const thrown = await intercept({ statusCode: httpStatus.BAD_REQUEST });

        expect(thrown).toMatchObject({ message: "[object Object]", status: httpStatus.BAD_REQUEST });
    });

    test("throw null is rethrown untouched", async () => {
        expect(await intercept(null)).toBeNull();
    });
});
