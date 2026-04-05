import { JSONParserUnknownException } from "src";

import type { ExceptionType } from "../../../@types/Exceptions";

export const globalException: ExceptionType = {
    exception: new JSONParserUnknownException("anything"),
    data: {
        type: "JSONParserUnknownException", // Exception Name
        message: "anything",
        functionName: undefined,
        fileLine: 6, // Top line number
        fileColumn: 16, // Top column number
    },
};
