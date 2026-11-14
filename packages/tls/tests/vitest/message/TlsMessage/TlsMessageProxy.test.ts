import { TlsMessage } from "#app";

import { startTlsServers, type TargetEchoInterface, type TlsServersInterface } from "../../tls-server.ts";

const htmlAccept = "text/html,application/xhtml+xml";

describe("Tls Message through a TLS server", () => {
    let servers: TlsServersInterface;

    beforeAll(async () => {
        servers = await startTlsServers();
    });

    afterAll(() => {
        servers.close();
    });

    test("calls tls.url, the TLS server calls poptls-url and the response is the target one", async () => {
        const requester = new TlsMessage<unknown, TargetEchoInterface>({
            tls: { url: servers.proxyUrl },
            baseURL: servers.targetUrl,
            timeout: 5000,
            headers: { "x-ctor": "1" },
        });

        requester.interceptors.request.use((config) => ({ headers: { accept: htmlAccept, ...config.headers } }));

        const message = await requester.request({ url: "/path", params: { search: "1" }, headers: { "x-param": "1" } });

        expect(message.response.status).toBe(200);
        expect(message.response.data).toMatchObject({
            method: "GET",
            url: "/path?search=1",
            headers: { "accept": htmlAccept, "x-ctor": "1", "x-param": "1" },
        });
        expect(Object.keys(message.response.data.headers).filter((name) => name.startsWith("poptls-"))).toHaveLength(0);
        expect(message.request).toMatchObject({ url: "/path", baseURL: servers.targetUrl });
    });

    test("forwards the body", async () => {
        const requester = new TlsMessage<{ id: number }, TargetEchoInterface>({ tls: { url: servers.proxyUrl } });
        const message = await requester.request({ url: `${servers.targetUrl}/save`, method: "post", data: { id: 1 } });

        expect(message.response.data).toMatchObject({
            method: "POST",
            body: "{\"id\":1}",
            headers: { "content-type": "application/json" },
        });
    });

    test("target status goes through and the default validateStatus rejects a 404", async () => {
        const requester = new TlsMessage({ tls: { url: servers.proxyUrl }, baseURL: servers.targetUrl });

        await expect(requester.request({ url: "/404" })).rejects.toHaveProperty("response.status", 404);
    });

    test("TLS server follows redirects; with allowRedirect false axios keeps the mirrored 3xx", async () => {
        const requester = new TlsMessage<unknown, TargetEchoInterface>({
            tls: { url: servers.proxyUrl },
            baseURL: servers.targetUrl,
        });

        await expect(requester.request({ url: "/redirect" })).resolves.toHaveProperty("response.data.url", "/final");

        requester.setDefaultOptions({
            ...requester.getDefaultOptions(),
            tls: { url: servers.proxyUrl, allowRedirect: false },
        });

        await expect(requester.request({ url: "/redirect", validateStatus: () => true }))
            .resolves
            .toHaveProperty("response.status", 302);
    });
});
