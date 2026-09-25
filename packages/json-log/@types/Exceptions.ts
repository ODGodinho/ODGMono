import type { ExceptionObjectLoggerInterface, JSONParserUnknownException } from "../src/index.ts";

export type ExceptionType = {
    data: Partial<ExceptionObjectLoggerInterface>;
} & { exception: JSONParserUnknownException };
