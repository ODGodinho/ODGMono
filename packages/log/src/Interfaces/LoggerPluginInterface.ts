import type { LogLevel } from "../Enums/LogLevel";

import type { ContextType } from "./LoggerInterface";

/**
 * Logger Plugin return parser
 *
 * @interface LoggerParserInterface
 */
export interface LoggerParserInterface {
    readonly original: Omit<LoggerParserInterface, "original">;
    level: LogLevel;
    message: unknown;
    context?: ContextType;
}

export interface LoggerPluginInterface {

    /**
     * Parser Logger on called
     *
     * @param {LoggerParserInterface} data Received LogLevel
     * @returns {Promise<Omit<LoggerParserInterface, "original">>}
     */
    parser(data: LoggerParserInterface): Promise<Omit<LoggerParserInterface, "original">>;
}
