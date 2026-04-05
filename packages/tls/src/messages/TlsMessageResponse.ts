import { MessageResponse, type ResponseInterface } from "@odg/message";

import type { TlsRequestInterface } from "../interfaces/TlsOptionsInterface";

export class TlsMessageResponse<
    RequestData = unknown,
    ResponseData = unknown,
> extends MessageResponse<RequestData, ResponseData> {

    public constructor(
        public override request: TlsRequestInterface<RequestData>,
        public override response: ResponseInterface<ResponseData>,
    ) {
        super(request, response);
    }

}
