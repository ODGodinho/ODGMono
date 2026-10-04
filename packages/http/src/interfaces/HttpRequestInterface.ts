/**
 * One request as the pipeline carries it: the request plus the correlation id already resolved, so
 * no stage has to re-read a header or generate a second id.
 *
 * The id is a field rather than a header lookup because the pipeline **guarantees** it: a
 * `headers.get()` returns `string | null` and would make every stage handle a case that cannot
 * happen.
 */
export interface HttpRequestInterface {
    request: Request;
    requestId: string;
}

/** Hands a request to the next stage. The last stage of all is the pipeline's own 404. */
export type HttpDispatchType = (context: HttpRequestInterface) => Promise<Response>;
