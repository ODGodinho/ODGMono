import type {
    InterceptorManager,
    onFulfilledType,
    onRejectedType,
    RequestInterface,
} from "@odg/message";

import { AxiosParser } from "../parser/AxiosParser.ts";

export class AxiosInterceptorRequest<RequestData> implements InterceptorManager<RequestInterface<RequestData>> {

    private readonly handlers = new Map<number, [ onFulfilledType<RequestInterface<unknown>>?, onRejectedType? ]>();

    private nextId = 0;

    public use<RequestD = RequestData>(
        onFulfilled?: onFulfilledType<RequestInterface<RequestD>>,
        onRejected?: onRejectedType,
    ): number {
        this.handlers.set(this.nextId, [ onFulfilled as onFulfilledType<RequestInterface<unknown>>, onRejected ]);

        return this.nextId++;
    }

    public eject(id: number): void {
        this.handlers.delete(id);
    }

    public clear(): void {
        this.handlers.clear();
    }

    /**
     * Run the interceptors like axios does: the last one registered runs first.
     * What onFulfilled returns is merged over the current request.
     *
     * @template {any} RequestD Request Data
     * @param {RequestInterface<RequestD>} request Request parameter
     * @returns {Promise<RequestInterface<RequestD>>}
     */
    public async run<RequestD>(request: RequestInterface<RequestD>): Promise<RequestInterface<RequestD>> {
        let chain = Promise.resolve(request as RequestInterface<unknown>);

        for (const [ onFulfilled, onRejected ] of this.handlers.values().toArray().toReversed()) {
            // eslint-disable-next-line promise/prefer-catch -- like axios, onRejected only handles the previous ones
            chain = chain.then(
                onFulfilled && (async (config) => ({ ...config, ...await onFulfilled(config) })),
                onRejected && (async (error: unknown) => onRejected(AxiosParser.parseException(error))),
            );
        }

        return chain as Promise<RequestInterface<RequestD>>;
    }

}
