import { TlsMessage } from "#app";
import { TlsAxiosRequestParser } from "#app/parser/TlsAxiosRequestParser";

describe("Tls Allow Redirect", () => {
    const tlsUrl = "http://localhost:8082";

    test.concurrent("Allow Redirect default false", async () => {
        const messageTls = new TlsMessage({
            tls: {
                url: tlsUrl,
                allowRedirect: false,
            },
        });

        expect(TlsAxiosRequestParser["isAllowRedirect"](await messageTls["getNewOptions"]({}))).toBe(false);
    });

    test.concurrent("Redirect url override true", async () => {
        const messageTls = new TlsMessage({
            tls: {
                url: tlsUrl,
                allowRedirect: false,
            },
        });

        expect(TlsAxiosRequestParser["isAllowRedirect"](await messageTls["getNewOptions"]({
            tls: { allowRedirect: true },
        }))).toBe(true);
    });

    test.concurrent("Redirect default is true", async () => {
        const messageTls = new TlsMessage({
            tls: {
                url: tlsUrl,
                allowRedirect: undefined,
            },
        });

        expect(TlsAxiosRequestParser["isAllowRedirect"](await messageTls["getNewOptions"]({
            tls: { allowRedirect: undefined },
        }))).toBe(true);
    });
});
