import type { HttpPathType } from "../interfaces/HttpOptionsInterface.ts";
import type { HttpDispatchType, HttpRequestInterface } from "../interfaces/HttpRequestInterface.ts";
import type { MiddlewareInterface } from "../interfaces/MiddlewareInterface.ts";

/**
 * Legacy addresses that keep answering: one canonical path, and the pathnames that reach it.
 *
 * The rewrite happens on the way down, so every stage below sees the canonical path — including the
 * surfaces that route on it. What a stage **above** sees is the original, which is why an access log
 * placed above this one records the address the client actually called and one placed below records
 * the canonical one. That is a choice the array makes, not a rule this class carries.
 *
 * Matching is the whole pathname, never a prefix: prefix matching would make this a router, and
 * routers are the surface middlewares.
 */
export class AliasMiddleware implements MiddlewareInterface {

    /** Every legacy pathname, pointing at the canonical path it is rewritten onto. */
    private readonly targets: Map<string, HttpPathType>;

    public constructor(aliases: Record<HttpPathType, HttpPathType[]>) {
        this.targets = new Map(
            Object.entries(aliases).flatMap(([ target, sources ]) => sources.map(
                (source): [ string, HttpPathType ] => [ source, target as HttpPathType ],
            )),
        );
    }

    /**
     * Rewrites the request onto its canonical path, or passes it through untouched. Method, headers
     * and body all survive: `new Request(url, request)` copies them from the original.
     *
     * @param {HttpRequestInterface} context The request and its correlation id
     * @param {HttpDispatchType} next The rest of the pipeline
     * @returns {Promise<Response>} The rest of the pipeline's response
     */
    public async handle(context: HttpRequestInterface, next: HttpDispatchType): Promise<Response> {
        const url = new URL(context.request.url);
        const target = this.targets.get(url.pathname);

        if (target === undefined) {
            return next(context);
        }

        url.pathname = target;

        return next({ ...context, request: new Request(url, context.request) });
    }

}
