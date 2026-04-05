import { UnknownException } from "@odg/exception";

import type { RequestInterface, ResponseInterface } from "../interfaces";

import { MessageResponse } from "./MessageResponse";

export class MessageUnknownException<RequestData, ResponseData = unknown> extends UnknownException {

    public constructor(
        public override message: string,
        preview?: unknown,
        public override code?: string,
        public request?: RequestInterface<RequestData>,
        public response?: ResponseInterface<ResponseData>,
    ) {
        super(message, preview, code);
    }

    public getMessageResponse(): MessageResponse<RequestData, ResponseData> | undefined {
        if (!this.request || !this.response) return;

        return new MessageResponse(
            this.request,
            this.response,
        );
    }

}
