import { LogLevel, type LogLevelType, NullLogger } from "../../src/index";

describe("AbstractLogger.test.ts", () => {
    const logger = new NullLogger();

    for (const level in LogLevel) {
        const typeCast = level as LogLevelType;

        test(`Test Log ${typeCast}`, async () => {
            const functionName = LogLevel[typeCast];

            await expect(logger[functionName]("anything")).resolves.toBeUndefined();
        });
    }
});
