import { TlsMessage } from "#app";

import { type EchoServerInterface, sentHeaders, startEchoServer } from "../../echo-server.ts";

const htmlAccept = "text/html,application/xhtml+xml";
const ctorAccept = "text/plain";

describe("Tls Message defaults after the interceptors", () => {
    let server: EchoServerInterface;

    beforeAll(async () => {
        server = await startEchoServer();
    });

    afterAll(async () => {
        await server.close();
    });

    test("interceptor only sees the request and the config goes in after it", async () => {
        const requester = new TlsMessage({
            tls: { url: server.url },
            baseURL: "https://example.com",
            timeout: 5000,
            headers: { "accept": ctorAccept, "poptls-session-hash": "hash" },
        });
        const seen = vi.fn();

        requester.interceptors.request.use((config) => {
            seen(config);

            return { ...config, headers: { accept: htmlAccept, ...config.headers } };
        });

        await expect(sentHeaders(requester, { url: "/path", headers: { "x-param": "1" } })).resolves.toMatchObject({
            "accept": htmlAccept,
            "x-param": "1",
            "poptls-session-hash": "hash",
            "poptls-url": "https://example.com/path",
            "poptls-timeout": "5",
        });
        expect(seen).toHaveBeenCalledWith(expect.objectContaining({ url: "/path", headers: { "x-param": "1" } }));
        expect(seen.mock.calls[0]?.[0]).not.toHaveProperty("baseURL");
        expect(seen.mock.calls[0]?.[0]).not.toHaveProperty("timeout");
        expect(seen.mock.calls[0]?.[0]).not.toHaveProperty("tls");
    });

    test("request header wins over the config headers and config headers still go", async () => {
        const requester = new TlsMessage({
            tls: { url: server.url },
            headers: { "accept": ctorAccept, "x-ctor": "1" },
        });

        await expect(sentHeaders(requester, { headers: { Accept: htmlAccept } }))
            .resolves
            .toMatchObject({ "accept": htmlAccept, "x-ctor": "1" });
    });

    test("config proxy and setDefaultOptions tls go in after the interceptors", async () => {
        const requester = new TlsMessage({
            tls: { url: "https://unused.test" },
            proxy: { protocol: "https", host: "proxy.test", port: 8080 },
        });

        requester.setDefaultOptions({
            ...requester.getDefaultOptions(),
            tls: { url: server.url, allowRedirect: false },
        });

        await expect(sentHeaders(requester)).resolves.toMatchObject({
            "poptls-proxy": "https://proxy.test:8080",
            "poptls-allowredirect": "false",
        });
        expect(requester.getDefaultOptions().tls).toStrictEqual({ url: server.url, allowRedirect: false });
    });
});
