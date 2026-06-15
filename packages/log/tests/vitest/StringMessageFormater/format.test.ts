import { Exception } from "@odg/exception";

import {
    ConsoleLogger,
    type JSONLogFormattable,
    Logger,
    LogLevel,
} from "#app";
import { StringMessageFormatter } from "#app/logs/StringMessageFormater";

function jsonLog(overrides: Partial<JSONLogFormattable> = {}): JSONLogFormattable {
    return {
        type: LogLevel.INFO,
        index: "index",
        instance: "instance",
        message: "message",
        createdAt: new Date(),
        ...overrides,
    };
}

describe("Test request message", () => {
    const logger = new Logger();

    logger.pushHandler(new ConsoleLogger());
    const localUrl = "http://localhost:3000";

    test("Teste requester message", async () => {
        const message = jsonLog({
            request: {
                url: localUrl,
                response: {
                    status: 200,
                },
            },
        });

        await expect(logger.info(message)).resolves.toBeUndefined();
    });

    test("Teste requester baseUrl message", async () => {
        const message = jsonLog({
            request: {
                baseURL: localUrl,
                response: {
                    status: 200,
                },
            },
        });

        await expect(logger.info(message)).resolves.toBeUndefined();
    });

    test("Teste requester without response", async () => {
        const message = jsonLog({
            request: {
                url: localUrl,
            },
        });

        await expect(logger.info(message)).resolves.toBeUndefined();
    });

    test("Teste exception", async () => {
        const exception = new Exception("example");
        const message = jsonLog({
            exception: {
                type: "Exception",
                message: "Message",
                stack: exception.stack,
            },
        });

        await expect(logger.error(message)).resolves.toBeUndefined();
    });

    test("Teste only message", async () => {
        const message = jsonLog({});

        await expect(logger.info(message)).resolves.toBeUndefined();
    });

    test("Teste without message", async () => {
        const message = jsonLog({ message: "" });

        await expect(logger.info(message)).resolves.toBeUndefined();
    });

    test("Teste status Code", async () => {
        const formatter = new StringMessageFormatter();

        expect(formatter["getStatusCodeColor"](200)).toBe("#00FF00");
        expect(formatter["getStatusCodeColor"](300)).toBe("#00FFFF");
        expect(formatter["getStatusCodeColor"](400)).toBe("#FFFF00");
        expect(formatter["getStatusCodeColor"](500)).toBe("#FF0000");
        expect(formatter["getStatusCodeColor"](100)).toBe("#FFA500");
    });
});
