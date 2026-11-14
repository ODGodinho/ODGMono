import type {
    InterceptorManager,
    MessageInterceptorOptions,
    onFulfilledType,
    onRejectedType,
} from "@odg/message";
import type { AxiosInterceptorManager } from "axios";

import { AxiosParser } from "../parser/AxiosParser.ts";

export abstract class AxiosInterceptor<AxiosInterceptor> implements InterceptorManager<unknown> {

    public constructor(
        protected readonly interceptor: AxiosInterceptorManager<AxiosInterceptor>,
    ) {
    }

    public eject(id: number): void {
        this.interceptor.eject(id);
    }

    public clear(): void {
        this.interceptor.clear();
    }

    protected onRejected(onRejected?: onRejectedType) {
        return async (error: unknown): Promise<never> => {
            const parserError = AxiosParser.parseException(error);

            if (!onRejected) {
                throw parserError;
            }

            return onRejected(
                parserError,
            );
        };
    }

    public abstract use(
        onFulfilled?: onFulfilledType<unknown>,
        onRejected?: onRejectedType,
        options?: MessageInterceptorOptions
    ): number;

}
