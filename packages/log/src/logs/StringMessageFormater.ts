import util from "node:util";

import chalk from "chalk";

import type { JSONLogFormattable } from "./json-log-formattable";

export class StringMessageFormatter {

    public format(message: JSONLogFormattable): string {
        if (message.request) return this.formatRequester(message);

        if (message.exception) {
            return `${chalk.whiteBright.bold("Exception -")} ${message.exception.stack}`;
        }

        return util.format(message.message || message);
    }

    private formatRequester(message: JSONLogFormattable): string {
        const requester = message.request!;
        const url = chalk.white(`${requester.baseURL! || ""}${requester.url! || ""}`);
        const statusCode = message.request?.response?.status;
        const status = statusCode
            ? chalk.bgHex(this.getStatusCodeColor(statusCode)).white(statusCode)
            : chalk.bgGrey("XXX");
        const method = (requester.method ?? "GET").toUpperCase();

        return `${chalk.bold("Request -")} ${chalk.bgGrey(method)} ${url} ${status}`;
    }

    private getStatusCodeColor(statusCode: number): string {
        const httpStatus5XX = 500;

        if (statusCode >= httpStatus5XX) return "#FF0000";

        const httpStatus4XX = 400;

        if (statusCode >= httpStatus4XX) return "#FFFF00";

        const httpStatus3XX = 300;

        if (statusCode >= httpStatus3XX) return "#00FFFF";

        const httpStatus2XX = 200;

        if (statusCode >= httpStatus2XX) return "#00FF00";

        return "#FFA500";
    }

}
