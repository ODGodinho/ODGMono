# Runtime — API

Entry ring for an HTTP API built on `@odg/http` + oRPC (Stanley-API layout). Read [architecture.md](../architecture.md) for the universal spine first.

## Entry ring

```text
src/
    app/
        RequestContainer.ts         Child Container created per-request
    index.ts            creates the Container and calls Kernel.boot() — decides nothing
    Http/
        HttpServer.ts   Bun.serve + pipeline composition (deploy decisions only)
        context.ts      HttpContext + the oRPC `base`
        paths.ts        path constants that 2+ files must agree on
        Routes/
            <feature>.ts    procedures only — `show` · `store` · `update` · `destroy`
            index.ts        barrel: one `export * as <feature>` line per feature
        index.ts        barrel
    database/
        schema/         Drizzle schema — the schema SSOT
        DatabaseSeeder.ts
        Seeders/<Name>Seeder.ts
```

**The pipeline is a package, not repo code.** `@odg/http` answers *how a request becomes a response* — correlation, error contract, CORS, access log, routing — identical in every ODG API. `HttpServer` owns only what is a deploy decision: port, hostname, max body size, what "close" means, and which procedures, handlers and origins this API has. A package **MUST NOT** open a server.

`HttpServer.create()` is the composition point and the object the test suite drives — the same one `listen()` hands to the runtime, with no port and no parallel path.

## Surfaces

| Route | Protocol | Error body |
| --- | --- | --- |
| `/rpc/*` | oRPC native | oRPC native frame (what `@orpc/client` rebuilds as `ORPCError`) |
| `/api/*` | REST/OpenAPI | `ExceptionObjectLoggerInterface` from `@odg/json-log` |
| `/api/openapi` | JSON spec | — |
| `/api/health` | readiness (DB probe, 1 s timeout) | 503 when degraded |
| `/api/health/live` | liveness, no I/O | — |

- Success returns the procedure payload **raw** — no `success`, no `data` wrapper.
- `APP_ENV=production` strips stack and paths from the error body.
- Correlation is the `x-request-id` **header**, never the body.
- Liveness **MUST NOT** touch the database: a DB outage takes pods out of rotation (readiness), it does not restart them.

## Routes

**Create with the CLI, never by hand** — it writes the files, the barrels and the test, and never overwrites. See [commands.md](../commands.md).

```bash
$$PM odg make:route <feature> --service   # procedure + validator + interface + Service + barrels + test
$$PM odg make:middleware <Name>           # MiddlewareInterface class + test; the HttpServer line is yours
```

What the generated route keeps true afterwards:

- A route resolves the Service from `context.container` and translates the result — nothing else. A route querying the database is a failed review, not a compile error.
- **The router is the barrel** (`Routes/index.ts`, one `export * as <feature>` per feature). **MUST NOT** add an `export const router = { ... }` to keep in sync.
- **A route file exports procedures only.** Any other export reaches oRPC as a route; a constant shared by 2+ files goes to `src/Http/paths.ts`.
- `HttpContext` has **no `headers`**: the raw `Request` is the `ContainerName.Request` binding. A second path to the same fact is how a Service ends up receiving request data by parameter.
- **Decorator-based controllers were evaluated and rejected** (no fetch-native + oRPC + inversify package exists; building one costs a custom framework whose failure mode is an unreadable type error). **MUST NOT** reopen without a new argument.

## Request scope — `RequestContainer`

`HttpServer` creates a child Container per request; it is `context.container`. **Everything exclusive to one request MUST be bound in the `RequestContainer`** (today `Request`, `RequestId`, `Server`; later the verified user, a requester carrying the trace id). Everything else resolves from the parent. In a worker the unit is the job: one child per job.

**Request data is a dependency, not an argument**: whoever needs it injects it.

The logger is **not** per request: it is one process `Logger` built with `scopes: new AsyncLocalStorage()`, and the entry point opens one `scope()` per request. Read `@odg/log`'s `AGENTS.md` before touching it.

| Lifetime | Declared as | Use |
| --- | --- | --- |
| process | `@ODGDecorators.injectable(Name, "Singleton")` | state that outlives the request (cache, lock, single-flight) |
| per injection | `@ODGDecorators.injectable(Name)` (no scope) — `make:service --request` | any class that injects a `RequestContainer` binding |
| per request | child binding, constant or `.inSingletonScope()` | one object shared by every class of that request |

- A class injecting a `RequestContainer` binding **MUST NOT** be `"Singleton"`; `Container.warm()` fails the boot naming it.
- In a child binding, `toDynamicValue` without `.inSingletonScope()` hands a different object to each class.
- A late binding (a middleware publishing the verified user) uses `rebind`; two `bind` of the same name in one child break `get` with `Ambiguous bindings found`.
- The context factory is **synchronous**: a child binding **MUST NOT** read Config. Read it once in `HttpServer.create()` and pass it down the constructor.

## Cross-cutting concerns

| Concern | Where |
| --- | --- |
| rate limit, IP allowlist, maintenance mode, tracing | `middlewares` in `HttpServer.create()` |
| authorization, tenancy, RBAC, input shaping | oRPC middleware (`base.use(...)`), sees the typed context |
| new protocol with its own prefix (webhook, upload) | `HttpHandlerInterface` in `handlers` |

None of them edits the pipeline — that is what lets the API scale without forking `@odg/http`.

### Auth

The template ships **without auth**; it is a product decision. The slot:

| Auth shape | Where it enters |
| --- | --- |
| SDK speaking `Request`/`Response` with its own prefix (better-auth, Clerk) | a class implementing `MiddlewareInterface`, bound in `Container`, one line in the `HttpServer.create()` array — **before** the `/api` transport, which otherwise swallows the prefix |
| Bearer/JWT verified per procedure | a Singleton `AuthService` + an oRPC middleware publishing the caller |

Either way the verified user is a `RequestContainer` binding (`rebind`), not a method parameter.

## Lifecycle

```text
index.ts
 ├─ Container.setUp()   loadModule → bindKernel → Kernel.init() → bindApp → warm()
 ├─ Kernel.boot()       registers infra listeners (pool.on("error")) → HttpServer.listen()
 └─ Kernel.shutdown()   HttpServer.close() → DatabasePool.end() → final log
```

`close()` waits for `stop()` to drain within `HTTP_SHUTDOWN_TIMEOUT`; on timeout **or** failure the error is logged via `detach` and the server is aborted with `stop(true)`. The Container only **builds** infra; listeners on infra are registered in `boot()`, so a standalone script that does not boot (seed) has none.

## Database

- Connection is separate fields (`DB_HOST`, `DB_PORT`, …), **never** a `DATABASE_URL`.
- `src/database/schema/index.ts` starts empty, so `src/database/index.ts` does **not** re-export it (an export-less barrel is a lint error). Add the line back with the first table.
- A seeder populates **minimum initial data** and is idempotent. Registering one = the class + the `DatabaseSeeder` list + the `Seeders/` barrel.
- Dialect lives in `Container.ts` (`DatabasePool`/`Database` bindings), `DatabaseInterface.ts`, `ContainerInterface.d.ts` and the schema helpers. Switching dialect touches exactly those plus deps, compose and CI.

## Exceptions

A domain exception extends `HttpException` from `@odg/http` (which carries `statusCode`) and lives in `src/Exceptions/` — a new folder, so it brings its barrel and alias ([architecture.md](../architecture.md) → *The alias contract*).

## Traps

- `exports["./router"]` in `package.json` points at `dist/Http/Routes/index.js`; consumers import `import type * as AppRouter from "<api>/router"`. Renaming or moving `Routes/` silently breaks every typed client.
- `coverage.include` is **REQUIRED** in `vite.config.mts`: a `bun link`ed dependency resolves outside `node_modules/` and istanbul instruments the whole package.
