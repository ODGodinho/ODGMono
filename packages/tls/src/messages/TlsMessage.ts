import { AxiosMessage } from "@odg/axios";
import type {
    InterceptorsInterface,
    ProxyConfigInterface,
} from "@odg/message";
import type {
    AxiosInterceptorManager,
    AxiosRequestConfig,
} from "axios";

import { TlsAxiosInterceptorRequest } from "../interceptors/TlsAxiosInterceptorRequest";
import { TlsAxiosInterceptorResponse } from "../interceptors/TlsAxiosInterceptorResponse";
import type {
    TlsOptionsConstructorInterface,
    TlsRequestInterface,
} from "../interfaces/TlsOptionsInterface";
import { TlsAxiosRequestParser } from "../parser/TlsAxiosRequestParser";
import { TlsAxiosResponseParser } from "../parser/TlsAxiosResponseParser";

import type { TlsMessageException } from "./TlsMessageException";
import type { TlsMessageResponse } from "./TlsMessageResponse";

/**
 * TLS Message class
 *
 * @template {any} RequestData Request body to send in the request
 * @template {any} ResponseData Response body of the request
 */
export class TlsMessage<RequestData, ResponseData> extends AxiosMessage<RequestData, ResponseData> {

    public override readonly interceptors: InterceptorsInterface<RequestData, ResponseData>;

    protected override readonly requestParser = TlsAxiosRequestParser;

    protected override readonly responseParser = TlsAxiosResponseParser;

    protected config: TlsOptionsConstructorInterface<RequestData>;

    protected proxy?: ProxyConfigInterface | false;

    public constructor(config: TlsOptionsConstructorInterface<RequestData>) {
        super({});
        this.proxy = config.proxy;
        this.config = config;

        this.interceptors = Object.freeze({
            request: new TlsAxiosInterceptorRequest<RequestData>(
                this.client.interceptors.request as AxiosInterceptorManager<AxiosRequestConfig<RequestData>>,
            ),
            response: new TlsAxiosInterceptorResponse<RequestData, ResponseData>(
                this.client.interceptors.response,
            ),
        });
    }

    public static isAxiosMessageToTlsError<RequestData = unknown, ResponseData = unknown>(
        message: unknown,
    ): message is TlsMessageException<RequestData, ResponseData> {
        return super.isMessageError(message)
            && !!message.request
            && "$tlsOptions" in message.request
            && !!message.request.$tlsOptions;
    }

    public static override isMessageError<RequestData = unknown, ResponseData = unknown>(
        message: unknown,
    ): message is TlsMessageException<RequestData, ResponseData> {
        return super.isMessageError(message)
            && !!message.request
            && "tls" in message.request
            && !!message.request.tls;
    }

    public override setDefaultOptions(config: TlsOptionsConstructorInterface<RequestData>): this {
        this.config = config;

        return this;
    }

    public override getDefaultOptions(): TlsOptionsConstructorInterface<RequestData> {
        return {
            ...this.config,
        };
    }

    public override async request<RequestD = RequestData, ResponseD = ResponseData>(
        options: TlsRequestInterface<RequestD>,
    ): Promise<TlsMessageResponse<RequestD, ResponseD>> {
        return super.request<RequestD, ResponseD>(await this.getNewOptions(options));
    }

    private async getNewOptions<RequestD = RequestData>(
        options: TlsRequestInterface<RequestD>,
    ): Promise<TlsRequestInterface<RequestD>> {
        return {
            ...this.config as TlsRequestInterface<RequestD>,
            ...options,
            headers: {
                ...this.config.headers,
                ...options.headers,
            },
        };
    }

}
