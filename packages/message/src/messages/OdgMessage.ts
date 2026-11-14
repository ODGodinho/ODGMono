import type { RequestOptionsParametersInterface } from "../interfaces/request.ts";
import { Methods } from "../MethodsEnum.ts";

import { MessageException } from "./MessageException.ts";
import { MessageResponse } from "./MessageResponse.ts";
import { MessageUnknownException } from "./MessageUnknownException.ts";

const firstSuccessStatus = 200;
const firstRedirectStatus = 300;

export abstract class ODGMessage {

    /**
     * Lowest priority options, below the constructor and setDefaultOptions.
     * Implementations merge them with the instance defaults after the request interceptors, right before sending.
     * `timeout: 0` means no timeout and `-1` means no size limit.
     */
    public static readonly defaultOptions: Readonly<RequestOptionsParametersInterface<unknown>> = Object.freeze({
        method: Methods.GET,
        headers: Object.freeze({ accept: "application/json, text/plain, */*" }),
        timeout: 60_000,
        maxContentLength: -1,
        maxBodyLength: -1,
        validateStatus: (status: number) => status >= firstSuccessStatus && status < firstRedirectStatus,
    });

    public static isMessageResponse(
        message: unknown,
    ): message is MessageResponse {
        if (!message) return false;

        if (message instanceof MessageResponse) return true;

        const keyIsMessageResponse = "IS_ODG_MESSAGE_RESPONSE";

        return typeof message === "object"
            && keyIsMessageResponse in message
            && "request" in message
            && "response" in message
            && !!message[keyIsMessageResponse];
    }

    public static isMessageError(
        message: unknown,
    ): message is MessageException<unknown> | MessageUnknownException<unknown> {
        if (!message) return false;

        const isError = message instanceof Error;

        const isMessageUnknownException = isError && message.name.endsWith("MessageUnknownException");
        const isMessageException = isError && message.name.endsWith("MessageException");

        return message instanceof MessageUnknownException
            || message instanceof MessageException
            || isMessageUnknownException
            || isMessageException;
    }

    public static isMessage(
        message: unknown,
    ): message is MessageException<unknown> | MessageResponse | MessageUnknownException<unknown> {
        return this.isMessageError(message)
            || this.isMessageResponse(message);
    }

}
