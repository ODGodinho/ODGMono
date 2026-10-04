import type { AnyContractRouter } from "@orpc/contract";
import { OpenAPIGenerator } from "@orpc/openapi";
import type { Context as OrpcContext, Router } from "@orpc/server";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";

import type { OpenApiDocumentOptionsInterface } from "../interfaces/HttpOptionsInterface.ts";
import type { HttpDispatchType, HttpRequestInterface } from "../interfaces/HttpRequestInterface.ts";
import type { MiddlewareInterface } from "../interfaces/MiddlewareInterface.ts";

/**
 * Serves the generated OpenAPI document at one path.
 *
 * Separate from `OpenApiMiddleware` because publishing the spec is a product decision, not a
 * consequence of speaking REST: an internal API drops this line and stops advertising its own
 * shape, and an API that speaks only `/rpc` never has to name a public title at all.
 *
 * It has to sit **above** the REST transport in the array — `/api/openapi` is under `/api`, so the
 * transport would claim the path first and answer 404.
 */
export class OpenApiDocumentMiddleware<ContextType extends OrpcContext> implements MiddlewareInterface {

    private document?: Promise<unknown>;

    public constructor(
        private readonly router: Router<AnyContractRouter, ContextType>,
        private readonly options: OpenApiDocumentOptionsInterface,
    ) {
    }

    /**
     * Answers the document path, and hands everything else down.
     *
     * @param {HttpRequestInterface} context The request and its correlation id
     * @param {HttpDispatchType} next The rest of the pipeline
     * @returns {Promise<Response>} The document, or the rest of the pipeline's response
     */
    public async handle(context: HttpRequestInterface, next: HttpDispatchType): Promise<Response> {
        if (new URL(context.request.url).pathname !== this.options.path) {
            return next(context);
        }

        /*
         * Generated on first request rather than at boot: generation is pure — it reads the router
         * the process already holds — so this costs one request instead of every startup, and
         * removes the async construction step the app would otherwise need. The promise is
         * memoized rather than the value, so concurrent first requests generate once.
         */
        this.document ??= this.generate();

        return Response.json(await this.document);
    }

    /**
     * Builds the document from the router's own schemas.
     *
     * @returns {Promise<unknown>} The generated document
     */
    private async generate(): Promise<unknown> {
        const defaultVersion = "0.0.0";
        const { title, version, schemaConverters } = this.options;
        const generator = new OpenAPIGenerator({
            schemaConverters: schemaConverters ?? [ new ZodToJsonSchemaConverter() ],
        });

        return generator.generate(this.router, { info: { title, version: version ?? defaultVersion } });
    }

}
