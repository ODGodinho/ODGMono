# ODG Message - Consumer Guide

Use this file as the package-level source of truth for AI agents and developers integrating `@odg/message`.

## Purpose

- Standardize TypeScript request/response contracts for HTTP or messaging clients.
- Allow applications to plug in their own implementation through `MessageInterface`.
- Example plug in `AxiosMessage` in `@odg/axios` to message with axios package.
- Provide unified exceptions and type guards for safe error handling.

## Integration/Review Rules

- All messages is typed with `MessageInterface<Req, Res>`
- In `RequestInterface<RequestData>`:
  - `RequestInterface.method` **MUST** use `Methods` enum when available, **MAY** use `string` for non-standard/custom verbs.
  - `RequestInterface.baseUrl` **MUST** be domain-only and **MUST NOT** include a `/` at the end.
  - `RequestInterface.url` **MUST** be a path that starts with `/` and represents the endpoint path to call.
- Interceptor IDs returned by `use(...)` **MUST** be stored when lifecycle cleanup is needed, then removed with `eject(id)`.
- Unknown types **MUST** be narrowed with `ODGMessage.isMessage(...)` or `ODGMessage.isMessageError(...)` before accessing message-specific fields, **MUST NOT** use instanceof.

## Known Integration Pitfalls

- `getMessageResponse()` can be `undefined` when `request` or `response` is absent.
- `RequestInterface` is intentionally flexible; concrete clients **SHOULD** validate required fields.
- `CacheableLookup` depends on `@odg/cache`; exception flows depend on `@odg/exception` when those features are used.
