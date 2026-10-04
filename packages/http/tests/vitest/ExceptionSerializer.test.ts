import httpStatus from "http-status";

import { NotFoundException } from "../../src/exceptions/NotFoundException.ts";
import { ExceptionSerializer } from "../../src/ExceptionSerializer.ts";

describe("ExceptionSerializer", () => {
    test("reads the status a domain exception declares, and defaults to 500", () => {
        const serializer = new ExceptionSerializer(false);
        const known = serializer.toResponse(new NotFoundException("gone"));
        const plain = serializer.toResponse(new Error("boom"));

        expect(known.status).toBe(httpStatus.NOT_FOUND);
        expect(plain.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    });

    test("hides the server's internals unless verbose", () => {
        const quiet = new ExceptionSerializer(false).toBody(new Error("boom"));
        const verbose = new ExceptionSerializer(true).toBody(new Error("boom"));

        expect(quiet).toStrictEqual({ message: "boom", type: "Error" });
        expect(verbose).toMatchObject({ message: "boom", stack: expect.any(String) as string });
    });

    test("survives a thrown value that is not an Error", () => {
        expect(new ExceptionSerializer(false).toBody("plain string")).toStrictEqual({
            message: "plain string",
            type: "UnknownException",
        });
    });
});
