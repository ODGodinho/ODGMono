import {
    createServer,
    type IncomingHttpHeaders,
    type IncomingMessage,
    type Server,
    type ServerResponse,
} from "node:http";
import type { AddressInfo } from "node:net";
import { setTimeout } from "node:timers/promises";

const slowResponseMs = 200;

async function readBody(request: IncomingMessage): Promise<Buffer> {
    const chunks: Buffer[] = [];

    for await (const chunk of request) chunks.push(chunk as Buffer);

    return Buffer.concat(chunks);
}

async function listen(server: Server): Promise<string> {
    await new Promise<void>((resolve) => {
        server.listen(0, "127.0.0.1", resolve);
    });

    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

// Real site: answers with what it received; 404 on /404, 302 on /redirect, slow on /slow
async function targetHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await readBody(request);

    if (request.url === "/redirect") {
        response.writeHead(302, { location: "/final" }).end();

        return;
    }

    if (request.url === "/slow") await setTimeout(slowResponseMs);

    response.writeHead(request.url === "/404" ? 404 : 200, { "content-type": "application/json" });
    response.end(JSON.stringify({
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: body.toString(),
    }));
}

// TLS server: calls poptls-url with the same method, headers and body, then answers exactly as the target did
async function proxyHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await readBody(request);
    const headers = Object.entries(request.headers)
        .filter(([ name ]) => !name.startsWith("poptls-") && name !== "host" && name !== "content-length");
    const target = await fetch(String(request.headers["poptls-url"]), {
        method: request.method,
        headers: Object.fromEntries(headers) as Record<string, string>,
        body: body.length ? new Uint8Array(body) : undefined,
        redirect: request.headers["poptls-allowredirect"] === "false" ? "manual" : "follow",
    });

    response.writeHead(target.status, Object.fromEntries(target.headers));
    response.end(Buffer.from(await target.arrayBuffer()));
}

/**
 * Local fake TLS server (tls.url) and the real site it calls (poptls-url)
 *
 * @returns {Promise<TlsServersInterface>}
 */
export async function startTlsServers(): Promise<TlsServersInterface> {
    const target = createServer((request, response) => {
        void targetHandler(request, response);
    });
    const proxy = createServer((request, response) => {
        void proxyHandler(request, response);
    });

    return {
        targetUrl: await listen(target),
        proxyUrl: await listen(proxy),
        close: (): void => {
            proxy.close();
            target.close();
        },
    };
}

export interface TargetEchoInterface {
    method: string;
    url: string;
    headers: IncomingHttpHeaders;
    body: string;
}

export interface TlsServersInterface {
    proxyUrl: string;
    targetUrl: string;
    close(): void;
}
