import { MessageUnknownException, type ResponseInterface } from "@odg/message";

import type { TlsRequestInterface } from "../interfaces/TlsOptionsInterface";

export class TlsMessageException<
    RequestData,
    ResponseData = unknown,
> extends MessageUnknownException<RequestData, ResponseData> {

    public constructor(
        public override message: string,
        preview?: unknown,
        public override code?: string,
        public override request?: TlsRequestInterface<RequestData>,
        public override response?: ResponseInterface<ResponseData>,
    ) {
        super(message, preview, code);
    }

}
