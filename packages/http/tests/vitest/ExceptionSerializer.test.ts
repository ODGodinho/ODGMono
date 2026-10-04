import ErrorStackParser from "error-stack-parser";
import httpStatus from "http-status";

import { NotFoundException } from "../../src/exceptions/NotFoundException.ts";
import { ExceptionSerializer } from "../../src/ExceptionSerializer.ts";

/**
 * A partial frame, standing in for what the parser resolved; the real class is not worth building.
 *
 * @param {object} fields The fields the parser "resolved"
 * @returns {ErrorStackParser.StackFrame} The fields typed as a frame
 */
function frame(fields: object): ErrorStackParser.StackFrame {
    return fields as ErrorStackParser.StackFrame;
}

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

    describe("verbose origin frame", () => {
        afterEach(() => {
            vi.restoreAllMocks();
        });

        test("copies every field the parser resolved", () => {
            vi.spyOn(ErrorStackParser, "parse").mockReturnValue([
                frame({
                    functionName: "fn",
                    fileName: "a.ts",
                    lineNumber: 1,
                    columnNumber: 2,
                }),
            ]);

            expect(new ExceptionSerializer(true).toBody(new Error("x"))).toMatchObject({
                functionName: "fn",
                fileException: "a.ts",
                fileLine: 1,
                fileColumn: 2,
            });
        });

        test("omits fields the parser could not resolve", () => {
            vi.spyOn(ErrorStackParser, "parse").mockReturnValue([ frame({}) ]);

            expect(new ExceptionSerializer(true).toBody(new Error("x"))).not.toHaveProperty("fileLine");
        });

        test("an error with no frames adds nothing", () => {
            vi.spyOn(ErrorStackParser, "parse").mockReturnValue([]);

            expect(new ExceptionSerializer(true).toBody(new Error("x"))).not.toHaveProperty("fileException");
        });

        test("an error without a stack still serializes", () => {
            const error = new Error("x");

            error.stack = undefined;

            expect(new ExceptionSerializer(true).toBody(error)).toStrictEqual({ message: "x", type: "Error" });
        });
    });
});
