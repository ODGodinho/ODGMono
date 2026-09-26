import { AsyncLocalStorage } from "node:async_hooks";
import { setTimeout as sleep } from "node:timers/promises";

import { vi } from "vitest";

import { ConsoleLogger, type LoggerParserInterface, LogLevel } from "#app";
import { Logger } from "#app/loggers/Logger";

import { TestPluginLogger } from "./TestPluginLogger.ts";

describe("Logger class test", () => {
    const logger = new Logger();

    logger.pushHandler(new ConsoleLogger());
    logger.pushProcessor(new TestPluginLogger());
    const spy = vi.spyOn(console, "log").mockImplementation(() => void 0);

    test("Test Processor in ConsoleLogger", async () => {
        await expect(logger.log(LogLevel.ALERT, "anything")).resolves.toBeUndefined();

        const lastCallParameters = spy.mock.calls.at(-1);

        expect(lastCallParameters![1]).toEqual("test");
    });

    test("Test Get Handlers and Processors", async () => {
        expect(logger.getHandlers()).toHaveLength(1);
        expect(logger.getProcessor()).toHaveLength(1);
    });
});

/**
 * A logger whose only handler records the context each call reached it with.
 *
 * @returns {{ logger: Logger; contexts: unknown[] }} The logger and what its handler received
 */
function recordingLogger(): { logger: Logger; contexts: unknown[] } {
    const logger = new Logger();
    const contexts: unknown[] = [];

    logger.pushHandler({
        log: async (_level: LogLevel, _message: unknown, context?: Record<string, unknown>) => {
            contexts.push(context);
        },
    } as unknown as ConsoleLogger);

    return { logger, contexts };
}

describe("Logger withContext, without scopes (browser, robot)", () => {
    test("Sends the context set once with every log call", async () => {
        const { logger, contexts } = recordingLogger();

        logger.withContext({ tenant: "abc" });
        await logger.info("first");
        await logger.error("second");

        expect(contexts).toEqual([ { tenant: "abc" }, { tenant: "abc" } ]);
    });

    test("Merges repeated calls, and a key passed by the call wins", async () => {
        const { logger, contexts } = recordingLogger();

        logger.withContext({ tenant: "abc", user: "1" });
        logger.withContext({ user: "2" });
        await logger.info("message", { user: "3", extra: "call" });

        expect(contexts).toEqual([ { tenant: "abc", user: "3", extra: "call" } ]);
        expect(logger.getContext()).toEqual({ tenant: "abc", user: "2" });
    });

    test("Hands the processors the merged context too", async () => {
        const logger = new Logger();
        const parser = vi.fn(async (data: LoggerParserInterface) => data);

        logger.pushProcessor({ parser });
        logger.withContext({ tenant: "abc" });
        await logger.info("message");

        expect(parser.mock.calls[0]?.[0]).toMatchObject({ context: { tenant: "abc" } });
    });

    test("Leaves the call context untouched when withContext was never called", async () => {
        const { logger, contexts } = recordingLogger();

        await logger.info("without");
        await logger.info("with", { only: "call" });

        expect(contexts).toEqual([ undefined, { only: "call" } ]);
        expect(logger.getContext()).toEqual({});
    });

    // The shape of `alkhema-sdk`'s logger: a subclass with its own `options`, built with `super()`.
    test("Lets a subclass declare its own options and context", () => {
        class ProjectLogger extends Logger {

            public constructor(
                private readonly options?: { name: string },
                public readonly context: string = "own",
            ) {
                super();
            }

            public name(): string | undefined {
                return this.options?.name;
            }

        }

        const logger = new ProjectLogger({ name: "sdk" });

        logger.withContext({ tenant: "abc" });

        expect(logger.name()).toBe("sdk");
        expect(logger.context).toBe("own");
        expect(logger.getContext()).toEqual({ tenant: "abc" });
    });

    test("Returns a copy of the context", () => {
        const { logger } = recordingLogger();

        logger.withContext({ tenant: "abc" });
        logger.getContext().tenant = "changed";

        expect(logger.getContext()).toEqual({ tenant: "abc" });
    });
});

interface LineInterface {
    message: unknown;
    context?: Record<string, unknown>;
}

/**
 * A logger built with `scopes`, the way a server builds it, whose only handler records every line.
 *
 * @returns {{ logger: Logger; lines: LineInterface[] }} The logger and its lines
 */
function scopedLogger(): { logger: Logger; lines: LineInterface[] } {
    const logger = new Logger({ scopes: new AsyncLocalStorage() });
    const lines: LineInterface[] = [];

    logger.pushHandler({
        log: async (_level: LogLevel, message: unknown, context?: Record<string, unknown>) => {
            lines.push({ message, context });
        },
    } as unknown as ConsoleLogger);

    return { logger, lines };
}

describe("Logger withContext, with scopes (server)", () => {
    /**
     * The reason scopes exist: one logger for the whole process, and every line still carrying the
     * context the request that wrote it added along the way.
     */
    test("Keeps concurrent requests apart on a single logger", async () => {
        const { logger, lines } = scopedLogger();
        const indexes = Array.from({ length: 200 }, (_value, index) => index);
        const spread = 5;

        await Promise.all(indexes.map(async (index) => logger.scope(async () => {
            logger.withContext({ requestId: `request-${index}` });
            await sleep(index % spread);
            logger.withContext({ userId: `user-${index}` });
            await logger.info(`request-${index}`);
        })));

        expect(lines).toHaveLength(indexes.length);
        expect(lines.filter((line) => line.context?.requestId !== line.message
            || line.context?.userId !== `user-${String(line.message).slice("request-".length)}`)).toEqual([]);
    });

    test("Gives every scope what was added outside any, and drops what a scope added when it ends", async () => {
        const { logger, lines } = scopedLogger();

        logger.withContext({ app: "api" });

        await logger.scope(async () => {
            logger.withContext({ requestId: "request-1" });
            await logger.info("inside");
        });
        await logger.info("outside");

        expect(lines.map((line) => line.context)).toEqual([ { app: "api", requestId: "request-1" }, { app: "api" } ]);
        expect(logger.getContext()).toEqual({ app: "api" });
    });

    test("Starts a nested scope from the outer one, and keeps what it adds inside", async () => {
        const { logger, lines } = scopedLogger();

        await logger.scope(async () => {
            logger.withContext({ requestId: "request-1" });

            await logger.scope(async () => {
                logger.withContext({ jobId: "job-1" });
                await logger.info("inner");
            });

            await logger.info("outer");
        });

        expect(lines.map((line) => line.context)).toEqual([
            { requestId: "request-1", jobId: "job-1" },
            { requestId: "request-1" },
        ]);
    });

    test("Leaves the call context untouched inside a scope nothing was added to", async () => {
        const { logger, lines } = scopedLogger();

        await logger.scope(async () => logger.info("empty"));

        expect(lines.map((line) => line.context)).toEqual([ undefined ]);
    });

    // Without it, one request's context would silently reach the next.
    test("Refuses to open a scope on a logger built without scopes", () => {
        expect(() => new Logger().scope(() => "never")).toThrow("Logger.scope needs scopes");
    });
});
