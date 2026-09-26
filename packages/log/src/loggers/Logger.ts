import { Exception } from "@odg/exception";

import type { LogLevel } from "../Enums/LogLevel.ts";
import type {
    ContextType,
    LoggerInterface,
    LoggerOptionsInterface,
    LoggerParserInterface,
    LoggerPluginInterface,
    LoggerScopeStorageInterface,
} from "../Interfaces/index.ts";

import { AbstractLogger } from "./AbstractLogger.ts";

export class Logger extends AbstractLogger {

    /*
     * Native private fields: a subclass may declare its own `context` or `scopes` without either side
     * breaking — a TypeScript `private` of the same name would stop the subclass from compiling.
     */

    /** What `withContext` added outside any scope: the whole logger's. */
    #context?: ContextType;

    readonly #scopes?: LoggerScopeStorageInterface;

    private readonly handlers: LoggerInterface[] = [];

    private readonly processors: LoggerPluginInterface[] = [];

    public constructor(options: LoggerOptionsInterface = {}) {
        super();
        this.#scopes = options.scopes;
    }

    /**
     * The call's context over the one `withContext` added. Untouched when nothing was added, so a
     * handler still receives exactly what the call passed.
     *
     * @param {ContextType | undefined} context Context of this call
     * @returns {ContextType | undefined}
     */
    #mergeContext(context?: ContextType): ContextType | undefined {
        const scoped = this.#scopes?.getStore();
        const hasScoped = scoped !== undefined && Object.keys(scoped).length > 0;
        const hasShared = hasScoped || this.#context !== undefined;

        return hasShared ? { ...this.#context, ...scoped, ...context } : context;
    }

    /**
     * Add new handler logger
     *
     * @param {LoggerInterface} logger Logger Handler to push
     * @returns {void}
     */
    public pushHandler(logger: LoggerInterface): void {
        this.handlers.push(logger);
    }

    /**
     * Add new handler logger
     *
     * @returns {LoggerInterface[]}
     */
    public getHandlers(): LoggerInterface[] {
        return [ ...this.handlers ];
    }

    /**
     * Add new Processors Logger for all handlers
     *
     * @param {LoggerPluginInterface} processor Logger Handler
     * @returns {void}
     */
    public pushProcessor(processor: LoggerPluginInterface): void {
        this.processors.push(processor);
    }

    /**
     * Get All logger Processors
     *
     * @returns {LoggerPluginInterface[]}
     */
    public getProcessor(): LoggerPluginInterface[] {
        return [ ...this.processors ];
    }

    /**
     * Runs `callback` as one unit of work — a request, a job. What `withContext` adds inside it, and
     * inside everything it awaits, reaches only this unit's logs and is gone when it ends; nothing to
     * clean up. A scope opened inside another starts with the outer one's context, and what it adds
     * does not go back out.
     *
     * Needs `scopes` in the constructor (`new AsyncLocalStorage()` on the server). Without it this
     * throws instead of running unscoped, where one request's context would silently reach the next.
     *
     * @param {() => T} callback The unit of work
     * @throws {Exception} When the logger was built without `scopes`
     * @returns {T} Whatever the callback returns
     */
    public scope<T>(callback: () => T): T {
        if (!this.#scopes) {
            throw new Exception("Logger.scope needs scopes: new Logger({ scopes: new AsyncLocalStorage() })");
        }

        return this.#scopes.run({ ...this.#scopes.getStore() }, callback);
    }

    /**
     * Adds `context` to every later log call, like Laravel's `Log::withContext`: set it once and each
     * call carries it in its third parameter, to the processors and handlers.
     *
     * Inside a `scope` — the request or job being served — it belongs to that scope only. Outside any
     * — at boot, in a browser, in a robot built without `scopes` — it belongs to the whole logger.
     * Calling again merges, and a key passed by the log call itself wins.
     *
     * @param {ContextType} context Fields every later log carries
     * @returns {void}
     */
    public withContext(context: ContextType): void {
        const scoped = this.#scopes?.getStore();

        if (scoped) {
            Object.assign(scoped, context);

            return;
        }

        this.#context = { ...this.#context, ...context };
    }

    /**
     * The context `withContext` gives the next log call made here: the whole logger's, then the
     * current scope's
     *
     * @returns {ContextType}
     */
    public getContext(): ContextType {
        return { ...this.#context, ...this.#scopes?.getStore() };
    }

    public async log(level: LogLevel, message: unknown, context?: ContextType): Promise<void> {
        const processor = await this.getProcessorData(level, message, this.#mergeContext(context));

        await Promise.all(
            this.handlers.map(async (handler: LoggerInterface) => handler.log(
                processor.level,
                processor.message,
                processor.context,
            )),
        );
    }

    /**
     * Parser Plugin Logger
     *
     * @param {LogLevel} level Logger level of this message
     * @param {unknown} message Message Logger with all data
     * @param {ContextType | undefined} context Context extra data for log
     * @returns {Promise<LoggerParserInterface>}
     */
    private async getProcessorData(
        level: LogLevel,
        message: unknown,
        context?: ContextType,
    ): Promise<LoggerParserInterface> {
        const original = {
            level,
            message,
            context,
        };
        let newParser: LoggerParserInterface = {
            original,
            level,
            message,
            context,
        };

        for (const processor of this.processors) {
            newParser = {
                ...await processor.parser(newParser),
                original,
            };
        }

        return newParser;
    }

}
