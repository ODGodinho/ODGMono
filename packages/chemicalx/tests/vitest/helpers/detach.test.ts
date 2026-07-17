import { Exception } from "@odg/exception";
import { vi } from "vitest";

import { detach } from "#helpers";

describe("Detach Test", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("routes a rejection to log.error", async () => {
        const error = new Exception("boom");
        const log = { "error": vi.fn() };

        detach(Promise.reject(error), log);

        await vi.waitFor(() => {
            expect(log.error).toHaveBeenCalledWith(error);
        });
    });

    test("does not call log.error when the promise resolves", async () => {
        const log = { "error": vi.fn() };

        detach(Promise.resolve("ok"), log);

        await vi.waitFor(() => {
            expect(log.error).not.toHaveBeenCalled();
        });
    });

    test("falls back to console.error when log.error throws", async () => {
        const consoleError = vi.spyOn(console, "error").mockReturnValue(undefined);
        const log = {
            "error": vi.fn(() => {
                throw new Exception("logger down");
            }),
        };

        detach(Promise.reject(new Exception("boom")), log);

        await vi.waitFor(() => {
            expect(consoleError).toHaveBeenCalledTimes(1);
        });
        expect(log.error).toHaveBeenCalledTimes(1);
    });

    test("falls back to console.error when log.error rejects", async () => {
        const consoleError = vi.spyOn(console, "error").mockReturnValue(undefined);
        const log = {
            "error": vi.fn(async () => {
                throw new Exception("logger down");
            }),
        };

        detach(Promise.reject(new Exception("boom")), log);

        await vi.waitFor(() => {
            expect(consoleError).toHaveBeenCalledTimes(1);
        });
    });
});
