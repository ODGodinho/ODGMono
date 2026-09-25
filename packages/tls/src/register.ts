import { Exception } from "@odg/exception";
import axios from "axios";

import type { TlsAxiosRequestConfigExtra } from "./interfaces/TlsOptionsInterface.ts";
import { TlsMessage } from "./messages/TlsMessage.ts";
import { TlsMessageException } from "./messages/TlsMessageException.ts";
import { TlsAxiosRequestParser } from "./parser/TlsAxiosRequestParser.ts";
import { TlsAxiosResponseParser } from "./parser/TlsAxiosResponseParser.ts";

Exception.$parsers.add((exception, original) => {
    if (TlsMessage.isAxiosMessageToTlsError(exception) && axios.isAxiosError(original)) {
        const response = original.response
            ? TlsAxiosResponseParser.parseLibraryToMessage(original.response)
            : undefined;
        const request = TlsAxiosRequestParser.parseLibraryToMessage({
            ...(original.config as TlsAxiosRequestConfigExtra<unknown>),
            endTime: Date.now(),
        });

        if (response && Object.keys({ ...response.request }).length === 0) {
            response.request = request!;
        }

        const newException = new TlsMessageException(
            exception.message,
            exception,
            String(exception.code),
            response?.request ?? request,
            response?.response,
        );

        newException.stack = exception.stack;

        Object.defineProperty(newException, "isAxiosError", {
            configurable: true,
            enumerable: false,
            value: true,
            writable: true,
        });

        return newException;
    }

    return exception;
});
