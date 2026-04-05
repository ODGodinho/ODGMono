import { ConsoleLogger, LogLevel, type LogLevelType } from "../../src/index";

describe("ConsoleLogger.test.ts", () => {
    const consoleLogger = new ConsoleLogger();

    for (const level in LogLevel) {
        const typeCast = level as LogLevelType;

        test(`Test Log ${typeCast}`, async () => {
            const functionName = LogLevel[typeCast];

            await expect(consoleLogger[functionName]("anything")).resolves.toBeUndefined();
        });
    }

    test("UnknownLevel", async () => {
        const level = "unknown" as LogLevel;

        await expect(consoleLogger.log(level, "anything")).resolves.toBeUndefined();
    });
});
