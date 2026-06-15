import { TlsAxiosRequestParser } from "#app/parser/TlsAxiosRequestParser";

describe("Tls Message", () => {
    test.concurrent("Proxy without login", async () => {
        expect(TlsAxiosRequestParser["getProxyUrl"]({
            host: "localhost",
            protocol: "http",
            port: 8082,
        })).toBe("http://localhost:8082");
    });

    test.concurrent("Proxy with login", async () => {
        expect(TlsAxiosRequestParser["getProxyUrl"]({
            host: "localhost",
            protocol: "http",
            port: 8083,
            auth: {
                username: "user",
                password: "pass",
            },
        })).toBe("http://user:pass@localhost:8083");
    });

    test.concurrent("Proxy empty port", async () => {
        expect(TlsAxiosRequestParser["getProxyUrl"]({
            host: "localhost",
            protocol: "http",
            port: NaN,
            auth: {
                username: "user",
                password: "pass",
            },
        })).toBe("http://user:pass@localhost");
    });
});
