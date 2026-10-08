import httpStatus from "http-status";
import { vi } from "vitest";

import { reportException } from "../../src/report-exception.ts";

import { createLogger } from "./support.ts";

describe("reportException", () => {
    test("records a client failure that is not an Error as notice", () => {
        const logger = createLogger();
        const notice = vi.spyOn(logger, "notice").mockResolvedValue();
        const response = new Response(null, { status: httpStatus.BAD_REQUEST });

        reportException(logger, {}, response, "abc");

        expect(notice).toHaveBeenCalledWith("Client error", {
            exception: { type: undefined },
            requestId: "abc",
            status: httpStatus.BAD_REQUEST,
        });
    });
});
