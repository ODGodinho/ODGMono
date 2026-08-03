import type { LogLevel } from "@odg/log";
import type { RequestInterface, ResponseInterface } from "@odg/message";

export interface ExceptionObjectLoggerInterface {
    "type": string;
    "message": string;
    "fileException"?: string;
    "functionName"?: string;
    "fileLine"?: number;
    "fileColumn"?: number;
    "stack"?: string;
}

export type LoggerObjectRequestInterface = RequestInterface<unknown> & {
    response?: ResponseInterface<unknown>;
};

export interface GitLoggerInterface {
    release?: string;
    branch?: string;
}

/**
 * Logger object structure. If you need to search logs, use this pattern.
 */
export interface LoggerObjectInterface {
    /** Log level with PSR-3 standard */
    type: LogLevel;

    /** Index is project id */
    index: string;

    /** Used by instance AWS/Docker/Hostname */
    instance: string;

    /** Message log (Request.url | Exception.message) */
    message: string;

    /**
     * Id identify this exception
     * all logs one request has one identifier
     * Retry process has same identifier
     */
    identifier?: string;

    /** Git Information */
    git?: GitLoggerInterface;

    /** If the Logger is handling an exception */
    exception?: ExceptionObjectLoggerInterface;

    /** If the Logger has handled an exception and has previous exceptions */
    exceptionPrevious?: ExceptionObjectLoggerInterface[];

    /** If the logger is from a requester */
    request?: LoggerObjectRequestInterface;

    /** Date of the log */
    createdAt: Date;
}

export interface LoggerStringInterface extends Omit<LoggerObjectInterface, "request"> {
    request?: LoggerRequestStringInterface;
}

export type LoggerRequestStringInterfaceOmit = "data" | "headers" | "params" | "proxy" | "response";

/**
 * Logger Request Object structure with all request fields as string prevent create
 * Multiples fields for request headers, data, params, proxy and response
 */
export interface LoggerRequestStringInterface extends Omit<
    LoggerObjectRequestInterface,
    LoggerRequestStringInterfaceOmit
> {
    headers: string;
    data: string;
    params: string;
    proxy: string;
    response?: {
        data: string;
        status: number;
        headers: string;
    };
}
