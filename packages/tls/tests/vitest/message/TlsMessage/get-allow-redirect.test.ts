import { TlsMessage } from "#app";

import { type EchoServerInterface, sentHeaders, startEchoServer } from "../../echo-server.ts";

describe("Tls Allow Redirect", () => {
    const redirectHeader = "poptls-allowredirect";
    let server: EchoServerInterface;

    beforeAll(async () => {
        server = await startEchoServer();
    });

    afterAll(async () => {
        await server.close();
    });

    test("config allowRedirect false", async () => {
        const messageTls = new TlsMessage({ tls: { url: server.url, allowRedirect: false } });

        await expect(sentHeaders(messageTls)).resolves.toHaveProperty(redirectHeader, "false");
    });

    test("request tls replaces the whole config tls (shallow merge, so it repeats url)", async () => {
        const messageTls = new TlsMessage({ tls: { url: server.url, allowRedirect: false } });

        await expect(sentHeaders(messageTls, { tls: { url: server.url, allowRedirect: true } }))
            .resolves
            .toHaveProperty(redirectHeader, "true");
    });

    test("redirect default is true", async () => {
        const messageTls = new TlsMessage({ tls: { url: server.url, allowRedirect: undefined } });

        await expect(sentHeaders(messageTls)).resolves.toHaveProperty(redirectHeader, "true");
    });
});
