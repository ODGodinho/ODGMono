import { Exception } from "@odg/exception";

import type { RequestInterface, ResponseInterface } from "../interfaces";

import { MessageResponse } from "./MessageResponse";

export class MessageException<RequestData, ResponseData = unknown> extends Exception {

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
