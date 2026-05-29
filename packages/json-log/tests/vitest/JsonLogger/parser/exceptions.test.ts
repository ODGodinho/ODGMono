import { Exception } from "@odg/exception";

import { JSONLoggerPlugin } from "#app";

import type { ExceptionType } from "../../../../@types/Exceptions";
import exceptionsCascade from "../../Helpers/exceptions-cascade";
import { functionException } from "../../Helpers/function-exception";
import { globalException } from "../../Helpers/global-exception";

const exceptionCases: ExceptionType[] = [
    functionException(),
    globalException,
    ...exceptionsCascade,
];

describe("Test Exception Parser", () => {
    const logger = new JSONLoggerPlugin("");

    test.each(exceptionCases)("Teste Exception match", async (exception) => {
        const exceptionObject = await logger["parseException"](exception.exception);

        delete exceptionObject?.stack;
        expect(exceptionObject).toMatchObject({
            ...exception.data,
        });
    });

    test("Test Exception Without Stack", async () => {
        const exception = new Exception("Teste Exception");

        exception.stack = undefined;

        const exceptionObject = await logger["parseException"](exception);

        expect(exceptionObject).toEqual(
            expect.objectContaining({
                stack: undefined,
            }),
        );

        return true;
    });
});
