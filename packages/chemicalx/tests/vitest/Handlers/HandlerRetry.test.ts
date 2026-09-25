import { type Mock, vi } from "vitest";

import { type HandlerSolutionType, RetryAction } from "../../../src/index.ts";

import { ExampleHandler } from "./mocks/ExampleHandler.ts";

describe("Handler Retry tests", () => {
    let handler: ExampleHandler;
    let handlerSolutionMock: Mock<() => Promise<HandlerSolutionType>>;
    let handlerAttemptMock: Mock<() => Promise<number>>;

    beforeEach(() => {
        handler = new ExampleHandler();
        handlerSolutionMock = vi.spyOn(handler, "testSolution");
        handlerAttemptMock = vi.spyOn(handler, "attempt");
    });

    test("Test Retry Solution 3 times", async () => {
        handlerSolutionMock.mockImplementation(async () => {
            if (handlerSolutionMock.mock.calls.length < 3) return RetryAction.Retry;

            return handler.successSolution();
        });
        handlerAttemptMock.mockImplementation(async () => Promise.resolve(4));

        await expect(handler.execute()).resolves.toBeUndefined();
        expect(handlerSolutionMock.mock.calls).toHaveLength(3);
    });
});
