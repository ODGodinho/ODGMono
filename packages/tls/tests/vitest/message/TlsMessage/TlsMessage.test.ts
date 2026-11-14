import { Exception, UnknownException } from "@odg/exception";
import { MessageException } from "@odg/message";
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

import { TlsMessage, TlsMessageException } from "#app";

import { startTlsServers, type TlsServersInterface } from "../../tls-server.ts";

describe("Tls Message", () => {
    const tlsHeader = "response.status";
    const baseUrlField = "request.baseURL";
    let servers: TlsServersInterface;

    beforeAll(async () => {
        servers = await startTlsServers();
    });

    afterAll(() => {
        servers.close();
    });

    test("Teste request without url and BaseURL Instance", async () => {
        const messageTls = new TlsMessage({
            tls: {
                url: servers.proxyUrl,
            },
            baseURL: servers.targetUrl,
        });

        await expect(messageTls.request({})).resolves.toHaveProperty(tlsHeader, 200);
    });

    test("Teste request with url and BaseUrl Instance", async () => {
        const messageTls = new TlsMessage({
            tls: {
                url: servers.proxyUrl,
            },
            baseURL: servers.targetUrl,
        });

        await expect(messageTls.request({ url: "/dns" })).resolves.toHaveProperty(tlsHeader, 200);
    });

    test("Test add default Headers", async () => {
        const messageTls = new TlsMessage({
            tls: {
                url: servers.proxyUrl,
            },
            headers: {
                "test1": "test1",
            },
        });
        const tlsResponse = messageTls.request({
            baseURL: servers.targetUrl,
            url: "/dns",
            headers: {
                "test2": "test2",
            },
        });

        await Promise.all([
            expect(tlsResponse).resolves.toHaveProperty("request.headers.test1", "test1"),
            expect(tlsResponse).resolves.toHaveProperty("request.headers.test2", "test2"),
        ]);
    });

    test("Teste request with timeout", async () => {
        const messageTls = new TlsMessage({
            tls: {
                url: servers.proxyUrl,
            },
            baseURL: "https://unused.test",
        });
        const tlsResponse = messageTls.request({
            baseURL: servers.targetUrl,
            timeout: 10_000,
        });

        await Promise.all([
            expect(tlsResponse).resolves.toHaveProperty(baseUrlField, servers.targetUrl),
            expect(tlsResponse).resolves.toHaveProperty(tlsHeader, 200),
        ]);
    });

    test("Teste request error", async () => {
        const messageTls = new TlsMessage({
            tls: {
                url: servers.proxyUrl,
            },
        });
        const tlsResponse = messageTls.request({
            baseURL: servers.targetUrl,
            url: "/404",
            timeout: 10_000,
        });

        await Promise.all([
            expect(tlsResponse).rejects.toHaveProperty(baseUrlField, servers.targetUrl),
            expect(tlsResponse).rejects.toHaveProperty("request.url", "/404"),
            expect(tlsResponse).rejects.toHaveProperty("request.tls.url", servers.proxyUrl),
        ]);

        expect(TlsMessage.isMessageError(await tlsResponse.catch((error: unknown) => error))).toBeTruthy();
    });

    test("Teste request timeout", async () => {
        const messageTls = new TlsMessage({
            tls: {
                url: servers.proxyUrl,
            },
        });

        const tlsResponse = messageTls.request({
            baseURL: servers.targetUrl,
            url: "/slow",
            timeout: 10,
        });

        await Promise.all([
            expect(tlsResponse).rejects.toHaveProperty(baseUrlField, servers.targetUrl),
            expect(tlsResponse).rejects.toHaveProperty("request.url", "/slow"),
            expect(tlsResponse).rejects.toHaveProperty("request.tls.url", servers.proxyUrl),
            expect(tlsResponse).rejects.toHaveProperty("response", undefined),
        ]);

        expect(TlsMessage.isMessageError(await tlsResponse.catch((error: unknown) => error))).toBeTruthy();
    });

    test.concurrent("Teste Exception parse default", () => {
        const exception = Exception.parse("test");

        expect(exception).toBeInstanceOf(UnknownException);
        expect(exception?.name).toEqual(UnknownException.name);
    });

    test.concurrent("Response without config", async () => {
        const config = { url: "", headers: new AxiosHeaders({}), $tlsOptions: {} };
        const exception = Exception.parse(new AxiosError(
            "test",
            "TEST",
            config,
            undefined,
            {
                data: undefined,
                headers: {},
                status: 200,
                statusText: "OK",
                config: undefined as unknown as InternalAxiosRequestConfig<unknown>,
            },
        ));

        expect(exception).toBeInstanceOf(TlsMessageException);

        const exception2 = Exception.parse(new AxiosError(
            "test",
            "TEST",
            config,
            undefined,
            undefined,
        ));

        expect(exception2).toBeInstanceOf(TlsMessageException);
    });

    test.concurrent("Axios error not identify tls error", () => {
        const exception2 = Exception.parse(new AxiosError(
            "test",
            "TEST",
            undefined,
            undefined,
            undefined,
        ));

        expect(exception2?.name).toBe(MessageException.name);
    });
});
