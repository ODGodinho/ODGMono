# ODG Message - Consumer Guide

Use this file as the package-level source of truth for AI agents and developers integrating `@odg/message`.

## Purpose

- Standardize TypeScript request/response contracts for HTTP or messaging clients.
- Allow applications to plug in their own implementation through `MessageInterface`.
- Example plug in `AxiosMessage` in `@odg/axios` to message with axios package.
- Provide unified exceptions and type guards for safe error handling.

## Rules

- All messages is typed with `MessageInterface<Req, Res>`
- In `RequestInterface<RequestData>`:
  - `RequestInterface.method` **MUST** use `Methods` enum when available, **MAY** use `string` for non-standard/custom verbs.
  - `RequestInterface.baseUrl` **MUST** be domain-only and **MUST NOT** include a `/` at the end.
  - `RequestInterface.url` **MUST** be a path that starts with `/` and represents the endpoint path to call.
- Interceptor IDs returned by `use(...)` **MUST** be stored when lifecycle cleanup is needed, then removed with `eject(id)`.
- Defaults (constructor and `setDefaultOptions`, every field, not only headers) **MUST NOT** reach the request interceptors: `config` in an interceptor holds only what the request parameter sent (plus `startTime`). Interceptors that need the defaults read `getDefaultOptions()`, which does not include `ODGMessage.defaultOptions`.
  - For defaults, `@odg/message` provides only `ODGMessage.defaultOptions`. Each `MessageInterface` implementation **MUST** run the request interceptors itself and merge the defaults after them, right before sending. Priority, lowest to highest: `ODGMessage.defaultOptions` < instance defaults (constructor + `setDefaultOptions`) < request interceptor < request parameter.
  - Top-level fields: a field the request left `undefined` takes the default. Object fields (`params`, `proxy`, `extras`...) are replaced whole, not deep-merged.
  - Headers: merged by name, case-insensitive. The request headers keep their order, then the missing instance headers, then the missing `ODGMessage.defaultOptions` headers. A request header set to `undefined` (by the request or an interceptor) is removed, even when a default has it, like axios does.
    - Trap: an interceptor that fills missing headers (`{ cookie: cond ? value : undefined, ...config.headers }`) removes the instance header it cannot see whenever it writes `undefined`. To keep the instance header, read it from `getDefaultOptions().headers`.
  - `setDefaultOptions` replaces the instance defaults (constructor included): nothing from the previous defaults survives. To change one field, call `setDefaultOptions({ ...getDefaultOptions(), field })`.
  - An interceptor that overwrites a field (`{ ...config.headers, accept: x }`) wins even over the request parameter; implementations cannot prevent it.
- Unknown types **MUST** be narrowed with `ODGMessage.isMessage(...)` or `ODGMessage.isMessageError(...)` before accessing message-specific fields, **MUST NOT** use instanceof.

## Known Integration Pitfalls

- `getMessageResponse()` can be `undefined` when `request` or `response` is absent.
- `RequestInterface` is intentionally flexible; concrete clients **SHOULD** validate required fields.
- `CacheableLookup` depends on `@odg/cache`; exception flows depend on `@odg/exception` when those features are used.
