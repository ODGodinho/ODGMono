import { MessageException } from "@odg/message";

import { AxiosMessage } from "#app";

describe("Test abort signal", () => {
    test("abort request", async () => {
        const requester = new AxiosMessage<unknown, Record<string, string>>();

        await expect(requester.request({
            url: "https://httpbin.org/delay/2",
            signal: AbortSignal.timeout(1),
        })).rejects.toThrow(MessageException);
    });
});
