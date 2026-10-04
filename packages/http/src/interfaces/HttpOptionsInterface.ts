import type { LoggerInterface } from "@odg/log";
import type { OpenAPIGeneratorOptions } from "@orpc/openapi";
import type { Context as OrpcContext, ORPCError } from "@orpc/server";

import type { ExceptionSerializer } from "../ExceptionSerializer.ts";

import type { HttpRequestInterface } from "./HttpRequestInterface.ts";
import type { MiddlewareInterface } from "./MiddlewareInterface.ts";

/** A mount point. Typed so a prefix cannot be given without its leading slash. */
export type HttpPathType = `/${string}`;

/** The oRPC error code an `ORPCError` accepts as its first argument. */
export type OrpcErrorCodeType = ConstructorParameters<typeof ORPCError>[0];

/**
 * What an interceptor needs from oRPC's own call options: only the ability to run the rest of the
 * procedure. The real object carries `context`, `input`, `errors`, `path`, `procedure`, `signal`
 * and `lastEventId` too, but reading none of them is what keeps this package decoupled from oRPC's
 * own generics.
 */
export interface OrpcClientNextOptionsInterface {
    next(): Promise<unknown>;
}

/** A `clientInterceptors` entry — what `RPCHandler` and `OpenAPIHandler` both accept. */
export type OrpcClientInterceptorType = (options: OrpcClientNextOptionsInterface) => Promise<unknown>;

export interface HttpPipelineOptionsInterface {

    /**
     * The whole composition, outermost first. Everything the pipeline does beyond correlation and
     * answering is in here, including the error contract.
     */
    middlewares: MiddlewareInterface[];

    /**
     * Header the correlation id is read from and echoed on. Defaults to
     * `HttpPipeline.requestIdHeader` (`x-request-id`).
     */
    requestIdHeader?: string;

    /**
     * Where the last-resort failure is recorded — the one a middleware chain without an
     * `ErrorBoundaryMiddleware` would otherwise lose. Optional on purpose: a pipeline whose array
     * carries the boundary never reaches it.
     */
    logger?: LoggerInterface;
}

export interface ErrorBoundaryOptionsInterface {

    /**
     * Turns anything thrown into the response body. The **same instance** belongs to
     * `OpenApiMiddleware`, so an exception raised inside a procedure and one raised outside come
     * back in one contract.
     */
    serializer: ExceptionSerializer;

    logger: LoggerInterface;
}

export interface CorsOptionsInterface {

    /**
     * Browser origins allowed to read a response. The matching origin is echoed back rather than
     * answered with `*`, which is illegal together with `Access-Control-Allow-Credentials: true` —
     * the browser would drop the session cookie.
     */
    origins: string[];

    methods?: string[];

    maxAgeSeconds?: number;
}

export interface StatusInterceptorOptionsInterface {

    /**
     * An infrastructure failure the project wants answered with a specific status (typically 503)
     * instead of 500 — a datastore client rarely carries a `statusCode` of its own. Receives the
     * thrown value and returns the status, or `undefined` to let it through.
     *
     * @param {unknown} exception The thrown value
     * @returns {number | undefined} Status to apply, or `undefined`
     */
    infrastructureStatus?(exception: unknown): number | undefined;
}

export interface OrpcTransportOptionsInterface<ContextType extends OrpcContext> {

    prefix?: HttpPathType;

    /**
     * `clientInterceptors` for every procedure call. Defaults to `[ statusInterceptor() ]`, which
     * is what makes a domain exception's `statusCode` survive the transport; `[]` removes it, and
     * every such exception then reaches the client as 500.
     */
    interceptors?: OrpcClientInterceptorType[];

    /**
     * Builds the per-request context the procedures receive. Called once per request, only for the
     * paths this transport claims.
     *
     * @param {HttpRequestInterface} context The request and its correlation id
     * @returns {ContextType} Context handed to the procedures
     */
    context(context: HttpRequestInterface): ContextType;
}

export interface OpenApiOptionsInterface<ContextType extends OrpcContext>
    extends OrpcTransportOptionsInterface<ContextType> {

    /** Encodes a procedure's failure on the REST surface. The same instance the boundary holds. */
    serializer: ExceptionSerializer;
}

export interface OpenApiDocumentOptionsInterface {

    /** Where the document is served. Exact pathname — there is no prefix matching here. */
    path: HttpPathType;

    /** Public API title in the generated document. */
    title: string;

    version?: string;

    schemaConverters?: OpenAPIGeneratorOptions["schemaConverters"];
}
