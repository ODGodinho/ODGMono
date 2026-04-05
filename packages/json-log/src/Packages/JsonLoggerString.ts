import type { LogLevel } from "@odg/log";

import type {
    ExceptionObjectLoggerInterface,
    GitLoggerInterface,
    LoggerRequestStringInterface,
    LoggerStringInterface,
} from "..";

export class JSONLoggerString {

    public type: LogLevel;

    public index: string;

    public instance: string;

    public message: string;

    public createdAt: Date;

    public identifier?: string;

    public git?: GitLoggerInterface;

    public exception?: ExceptionObjectLoggerInterface;

    public exceptionPrevious?: ExceptionObjectLoggerInterface[];

    public declare request?: LoggerRequestStringInterface;

    public constructor(options: LoggerStringInterface) {
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

}
