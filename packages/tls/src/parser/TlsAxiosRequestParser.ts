import querystring from "node:querystring";

import { AxiosRequestParser } from "@odg/axios";
import type { ProxyConfigInterface } from "@odg/message";
import type { AxiosRequestConfig } from "axios";

import type { TlsAxiosRequestConfigExtra, TlsRequestInterface } from "../interfaces/TlsOptionsInterface";

export class TlsAxiosRequestParser extends AxiosRequestParser {

    /**
     * Headers to remove from the request
     */
    private static readonly removeTlsHeaders = [
        "poptls-url",
        "poptls-proxy",
        "poptls-allowredirect",
        "poptls-timeout",
    ];

    /**
     * Parse MessageInterface to Axios
     *
     * @template {any} RequestD Dados Request Axios
     * @template {Record<string, unknown>} ExtraData Dados Request Axios extras
     * @param {Partial<TlsRequestInterface<RequestD>>} options Dados Request
     * @returns {AxiosRequestConfig<RequestD>}
     */
    public static override parseMessageToLibrary<RequestD>(
        options: Partial<TlsRequestInterface<RequestD>>,
    ): AxiosRequestConfig<RequestD> {
        const allowRedirect = String(this.getAllowRedirect(options));

        return Object.fromEntries(Object.entries({
            ...super.parseMessageToLibrary(options),
            url: options.tls!.url,
            proxy: undefined,
            baseURL: undefined,
            headers: {
                ...options.headers,
                "poptls-url": this.getUrl<RequestD>(options),
                "poptls-proxy": this.getProxyUrl(options.proxy),
                "poptls-allowredirect": allowRedirect,
                "poptls-timeout": this.getTimeInSeconds(options),
            },
            $tlsOptions: {
                url: options.url,
                baseUrl: options.baseURL,
                proxy: options.proxy,
                tls: options.tls,
            },
        } as TlsAxiosRequestConfigExtra<RequestD>).filter(([ , value ]) => value !== undefined));
    }

    /**
     * Parse Request Axios configuration
     *
     * @template {any} RequestD Dados Request Axios
     * @param {TlsAxiosRequestConfigExtra<RequestD>} config Dados Request
     * @returns {TlsRequestInterface<RequestD>}
     */
    public static override parseLibraryToMessage<RequestD>(
        config: TlsAxiosRequestConfigExtra<RequestD>,
    ): TlsRequestInterface<RequestD> {
        const allHeadersWhiteoutTls = Object.entries(config.headers ?? {})
            .filter(([ headerName ]) => !this.removeTlsHeaders.includes(headerName.toLowerCase()));

        return Object.fromEntries(
            Object.entries({
                ...super.parseLibraryToMessage(config),
                url: config.$tlsOptions?.url,
                baseURL: config.$tlsOptions?.baseUrl,
                proxy: config.$tlsOptions?.proxy,
                tls: config.$tlsOptions?.tls,
                headers: Object.fromEntries(allHeadersWhiteoutTls),
            } as TlsRequestInterface<RequestD>).filter(([ , value ]) => value !== undefined),
        );
    }

    private static getUrl<RequestD = unknown>(
        options: Partial<TlsRequestInterface<RequestD>>,
    ): string {
        return `${options.baseURL ?? ""}${options.url ?? ""}${this.getUrlParams(options)}`;
    }

    private static getUrlParams<RequestD = unknown>(
        options: Partial<TlsRequestInterface<RequestD>>,
    ): string {
        if (!options.params) {
            return "";
        }

        return `?${querystring.stringify(options.params as Record<string, string>)}`;
    }

    private static getProxyUrl(proxy: ProxyConfigInterface | false | undefined): string | undefined {
        if (!proxy) return;

        const proxyPort = proxy.port ? `:${proxy.port}` : "";

        if (proxy.auth?.username) {
            return `${proxy.protocol}://${proxy.auth.username}:${proxy.auth.password}@${proxy.host}${proxyPort}`;
        }

        return `${proxy.protocol}://${proxy.host}${proxyPort}`;
    }

    private static getAllowRedirect<RequestD = unknown>(
        options: Partial<TlsRequestInterface<RequestD>>,
    ): boolean {
        return options.tls?.allowRedirect ?? true;
    }

    private static getTimeInSeconds<RequestD = unknown>(
        options: Partial<TlsRequestInterface<RequestD>>,
    ): number | undefined {
        const { timeout } = options;

        if (typeof timeout === "number") {
            const miliSecondsToSeconds = 1000;

            const newTimeout = Math.trunc(timeout / miliSecondsToSeconds);

            return Math.max(newTimeout, 0);
        }

        return undefined;
    }

}
