import { Exception } from "@odg/exception";

import {
    ConsoleLogger,
    type JSONLogFormattable,
    Logger,
    LogLevel,
} from "src";
import { StringMessageFormatter } from "src/logs/StringMessageFormater";

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
        const message = jsonLog({
            exception: {
                type: "Exception",
                message: "Message",
                stack: new Exception("example").stack,
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

        expect(formatter["getStatusCodeColor"](200)).toBe("green");
        expect(formatter["getStatusCodeColor"](300)).toBe("cyan");
        expect(formatter["getStatusCodeColor"](400)).toBe("yellow");
        expect(formatter["getStatusCodeColor"](500)).toBe("red");
        expect(formatter["getStatusCodeColor"](100)).toBe("orange");
    });
});
