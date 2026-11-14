import {
    Agent,
    createServer,
    type IncomingHttpHeaders,
    type Server,
} from "node:http";
import type { AddressInfo } from "node:net";

import {
    type HttpHeadersInterface,
    MessageException,
    MessageUnknownException,
    type RequestOptionsParametersInterface,
} from "@odg/message";
import axios from "axios";

import { AxiosMessage } from "../../src/index.ts";

type EchoType = IncomingHttpHeaders & { method?: string; order?: string[] };

const defaultAccept = "application/json, text/plain, */*";
const htmlAccept = "text/html,application/xhtml+xml";
const xmlAccept = "application/xml";
const textAccept = "text/plain";
const interceptorBroke = "interceptor broke";
const echoServer: { server?: Server; baseURL: string } = { baseURL: "" };

beforeAll(async () => {
    echoServer.server = createServer((request, response) => {
        response.statusCode = request.url === "/404" ? 404 : 200;
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({
            ...request.headers,
            method: request.method,
            order: request.rawHeaders.filter((_name, index) => index % 2 === 0).map((name) => name.toLowerCase()),
        }));
    });

    await new Promise<void>((resolve) => {
        echoServer.server?.listen(0, "127.0.0.1", resolve);
    });

    echoServer.baseURL = `http://127.0.0.1:${(echoServer.server.address() as AddressInfo).port}`;
});

afterAll(async () => {
    await new Promise((resolve) => {
        echoServer.server?.close(resolve);
    });
});

async function sent(
    requester: AxiosMessage<unknown, unknown>,
    options: RequestOptionsParametersInterface<unknown> = {},
): Promise<EchoType> {
    const message = await requester.request<unknown, EchoType>({ url: echoServer.baseURL, ...options });

    return message.response.data;
}

async function sentAccept(
    requester: AxiosMessage<unknown, unknown>,
    headers?: HttpHeadersInterface,
): Promise<string | undefined> {
    const echo = await sent(requester, { headers });

    return echo.accept;
}

/**
 * Fills only the headers the request did not define
 *
 * @param {AxiosMessage<unknown, unknown>} requester Message to intercept
 * @returns {AxiosMessage<unknown, unknown>}
 */
function useFillInterceptor(requester: AxiosMessage<unknown, unknown>): AxiosMessage<unknown, unknown> {
    requester.interceptors.request.use((config) => ({
        ...config,
        headers: { accept: htmlAccept, ...config.headers },
    }));

    return requester;
}

describe("Axios Default Params test", () => {
    test("Test Create default", async () => {
        const requester = new AxiosMessage();
        const baseURL = "https://test.test";

        expect(requester.getDefaultOptions().baseURL).toBeUndefined();
        requester.setDefaultOptions({
            baseURL,
        });
        expect(requester.getDefaultOptions().baseURL).toEqual(baseURL);
    });

    test("Test Base URL change", async () => {
        const requester = new AxiosMessage();
        const baseURL = "https://1.1.1.1/";

        requester.setDefaultOptions({
            baseURL,
        });

        await expect(requester.request({})).resolves.toMatchObject({
            request: {
                baseURL,
            },
        });
    });

    test("Test request Time", async () => {
        const requester = new AxiosMessage();
        const baseURL = "https://postman-echo.com/delay/2";

        requester.setDefaultOptions({
            baseURL,
            timeout: 1000,
        });

        const myRequest = requester.request({});

        await expect(myRequest).rejects.toThrow(MessageException);

        const requestAwait = await myRequest.catch((error: MessageException<unknown>) => error);

        expect(requestAwait.request?.timestamps).toBeGreaterThan(requester.getDefaultOptions().timeout! * 0.95);
        expect(requestAwait.request?.baseURL).toEqual(baseURL);
    });

    test("setDefaultOptions with getDefaultOptions and a proxy keeps the agent and the request goes out", async () => {
        const requester = new AxiosMessage({ httpAgent: new Agent() });
        const { hostname, port } = new URL(echoServer.baseURL);

        requester.setDefaultOptions({
            ...requester.getDefaultOptions(),
            proxy: { host: hostname, port: Number(port), auth: { username: "user", password: "pass" } },
        });

        expect(requester.getDefaultOptions().httpAgent).toBeInstanceOf(Agent);
        await expect(sent(requester)).resolves.toHaveProperty("proxy-authorization");
    });
});

describe("AxiosMessage accept priority", () => {
    test("sends the json accept without interceptor and without headers", async () => {
        await expect(sentAccept(new AxiosMessage())).resolves.toBe(defaultAccept);
    });

    test("interceptor that fills missing headers is not hidden by the default", async () => {
        await expect(sentAccept(useFillInterceptor(new AxiosMessage()))).resolves.toBe(htmlAccept);
    });

    test("request accept wins over an interceptor that fills missing headers", async () => {
        await expect(sentAccept(useFillInterceptor(new AxiosMessage()), { Accept: xmlAccept }))
            .resolves
            .toBe(xmlAccept);
    });

    test("constructor wins over the default and setDefaultOptions wins over the constructor", async () => {
        const requester = new AxiosMessage({ headers: { accept: textAccept } });

        await expect(sentAccept(requester)).resolves.toBe(textAccept);

        requester.setDefaultOptions({ headers: { Accept: "text/csv" } });

        await expect(sentAccept(requester)).resolves.toBe("text/csv");
    });

    test("interceptor that fills missing headers wins over the constructor and setDefaultOptions", async () => {
        const requester = useFillInterceptor(new AxiosMessage({ headers: { accept: textAccept } }));

        await expect(sentAccept(requester)).resolves.toBe(htmlAccept);

        requester.setDefaultOptions({ headers: { accept: "text/csv" } });

        await expect(sentAccept(requester)).resolves.toBe(htmlAccept);
    });

    test("default is still applied after the request interceptors are cleared", async () => {
        const requester = useFillInterceptor(new AxiosMessage());

        requester.interceptors.request.clear();

        await expect(sentAccept(requester)).resolves.toBe(defaultAccept);
    });

    test("known limit: an interceptor that overwrites accept wins over the request", async () => {
        const requester = new AxiosMessage();

        requester.interceptors.request.use((config) => ({
            ...config,
            headers: { ...config.headers, accept: htmlAccept },
        }));

        await expect(sentAccept(requester, { accept: xmlAccept })).resolves.toBe(htmlAccept);
    });
});

describe("AxiosMessage defaults after the interceptors", () => {
    test("interceptor only sees the request and the defaults go in after it", async () => {
        const requester = new AxiosMessage({ baseURL: echoServer.baseURL, timeout: 5000, headers: { "x-ctor": "1" } });
        const seen = vi.fn();

        const defaults = requester.getDefaultOptions();

        requester.setDefaultOptions({ ...defaults, headers: { ...defaults.headers, "x-defaults": "1" } });
        requester.interceptors.request.use((config) => {
            seen(config);

            return config;
        });

        await expect(requester.request({ url: "/path", headers: { "x-param": "1" } })).resolves.toMatchObject({
            request: {
                baseURL: echoServer.baseURL,
                timeout: 5000,
                headers: { "x-ctor": "1", "x-defaults": "1", "x-param": "1" },
            },
            response: {
                data: {
                    "x-ctor": "1",
                    "x-defaults": "1",
                    "x-param": "1",
                    "accept": defaultAccept,
                },
            },
        });

        const [ [ config ] ] = seen.mock.calls as unknown[][];

        expect(config).toMatchObject({ url: "/path", headers: { "x-param": "1" } });
        expect(config).toHaveProperty("startTime");
        expect(config).not.toHaveProperty("baseURL");
        expect(config).not.toHaveProperty("timeout");
        expect(config).not.toHaveProperty("validateStatus");
    });

    test("method default also goes in after the interceptors", async () => {
        const requester = new AxiosMessage({ method: "post" });
        const seen = vi.fn();

        requester.interceptors.request.use((config) => {
            seen(config.method);

            return config;
        });

        await expect(sent(requester)).resolves.toHaveProperty("method", "POST");
        expect(seen).toHaveBeenCalledWith(undefined);
        await expect(sent(new AxiosMessage())).resolves.toHaveProperty("method", "GET");
    });

    test("interceptor gets a copy and does not change the caller options", async () => {
        const requester = new AxiosMessage();
        const options = { headers: { "x-param": "1" } };

        requester.interceptors.request.use((config) => {
            config.headers!["x-intercept"] = "1";

            return config;
        });

        await expect(sent(requester, options)).resolves.toHaveProperty("x-intercept", "1");
        expect(options).toStrictEqual({ headers: { "x-param": "1" } });
    });

    test("request headers keep their order, then the constructor ones, then the default accept", async () => {
        const requester = new AxiosMessage({ headers: { "x-ctor1": "1", "accept": textAccept, "x-ctor2": "1" } });
        const echo = await sent(requester, { headers: { "x-b": "1", "x-a": "1" } });

        expect(echo.order?.slice(0, 5)).toStrictEqual([ "x-b", "x-a", "x-ctor1", "accept", "x-ctor2" ]);
        const withoutAccept = await sent(new AxiosMessage({ headers: { "x-ctor": "1" } }), { headers: { "x-b": "1" } });

        expect(withoutAccept.order?.slice(0, 3)).toStrictEqual([ "x-b", "x-ctor", "accept" ]);
    });

    test("request or interceptor header undefined removes the default, like axios", async () => {
        const requester = new AxiosMessage({ headers: { "x-ctor": "1", "x-kept": "1" } });

        requester.interceptors.request.use((config) => ({ headers: { ...config.headers, "X-CTOR": undefined } }));
        const echo = await sent(requester, { headers: { accept: undefined } });

        expect(echo).toHaveProperty("x-kept", "1");
        expect(echo).not.toHaveProperty("x-ctor");
        expect(echo).not.toHaveProperty("accept");
    });

    test("what the interceptor returns is merged over the request", async () => {
        const requester = new AxiosMessage();

        requester.interceptors.request.use((config) => ({ headers: { ...config.headers, "x-intercept": "1" } }));

        await expect(sent(requester, { method: "post", data: { body: 1 } })).resolves.toMatchObject({
            "method": "POST",
            "x-intercept": "1",
            "content-length": "10",
        });
    });

    test("interceptor error rejects the request", async () => {
        const requester = new AxiosMessage();

        requester.interceptors.request.use(() => {
            throw new MessageException(interceptorBroke);
        });

        await expect(sent(requester)).rejects.toThrow(interceptorBroke);
    });

    test("request interceptor error goes through the response onRejected, like axios", async () => {
        const requester = new AxiosMessage();
        const ejected = vi.fn();
        const logged = vi.fn();

        const ejectedId = requester.interceptors.response.use(undefined, ejected);

        requester.interceptors.response.use(undefined, async (exception) => {
            logged(exception.message);

            throw exception;
        });
        requester.interceptors.response.eject(ejectedId);
        requester.interceptors.request.use(() => {
            throw new MessageException(interceptorBroke);
        });

        await expect(sent(requester)).rejects.toThrow(interceptorBroke);
        expect(logged).toHaveBeenCalledExactlyOnceWith(interceptorBroke);
        expect(ejected).not.toHaveBeenCalled();
    });

    test("request interceptor throwing nothing reaches the response onRejected as an unknown error", async () => {
        const requester = new AxiosMessage();
        const logged = vi.fn();

        requester.interceptors.response.use(undefined, async (exception) => {
            logged(exception);

            throw exception;
        });
        requester.interceptors.request.use(() => {
            // eslint-disable-next-line @typescript-eslint/only-throw-error -- a broken interceptor that throws nothing
            throw undefined;
        });

        await expect(sent(requester)).rejects.toBeInstanceOf(MessageUnknownException);
        expect(logged).toHaveBeenCalledWith(expect.any(MessageUnknownException));
    });

    test("constructor headers are copied", async () => {
        const headers = { "x-ctor": "1" };
        const requester = new AxiosMessage({ headers });

        headers["x-ctor"] = "2";

        await expect(sent(requester)).resolves.toHaveProperty("x-ctor", "1");
    });

    test("axios own defaults still apply last", async () => {
        await expect(new AxiosMessage().request({ url: `${echoServer.baseURL}/404` })).rejects.toThrow(MessageException);
    });

    test("setDefaultOptions replaces the defaults, constructor included, without the undefined headers", async () => {
        const requester = new AxiosMessage({ timeout: 5000, headers: { "x-ctor": "1" } });

        requester.setDefaultOptions({ headers: { "x-defaults": "1", "x-gone": undefined } });

        expect(requester.getDefaultOptions()).toStrictEqual({ headers: { "x-defaults": "1" } });

        const echo = await sent(requester);

        expect(echo).toMatchObject({ "x-defaults": "1", "accept": defaultAccept });
        expect(echo).not.toHaveProperty("x-ctor");
        expect(echo).not.toHaveProperty("x-gone");
    });

    test("global axios defaults are untouched", async () => {
        await sent(new AxiosMessage({ headers: { accept: textAccept } }));

        expect(axios.defaults.headers.common.Accept).toBe(defaultAccept);
        expect(axios.defaults.timeout).toBe(0);
    });
});
