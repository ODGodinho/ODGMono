import ansis from "ansis";

import type { ConsoleLoggerOptionsInterface } from "../Interfaces/ConsoleLoggerOptionsInterface.ts";
import { formatUnknown } from "../Support/format-unknown.ts";

import type { JSONLogFormattable } from "./json-log-formattable.ts";

export class StringMessageFormatter {

    public constructor(private readonly options: ConsoleLoggerOptionsInterface = {}) {
    }

    public format(message: JSONLogFormattable): string {
        const identifier = this.options.shouldShowIdentifier && message.identifier ? `${ansis.gray(message.identifier)} ` : "";

        return `${identifier}${this.formatLine(message)}`;
    }

    private formatLine(message: JSONLogFormattable): string {
        if (message.request) {
            const trace = message.exception?.stack ? `\n${message.exception.stack}` : "";

            return `${this.formatRequester(message)}${trace}`;
        }

        return message.exception ? `${ansis.whiteBright.bold("Exception -")} ${message.exception.stack}` : formatUnknown(message.message || message);
    }

    private formatRequester(message: JSONLogFormattable): string {
        const requester = message.request!;
        const url = ansis.white(`${requester.baseURL! || ""}${requester.url! || ""}`);
        const statusCode = requester.response?.status;
        const status = statusCode
            ? ansis.bgHex(this.getStatusCodeColor(statusCode)).white(String(statusCode))
            : ansis.bgGray("XXX");
        const method = (requester.method ?? "GET").toUpperCase();
        const duration = requester.timestamps ? ` ${requester.timestamps}ms` : "";

        return `${ansis.bold("Request -")} ${ansis.bgGray(method)} ${url} ${status}${duration}`;
    }

    private getStatusCodeColor(statusCode: number): string {
        const httpStatus5XX = 500;

        if (statusCode >= httpStatus5XX) return "#FF0000";

        const httpStatus4XX = 400;

        if (statusCode >= httpStatus4XX) return "#FFFF00";

        const httpStatus3XX = 300;

        if (statusCode >= httpStatus3XX) return "#00FFFF";

        const httpStatus2XX = 200;

        return statusCode >= httpStatus2XX ? "#00FF00" : "#FFA500";
    }

}
