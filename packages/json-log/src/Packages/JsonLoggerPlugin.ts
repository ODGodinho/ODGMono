import { Exception } from "@odg/exception";
import {
    formatUnknown,
    type LoggerParserInterface,
    type LoggerPluginInterface,
    type LogLevel,
} from "@odg/log";
import {
    ODGMessage,
    type RequestInterface,
    type ResponseInterface,
} from "@odg/message";
import ErrorStackParser from "error-stack-parser";

import { JSONParserUnknownException } from "../Exceptions/JsonParserUnknownException";
import type {
    ExceptionObjectLoggerInterface,
    LoggerObjectRequestInterface,
} from "../Interfaces";

import { JSONLogger } from "./JsonLogger";

export class JSONLoggerPlugin implements LoggerPluginInterface {

    /**
     * Identifier for the current log
     *
     * @type {string}
     */
    protected identifier?: string;

    public constructor(
        protected readonly appName: string,
        protected readonly maxExceptionPrevious: number = 10,
        protected instanceId?: string,
    ) {

    }

    /**
     * Plugin parser Function return new message with JSON format
     *
     * @param {LoggerParserInterface} data Received Data params
     * @returns {Promise<LoggerParserInterface>}
     */
    public async parser(data: LoggerParserInterface): Promise<LoggerParserInterface> {
        try {
            return {
                ...data,
                message: await this.logJSON(data.level, data.message),
            };
        } catch (error) {
            throw new JSONParserUnknownException("JSON Plugin Parser exception", error);
        }
    }

    public async logJSON(level: LogLevel, message: unknown): Promise<JSONLogger> {
        const [ newMessage, exception, previousException, request ] = await Promise.all([
            this.getMessage(message),
            this.parseException(message),
            this.parseExceptionPrevious(message),
            this.parseRequest(message),
        ]);

        return new JSONLogger({
            type: level,
            index: this.appName,
            instance: this.getInstance(),
            message: newMessage,
            createdAt: new Date(),
            identifier: this.identifier,
            exception,
            exceptionPrevious: previousException,
            request,
        });
    }

    /**
     * Define a unique identifier for the current request, for
     * Example: Request ID, Transaction ID, Crawler Process, etc
     *
     * @param {string} identifier Unique identifier
     */
    public setIdentifier(identifier: string): void {
        this.identifier = identifier;
    }

    /**
     * Get unique identifier for the current process
     * Example: Request ID, Transaction ID, Crawler Process, etc
     *
     * @returns {string | undefined}
     */
    public getIdentifier(): string | undefined {
        return this.identifier;
    }

    /**
     * Define device instance name
     *
     * @param {string} instance name of instance
     */
    public setInstance(instance: string): void {
        this.instanceId = instance;
    }

    /**
     * Return instance HostName, identifier
     *
     * @returns {string}
     */
    protected getInstance(): string {
        const instanceProperty = this.instanceId ?? "";

        if (instanceProperty) return instanceProperty;

        if (this.isNode()) {
            /* eslint-disable n/no-process-env -- Package need read from env file */
            return process.env.HOSTNAME!
                || process.env.CONTAINER_ID!
                || process.env.DOCKER_CONTAINER_UUID!;
            /* eslint-enable n/no-process-env -- Enable process.env validate */
        }

        return "unknown";
    }

    /**
     * If Message is a Exception, parse to ExceptionObjectLoggerInterface
     *
     * @param {unknown} exception Possible Exception
     * @returns {Promise<ExceptionObjectLoggerInterface | undefined>}
     */
    protected async parseException(exception: unknown): Promise<ExceptionObjectLoggerInterface | undefined> {
        if (!(exception instanceof Error)) return;

        const trace = exception.stack ? ErrorStackParser.parse(exception) : undefined;

        return {
            "type": exception.name,
            "message": exception.message,
            "fileException": trace?.[0]?.getFileName(),
            "functionName": trace?.[0]?.getFunctionName(),
            "fileLine": trace?.[0]?.getLineNumber(),
            "fileColumn": trace?.[0]?.getColumnNumber(),
            "stack": exception.stack,
        };
    }

    /**
     * If Message is a Exception, get All Exception Previous and parse to ExceptionObjectLoggerInterface
     *
     * @param {unknown} exception Possible Exception
     * @returns {Promise<ExceptionObjectLoggerInterface[] | undefined>}
     */
    protected async parseExceptionPrevious(exception: unknown): Promise<ExceptionObjectLoggerInterface[] | undefined> {
        if (!(exception instanceof Exception)) return;

        const exceptionCollection: ExceptionObjectLoggerInterface[] = [];
        let exceptionBase = exception.getPrevious();
        let exceptionCount = 0;

        do {
            const parsedException = await this.parseException(exceptionBase);

            if (parsedException) exceptionCollection.push(parsedException);

            exceptionBase = exceptionBase?.getPrevious();
        } while (exceptionBase && ++exceptionCount < this.maxExceptionPrevious);

        return exceptionCollection;
    }

    /**
     * Parser Request and Response
     *
     * @memberof JSONLoggerPlugin
     * @protected
     * @param {unknown} message Possible Message/Request
     * @returns {Promise<LoggerObjectRequestInterface | undefined>}
     */
    protected async parseRequest(message: unknown): Promise<LoggerObjectRequestInterface | undefined> {
        if (!await this.isRequestOrResponseMessage(message)) return;

        const request = Object.fromEntries(
            Object.entries(await this.getRequestMessage(message) ?? {})
                .filter(([ key ]) => !key.startsWith("$")),
        );
        const response = await this.getResponseMessage(message);

        return {
            ...request,
            response,
        };
    }

    /**
     * Get Response Message data
     *
     * @memberof JSONLoggerPlugin
     * @protected
     * @param {unknown} message Possible Request/Message
     * @returns {Promise<ResponseInterface<unknown> | undefined>}
     */
    protected async getResponseMessage(message: unknown): Promise<ResponseInterface<unknown> | undefined> {
        if (ODGMessage.isMessage(message)) return message.response;

        return undefined;
    }

    /**
     * Get Request Message data
     *
     * @memberof JSONLoggerPlugin
     * @protected
     * @param {unknown} message Possible Request/Message
     * @returns {Promise<RequestInterface<unknown> | undefined>}
     */
    protected async getRequestMessage(message: unknown): Promise<RequestInterface<unknown> | undefined> {
        if (ODGMessage.isMessage(message)) return message.request;
        if (this.isRequestMessage(message)) return message;

        return undefined;
    }

    /**
     * Check Is Message Response or Request or Exception Message
     *
     * @memberof JSONLoggerPlugin
     * @protected
     * @param {unknown} message Possible Message/Request
     * @returns {Promise<boolean>}
     */
    protected async isRequestOrResponseMessage(message: unknown): Promise<boolean> {
        return ODGMessage.isMessage(message)
            || this.isRequestMessage(message);
    }

    protected isRequestMessage(message: unknown): message is RequestInterface<unknown> {
        return Object.prototype.hasOwnProperty.call(message, "url")
            && Object.prototype.hasOwnProperty.call(message, "method");
    }

    private async getMessage(message: unknown): Promise<string> {
        if (ODGMessage.isMessage(message)) {
            return this.getRequestUrl(message.request);
        }

        if (this.isRequestMessage(message)) {
            return this.getRequestUrl(message);
        }

        if (message instanceof Error) return message.message;

        try {
            if (typeof message === "string") return message;

            return JSON.stringify(message) || formatUnknown(message);
        } catch {
            return formatUnknown(message);
        }
    }

    private async getRequestUrl(request?: RequestInterface<unknown>): Promise<string> {
        return `${request?.baseURL ?? ""}${request?.url ?? ""}`;
    }

    private isNode(): boolean {
        return typeof process !== "undefined"
            && typeof (process as { versions?: { node?: string } }).versions?.node === "string";
    }

}
