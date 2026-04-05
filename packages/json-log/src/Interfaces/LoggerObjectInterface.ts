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

export interface LoggerObjectInterface {
    type: LogLevel;
    index: string;
    instance: string;
    message: string;
    identifier?: string;
    git?: GitLoggerInterface;
    exception?: ExceptionObjectLoggerInterface;
    exceptionPrevious?: ExceptionObjectLoggerInterface[];
    request?: LoggerObjectRequestInterface;
    createdAt: Date;
}

export interface LoggerStringInterface extends Omit<LoggerObjectInterface, "request"> {
    request?: LoggerRequestStringInterface;
}

export type LoggerRequestStringInterfaceOmit = "data" | "headers" | "params" | "proxy" | "response";

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
