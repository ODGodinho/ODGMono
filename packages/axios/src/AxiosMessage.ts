import { Exception } from "@odg/exception";
import {
    type InterceptorsInterface,
    type MessageInterface,
    type MessageResponse,
    ODGMessage,
    type RequestInterface,
    type RequestOptionsParametersInterface,
} from "@odg/message";
import axios, {
    AxiosHeaders,
    type AxiosInstance,
    type AxiosInterceptorManager,
    type AxiosResponse,
    type RawAxiosHeaders,
} from "axios";

import { AxiosInterceptorRequest } from "./interceptors/AxiosInterceptorRequest.ts";
import { AxiosInterceptorResponse } from "./interceptors/AxiosInterceptorResponse.ts";
import { AxiosParser } from "./parser/AxiosParser.ts";
import { AxiosRequestParser } from "./parser/AxiosRequestParser.ts";
import { AxiosResponseParser } from "./parser/AxiosResponseParser.ts";

export class AxiosMessage<
    RequestData,
    ResponseData,
    Options extends RequestInterface<RequestData> = RequestOptionsParametersInterface<RequestData>,
> extends ODGMessage implements MessageInterface<RequestData, ResponseData> {

    public readonly interceptors!: Readonly<InterceptorsInterface<RequestData, ResponseData>>;

    protected readonly client: AxiosInstance;

    protected readonly requestParser = AxiosRequestParser;

    protected readonly responseParser = AxiosResponseParser;

    protected readonly requestInterceptor = new AxiosInterceptorRequest<RequestData>();

    protected defaults: Partial<Options> = {};

    public constructor(options?: NoInfer<Options>) {
        super();
        this.client = axios.create();

        for (const key of Object.keys(ODGMessage.defaultOptions)) {
            Reflect.deleteProperty(this.client.defaults, key);
        }

        if (options) this.setDefaultOptions(options);

        this.interceptors = Object.freeze({
            request: this.requestInterceptor,
            response: new AxiosInterceptorResponse<RequestData, ResponseData>(
                this.client.interceptors.response,
            ),
        });
    }

    public setDefaultOptions(config: Options): this {
        this.defaults = {
            ...config,
            headers: AxiosParser.parseHeaders(AxiosHeaders.from(config.headers as RawAxiosHeaders | undefined)),
        };

        return this;
    }

    public getDefaultOptions(): Partial<Options> {
        return { ...this.defaults, headers: { ...this.defaults.headers } };
    }

    /**
     * Request Abstract
     *
     * @template {any} RequestD Request Data
     * @template {any} ResponseD Response Data
     * @param {RequestOptionsParametersInterface<RequestD>} options Opções de requisição
     * @returns {Promise<MessageResponse<RequestD, ResponseD>>}
     */
    public async request<
        RequestD = RequestData,
        ResponseD = ResponseData,
    >(
        options: RequestOptionsParametersInterface<RequestD>,
    ): Promise<MessageResponse<RequestD, ResponseD>> {
        try {
            const intercepted = this.requestInterceptor.run<RequestD>({
                startTime: Date.now(),
                ...options,
                headers: { ...options.headers },
            });
            // eslint-disable-next-line promise/prefer-catch -- client.request errors already ran the response ones
            const response = await intercepted.then(
                async (request) => this.client.request<ResponseD, AxiosResponse<ResponseD, RequestD>, RequestD>(
                    this.requestParser.parseMessageToLibrary(this.withDefaults(request)),
                ),
                async (exception: unknown) => this.rejectToResponseInterceptors<RequestD, ResponseD>(exception),
            );

            return this.responseParser.parseLibraryToMessage(response);
        } catch (error: unknown) {
            throw Exception.parse(error)!;
        }
    }

    /**
     * Like axios: an error in the request interceptors skips the request and goes through the response interceptors
     *
     * @template {any} RequestD Request Data
     * @template {any} ResponseD Response Data
     * @param {unknown} exception Error from the request interceptors
     * @returns {Promise<AxiosResponse<ResponseD, RequestD>>}
     */
    protected async rejectToResponseInterceptors<RequestD, ResponseD>(
        exception: unknown,
    ): Promise<AxiosResponse<ResponseD, RequestD>> {
        type ResponseHandlerType = NonNullable<AxiosInterceptorManager<AxiosResponse>["handlers"]>[number];

        // Axios leaves null where a handler was ejected; its types do not say so
        const handlers = this.client.interceptors.response.handlers as Array<ResponseHandlerType | null>;
        let chain: Promise<AxiosResponse> = Promise.reject(AxiosParser.parseException(exception));

        for (const handler of handlers) {
            // eslint-disable-next-line promise/prefer-catch -- like axios, onRejected only handles the previous ones
            if (handler) chain = chain.then(handler.fulfilled, handler.rejected) as Promise<AxiosResponse>;
        }

        return chain as Promise<AxiosResponse<ResponseD, RequestD>>;
    }

    /**
     * ODGMessage.defaultOptions < constructor/setDefaultOptions < request (after the interceptors).
     * Headers are merged by name: the request keeps its order, then the missing constructor/setDefaultOptions
     * headers, then the missing ODGMessage.defaultOptions headers. A request header set to undefined is removed.
     *
     * @template {any} RequestD Request Data
     * @param {RequestInterface<RequestD>} request Request after the interceptors
     * @returns {RequestInterface<RequestD>}
     */
    protected withDefaults<RequestD>(request: RequestInterface<RequestD>): RequestInterface<RequestD> {
        const defined = Object.entries(request).filter(([ , value ]) => value !== undefined);
        const removed = Object.entries({ ...request.headers }).filter(([ , value ]) => value === undefined);
        const headers = AxiosHeaders.from(request.headers as RawAxiosHeaders | undefined)
            .set(this.defaults.headers as RawAxiosHeaders | undefined, false)
            .set(ODGMessage.defaultOptions.headers as RawAxiosHeaders, false);

        headers.delete(removed.map(([ name ]) => name));

        return {
            ...ODGMessage.defaultOptions as RequestInterface<RequestD>,
            ...this.defaults as RequestInterface<RequestD>,
            ...Object.fromEntries(defined),
            headers: AxiosParser.parseHeaders(headers),
        };
    }

}
