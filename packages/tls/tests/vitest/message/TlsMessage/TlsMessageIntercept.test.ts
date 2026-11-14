import { TlsMessage } from "#app";

import { startTlsServers, type TlsServersInterface } from "../../tls-server.ts";

describe("Tls Message", () => {
    let servers: TlsServersInterface;

    beforeAll(async () => {
        servers = await startTlsServers();
    });

    afterAll(() => {
        servers.close();
    });

    test("Teste Request Intercept", async () => {
        const requester = new TlsMessage({
            tls: {
                url: servers.proxyUrl,
            },
            baseURL: servers.targetUrl,
        });
        const interceptHeader = "intercept-test";

        requester.interceptors.request.use((config) => {
            if (!config.headers) return config;

            config.headers["teste"] = interceptHeader;

            return config;
        });

        const myRequest = requester.request<undefined>({});

        await Promise.all([
            expect(myRequest).resolves.toHaveProperty("request.headers.teste", interceptHeader),
            expect(myRequest).resolves.toHaveProperty("request.baseURL", servers.targetUrl),
            expect(myRequest).resolves.not.toHaveProperty("request.url"),
        ]);
    });
});
