import { randomUUID } from "node:crypto";

import { LogLevel } from "@odg/log";

import { JSONLogger, JSONLoggerPlugin } from "#app";

describe("Test Identifier log fill", () => {
    const logger = new JSONLoggerPlugin("");
    const identifier = randomUUID();

    test("Identifier Not Init", () => {
        expect(logger["identifier"]).toBeUndefined();
    });

    test("Identifier Init", () => {
        logger.setIdentifier(identifier);

        expect(logger["identifier"]).toBe(identifier);
        expect(logger.getIdentifier()).toBe(identifier);
    });

    test("Test Log Identifier JSON", async () => {
        const logData = await logger.logJSON(LogLevel.DEBUG, "");

        expect(logData.identifier).toBe(identifier);
    });

    test("Identifier function is asked again for every line", async () => {
        const plugin = new JSONLoggerPlugin("");
        const current = { identifier: "request-1" };

        plugin.setIdentifier(() => current.identifier);

        await expect(plugin.logJSON(LogLevel.DEBUG, "")).resolves.toMatchObject({ identifier: "request-1" });

        current.identifier = "request-2";

        await expect(plugin.logJSON(LogLevel.DEBUG, "")).resolves.toMatchObject({ identifier: "request-2" });
        expect(plugin.getIdentifier()).toBe("request-2");
    });

    test("Identifier function may answer undefined", async () => {
        const plugin = new JSONLoggerPlugin("");

        plugin.setIdentifier(() => undefined);

        const logData = await plugin.logJSON(LogLevel.DEBUG, "");

        expect(logData.identifier).toBeUndefined();
    });

    test("Test Log instanceof", async () => {
        const logData = logger.logJSON(LogLevel.DEBUG, "");

        await expect(logData).resolves.toBeInstanceOf(JSONLogger);
    });
});
