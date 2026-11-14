import { Exception } from "@odg/exception";
import { type HttpHeadersInterface, MessageUnknownException } from "@odg/message";
import type { AxiosResponseHeaders } from "axios";

export class AxiosParser {

    /**
     * Add support axios 1.0 headers
     *
     * @param {unknown | undefined} headers Axios Headers Object
     * @returns {HttpHeadersInterface}
     */
    public static parseHeaders(headers?: unknown): HttpHeadersInterface {
        return this.isAxiosHeaders(headers) && typeof headers.toJSON === "function"
            ? ((headers.toJSON as (json: boolean) => unknown)(true) as HttpHeadersInterface)
            : (headers as HttpHeadersInterface);
    }

    /**
     * Error from the request or response chain as an Exception, also when nothing was thrown
     *
     * @param {unknown} error What was thrown
     * @returns {Exception}
     */
    public static parseException(error: unknown): Exception {
        return Exception.parse(error) ?? new MessageUnknownException("Axios Message empty error", error);
    }

    /**
     * Check if headers is Axios Headers
     *
     * @param {unknown} headers Objeto com headers do axios
     * @returns {headers is AxiosResponseHeaders}
     */
    protected static isAxiosHeaders(headers: unknown): headers is AxiosResponseHeaders {
        return !!(
            headers
            && typeof headers === "object"
        );
    }

}
