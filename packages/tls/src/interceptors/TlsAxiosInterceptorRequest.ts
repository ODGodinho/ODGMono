import { AxiosInterceptorRequest } from "@odg/axios";
import type {
    InterceptorManager,
} from "@odg/message";

import type { TlsRequestInterface } from "../interfaces/TlsOptionsInterface.ts";
import { TlsAxiosRequestParser } from "../parser/TlsAxiosRequestParser.ts";

export class TlsAxiosInterceptorRequest<
    RequestData,
> extends AxiosInterceptorRequest<
        RequestData
    > implements InterceptorManager<TlsRequestInterface<RequestData>> {

    protected override readonly parser = TlsAxiosRequestParser;

}
