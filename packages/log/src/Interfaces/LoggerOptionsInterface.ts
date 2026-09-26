import type { ContextType } from "./LoggerInterface.ts";

/**
 * What `Logger` uses of an `AsyncLocalStorage`, declared here so this package never imports `node:`
 * and keeps working in a browser: the server passes `new AsyncLocalStorage()`, and the browser or a
 * robot that runs one thing at a time passes nothing.
 */
export interface LoggerScopeStorageInterface {
    getStore(): ContextType | undefined;
    run<R>(store: ContextType, callback: () => R): R;
}

export interface LoggerOptionsInterface {

    /**
     * Makes `withContext` belong to the unit of work being served — a request, a job — instead of
     * to the whole logger. See `Logger.scope`.
     */
    scopes?: LoggerScopeStorageInterface;
}
