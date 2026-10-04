# @odg/http

The stages an ODG API's ENTRY ring is built from — the error contract, CORS, aliases, the oRPC and
REST transports, the OpenAPI document — and a pipeline that runs the ones you picked, in the order
you picked them.

Nothing here turns itself on. A feature you leave out of the array is absent at runtime; there is no
flag to disable it and no option object to fill in for it.

It speaks only the web `Request`/`Response` pair — no runtime API, no socket — so it runs anywhere
and a suite can drive the whole request path without binding a port. Opening the server stays with
the application: port, hostname, body limit and drain semantics are deploy decisions.

## Install

```bash
bun add @odg/http
```

## Use

```typescript
import {
    CorsMiddleware,
    ErrorBoundaryMiddleware,
    ExceptionSerializer,
    HttpPipeline,
    OpenApiDocumentMiddleware,
    OpenApiMiddleware,
    RpcMiddleware,
} from "@odg/http";

const serializer = new ExceptionSerializer(false);

const pipeline = new HttpPipeline({
    logger,
    middlewares: [
        new ErrorBoundaryMiddleware({ logger, serializer }),
        new CorsMiddleware({ origins: [ "https://app.example.com" ] }),
        new OpenApiDocumentMiddleware(router, { path: "/api/openapi", title: "My API" }),
        new RpcMiddleware(router, { context, prefix: "/rpc" }),
        new OpenApiMiddleware(router, { context, prefix: "/api", serializer }),
    ],
});

Bun.serve({ fetch: async (request) => pipeline.fetch(request), port: 3000 });
```

`pipeline.fetch(request)` is the very function the runtime receives — a test calls it directly, with
no socket and no parallel code path.

## One interface

```typescript
interface MiddlewareInterface {
    handle(context: HttpRequestInterface, next: HttpDispatchType): Promise<Response>;
}
```

Everything is one of these: what the package ships, and what your app writes. The array's order is
the nesting — an earlier entry wraps every later one — so what a stage does **after**
`await next(context)` is its response phase, and it sees every response the stages below produced,
the serialized exceptions included.

That is why an access log belongs **above** `ErrorBoundaryMiddleware`, and why the package does not
ship one: which routes are noise and what a line should say is your API's vocabulary, not HTTP's.

## What the pipeline itself guarantees

Three things, and deliberately nothing else: a correlation id on every request and every response, a
404 when no stage answered, and a bare status instead of a dropped connection if nothing caught a
throw. The error *contract* is a middleware, because where it sits changes what the rest of the
array can see.

## What each surface answers

| Route | Protocol | Error body | Consumer |
| --- | --- | --- | --- |
| `/rpc/*` | native oRPC | oRPC's own frame | the typed client |
| `/api/*` | REST/OpenAPI | structured exception | external consumers |
| `/api/openapi` | JSON spec | — | tooling |
| a stage you wrote | whatever it is | its own | e.g. an auth SDK |

A success response is the procedure's payload, raw — no `success`, no `data` wrapper. The HTTP
status already carries the outcome. A failure is the `ExceptionObjectLoggerInterface` shape from
`@odg/json-log`, so the body an API consumer sees and the line in Graylog share one vocabulary.

## Where a cross-cutting concern goes

| Concern | Where |
| --- | --- |
| rate limit, IP allowlist, maintenance mode, tracing, access log | a `MiddlewareInterface` in the array |
| authorization, tenancy, RBAC, input shaping | oRPC middleware (`base.use(...)`) — needs the typed context |
| a whole new protocol on its own prefix | a `MiddlewareInterface` that claims its own paths |

See [AGENTS.md](./AGENTS.md) for the full rules and pitfalls.
