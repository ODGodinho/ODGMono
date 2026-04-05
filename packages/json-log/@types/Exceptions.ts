import type { ExceptionObjectLoggerInterface, JSONParserUnknownException } from "..";

export type ExceptionType = {
    data: Partial<ExceptionObjectLoggerInterface>;
} & { exception: JSONParserUnknownException };
