import type { LogLevel } from "@odg/log";

import type {
    ExceptionObjectLoggerInterface,
    GitLoggerInterface,
    LoggerObjectInterface,
    LoggerObjectRequestInterface,
} from "..";

/**
 * {@link JSONLogger} as a plain object; {@link LoggerObjectInterface.createdAt} is an ISO-8601 string.
 */
export type JSONLoggerJson = Omit<LoggerObjectInterface, "createdAt"> & {
    createdAt: string;
};

export class JSONLogger implements LoggerObjectInterface {

    public type: LogLevel;

    public index: string;

    public instance: string;

    public message: string;

    public createdAt: Date;

    public identifier?: string;

    public git?: GitLoggerInterface;

    public exception?: ExceptionObjectLoggerInterface;

    public exceptionPrevious?: ExceptionObjectLoggerInterface[];

    public request?: LoggerObjectRequestInterface;

    public constructor(options: LoggerObjectInterface) {
        this.type = options.type;
        this.index = options.index;
        this.instance = options.instance;
        this.message = options.message;
        this.createdAt = options.createdAt;
        this.identifier = options.identifier;
        this.git = options.git;
        this.exception = options.exception;
        this.exceptionPrevious = options.exceptionPrevious;
        this.request = options.request;
    }

    public toJson(): LoggerObjectInterface {
        return {
            type: this.type,
            index: this.index,
            instance: this.instance,
            message: this.message,
            createdAt: this.createdAt,
            identifier: this.identifier,
            git: this.git,
            exception: this.exception,
            exceptionPrevious: this.exceptionPrevious,
            request: this.request,
        };
    }

}
