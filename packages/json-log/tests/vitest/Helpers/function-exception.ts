import { JSONParserUnknownException } from "src";

import type { ExceptionType } from "../../../@types/Exceptions";

export function functionException(): ExceptionType {
    const exception = new JSONParserUnknownException("functionExample");
    const path = process.cwd().includes("\\") ? "\\" : "/";

    return {
        exception,
        data: {
            type: "JSONParserUnknownException", // Exception Name
            message: "functionExample",
            functionName: "functionException",
            fileLine: 6, // Top line number
            fileColumn: 23, // Top column number
            fileException: `${process.cwd()}${path}tests${path}vitest${path}Helpers${path}function-exception.ts`,
        },
    };
}
