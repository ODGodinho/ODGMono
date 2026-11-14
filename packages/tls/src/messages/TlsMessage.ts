import { AxiosMessage } from "@odg/axios";
import type { InterceptorsInterface } from "@odg/message";

import { TlsAxiosInterceptorResponse } from "../interceptors/TlsAxiosInterceptorResponse.ts";
import type {
    TlsOptionsConstructorInterface,
    TlsRequestInterface,
} from "../interfaces/TlsOptionsInterface.ts";
import { TlsAxiosRequestParser } from "../parser/TlsAxiosRequestParser.ts";
import { TlsAxiosResponseParser } from "../parser/TlsAxiosResponseParser.ts";

import type { TlsMessageException } from "./TlsMessageException.ts";
import type { TlsMessageResponse } from "./TlsMessageResponse.ts";

/**
 * TLS Message class
 *
 * @template {any} RequestData Request body to send in the request
 * @template {any} ResponseData Response body of the request
 */
export class TlsMessage<RequestData, ResponseData> extends AxiosMessage<
    RequestData,
    ResponseData,
    TlsOptionsConstructorInterface<RequestData>
> {

    public override readonly interceptors: InterceptorsInterface<RequestData, ResponseData>;

    protected override readonly requestParser = TlsAxiosRequestParser;

    protected override readonly responseParser = TlsAxiosResponseParser;

    public constructor(config: TlsOptionsConstructorInterface<RequestData>) {
        super(config);

        this.interceptors = Object.freeze({
            request: this.requestInterceptor,
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

    /**
     * The constructor and setDefaultOptions require the `tls` field, so the defaults always carry it
     *
     * @returns {TlsOptionsConstructorInterface<RequestData>}
     */
    public override getDefaultOptions(): TlsOptionsConstructorInterface<RequestData> {
        return super.getDefaultOptions() as TlsOptionsConstructorInterface<RequestData>;
    }

    /**
     * Same as AxiosMessage.request, typed for TLS
     *
     * @template {any} RequestD Request Data
     * @template {any} ResponseD Response Data
     * @param {TlsRequestInterface<RequestD>} options What this request sends
     * @returns {Promise<TlsMessageResponse<RequestD, ResponseD>>}
     */
    public override async request<RequestD = RequestData, ResponseD = ResponseData>(
        options: TlsRequestInterface<RequestD>,
    ): Promise<TlsMessageResponse<RequestD, ResponseD>> {
        return super.request<RequestD, ResponseD>(options);
    }

}
