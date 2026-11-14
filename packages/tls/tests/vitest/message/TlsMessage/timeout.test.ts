import { TlsMessage } from "#app";

import { type EchoServerInterface, sentHeaders, startEchoServer } from "../../echo-server.ts";

describe("Tls Message timeout", () => {
    const timeoutHeader = "poptls-timeout";
    let server: EchoServerInterface;
    let messageTls: TlsMessage<unknown, unknown>;

    beforeAll(async () => {
        server = await startEchoServer();
    });

    afterAll(async () => {
        await server.close();
    });

    beforeEach(() => {
        messageTls = new TlsMessage({ tls: { url: server.url } });
    });

    test.each([
        [ 1000, "1" ],
        [ 1500, "1" ],
        [ 100, "0" ],
    ])("request timeout %d sends %s seconds", async (timeout, seconds) => {
        await expect(sentHeaders(messageTls, { timeout })).resolves.toHaveProperty(timeoutHeader, seconds);
    });

    test("without timeout sends the ODGMessage default", async () => {
        await expect(sentHeaders(messageTls)).resolves.toHaveProperty(timeoutHeader, "60");
    });

    test("timeout 0 (no timeout) sends no header", async () => {
        await expect(sentHeaders(messageTls, { timeout: 0 })).resolves.not.toHaveProperty(timeoutHeader);
    });

    test("request timeout wins over the config timeout", async () => {
        messageTls.setDefaultOptions({ ...messageTls.getDefaultOptions(), timeout: 10_000 });

        await expect(sentHeaders(messageTls, { timeout: 2000 })).resolves.toHaveProperty(timeoutHeader, "2");
    });

    test("config timeout is used when the request has none", async () => {
        messageTls.setDefaultOptions({ ...messageTls.getDefaultOptions(), timeout: 10_000 });

        await expect(sentHeaders(messageTls)).resolves.toHaveProperty(timeoutHeader, "10");
    });
});
