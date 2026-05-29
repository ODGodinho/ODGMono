import { LogLevel } from "@odg/log";

import { JSONLoggerPlugin } from "#app";

describe("Test anything log", () => {
    const logger = new JSONLoggerPlugin("");

    test("Symbol log test", async () => {
        await expect(logger.logJSON(LogLevel.DEBUG, Symbol("test"))).resolves.toEqual(expect.objectContaining({
            message: "Symbol(test)",
        }));
    });
});
