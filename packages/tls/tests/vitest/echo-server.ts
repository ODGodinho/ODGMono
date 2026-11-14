import { createServer, type IncomingHttpHeaders } from "node:http";
import type { AddressInfo } from "node:net";

import type { TlsMessage, TlsRequestInterface } from "#app";

export interface EchoServerInterface {
    url: string;
    close(): Promise<void>;
}

/**
 * Local server that answers with the headers it received, standing in for the TLS proxy
 *
 * @returns {Promise<EchoServerInterface>}
 */
export async function startEchoServer(): Promise<EchoServerInterface> {
    const server = createServer((request, response) => {
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify(request.headers));
    });

    await new Promise<void>((resolve) => {
        server.listen(0, "127.0.0.1", resolve);
    });

    return {
        url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
        close: async (): Promise<void> => new Promise((resolve) => {
            server.close(() => {
                resolve();
            });
        }),
    };
}

/**
 * Headers the TLS proxy received
 *
 * @param {TlsMessage<unknown, unknown>} message TLS message
 * @param {Partial<TlsRequestInterface<unknown>>} options Request options
 * @returns {Promise<IncomingHttpHeaders>}
 */
export async function sentHeaders(
    message: TlsMessage<unknown, unknown>,
    options: Partial<TlsRequestInterface<unknown>> = {},
): Promise<IncomingHttpHeaders> {
    const response = await message.request<unknown, IncomingHttpHeaders>(options);

    return response.response.data;
}
